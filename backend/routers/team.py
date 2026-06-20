"""'같이 집중' 모임 라우터.

멤버의 개인 집중 세션을 합산해 공유 목표/리더보드를 만든다.
멤버 이름은 auth_store 에서 서버가 조회(클라 입력 불신).
실시간 접속은 heartbeat + 60초 TTL 인메모리 맵.
"""
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from auth_store import auth_store
from session_store import session_store
from team_models import (
    FeedItem,
    Group,
    GroupSummary,
    LeaderRow,
    PresenceRow,
)
from team_store import GroupError, team_store

router = APIRouter(prefix="/api/teams", tags=["teams"])

KST = timezone(timedelta(hours=9))
PRESENCE_TTL = 60          # 초: 이 시간 내 heartbeat 면 '집중 중'
GOAL_PER_MEMBER = 60       # 분/일: 멤버 1인당 공유 목표 기여분

# presence: group_id -> { user_id -> (last_beat_ts, task) }
_presence: Dict[str, Dict[str, tuple]] = {}
_presence_lock = Lock()


def _uid(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요해요")
    return x_user_id


def _name(user_id: str) -> str:
    return auth_store.display_name(user_id)


def _today_kst():
    return datetime.now(KST).date()


# ---- 요청 모델 ----
class CreateBody(BaseModel):
    name: str = Field(default="같이 집중", max_length=40)


class JoinBody(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)


class HeartbeatBody(BaseModel):
    task: Optional[str] = Field(default=None, max_length=200)


# ---- 모임 생성/참여/내 모임 ----
@router.post("", response_model=Group, status_code=201)
async def create_group(body: CreateBody, x_user_id: str | None = Header(default=None)) -> Group:
    uid = _uid(x_user_id)
    return team_store.create(body.name, uid, _name(uid))


@router.post("/join", response_model=Group)
async def join_group(body: JoinBody, x_user_id: str | None = Header(default=None)) -> Group:
    uid = _uid(x_user_id)
    try:
        return team_store.join(body.code, uid, _name(uid))
    except GroupError as e:
        msg = {"not_found": "코드를 찾을 수 없어요", "full": "정원이 가득 찼어요"}.get(str(e), str(e))
        raise HTTPException(status_code=404 if str(e) == "not_found" else 400, detail=msg)


@router.get("/mine", response_model=list[Group])
async def my_groups(x_user_id: str | None = Header(default=None)) -> list[Group]:
    return team_store.mine(_uid(x_user_id))


# ---- 요약(리더보드/목표/MVP) ----
@router.get("/{group_id}/summary", response_model=GroupSummary)
async def group_summary(group_id: str) -> GroupSummary:
    try:
        group = team_store.get(group_id)
    except GroupError:
        raise HTTPException(status_code=404, detail="모임을 찾을 수 없어요")

    today = _today_kst()
    rows: list[LeaderRow] = []
    total = 0
    for m in group.members:
        minutes = 0
        sessions = 0
        for s in session_store.list(m.user_id):
            if s.created_at.astimezone(KST).date() == today:
                minutes += s.duration_min
                sessions += 1
        total += minutes
        rows.append(LeaderRow(user_id=m.user_id, name=m.name, minutes=minutes, sessions=sessions))

    rows.sort(key=lambda r: r.minutes, reverse=True)
    goal = GOAL_PER_MEMBER * max(1, len(group.members))
    mvp = rows[0].user_id if rows and rows[0].minutes > 0 else None
    return GroupSummary(
        group_id=group.id,
        name=group.name,
        code=group.code,
        member_count=len(group.members),
        total_minutes=total,
        goal_minutes=goal,
        goal_progress=min(1.0, total / goal) if goal else 0.0,
        fire_level=total // 60,
        leaderboard=rows,
        mvp_id=mvp,
    )


# ---- 실시간 접속 ----
@router.post("/{group_id}/heartbeat", status_code=204)
async def heartbeat(group_id: str, body: HeartbeatBody, x_user_id: str | None = Header(default=None)):
    uid = _uid(x_user_id)
    with _presence_lock:
        _presence.setdefault(group_id, {})[uid] = (datetime.now(timezone.utc).timestamp(), body.task)
    return None


@router.get("/{group_id}/presence", response_model=list[PresenceRow])
async def presence(group_id: str) -> list[PresenceRow]:
    now = datetime.now(timezone.utc).timestamp()
    out: list[PresenceRow] = []
    with _presence_lock:
        entries = dict(_presence.get(group_id, {}))
    for uid, (ts, task) in entries.items():
        ago = int(now - ts)
        if ago <= PRESENCE_TTL:
            out.append(PresenceRow(user_id=uid, name=_name(uid), task=task, seconds_ago=ago))
    out.sort(key=lambda r: r.seconds_ago)
    return out


# ---- 불씨 피드(최근 완료 세션) ----
@router.get("/{group_id}/feed", response_model=list[FeedItem])
async def feed(group_id: str, limit: int = 15) -> list[FeedItem]:
    try:
        group = team_store.get(group_id)
    except GroupError:
        raise HTTPException(status_code=404, detail="모임을 찾을 수 없어요")
    items: list[FeedItem] = []
    for m in group.members:
        for s in session_store.list(m.user_id):
            if s.completed:
                items.append(
                    FeedItem(user_id=m.user_id, name=m.name, task=s.task, minutes=s.duration_min, at=s.created_at)
                )
    items.sort(key=lambda f: f.at, reverse=True)
    return items[:limit]
