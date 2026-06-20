"""스탠드업 생성 라우터.

집중 세션(사용자별) + GitHub 커밋(저장소 헤더)을 모아
'어제 한 일 / 오늘 할 일 / 블로커' 스탠드업을 생성한다.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Header

from github_store import GitHubError, fetch_commits
from session_store import KST, session_store
from standup_store import build_context, generate_standup

router = APIRouter(prefix="/api/standup", tags=["standup"])


def _kst_day_iso(offset_days: int = 0) -> str:
    d = (datetime.now(KST) + timedelta(days=offset_days)).date()
    return d.isoformat()


@router.get("")
async def standup(
    x_user_id: Optional[str] = Header(default=None),
    x_gh_repo: Optional[str] = Header(default=None),
    x_gh_token: Optional[str] = Header(default=None),
) -> dict:
    today_iso = _kst_day_iso(0)
    yest_iso = _kst_day_iso(-1)

    days = session_store.daily_breakdown(x_user_id, days=3)
    by_date = {d.date: d for d in days}
    today_day = by_date.get(today_iso)
    yest_day = by_date.get(yest_iso)

    today_dict = today_day.model_dump() if today_day else None
    yest_dict = yest_day.model_dump() if yest_day else None

    yest_commits: list = []
    today_commits: list = []
    gh_error = None
    if x_gh_repo:
        # 어제 00:00(KST) ~ 오늘 24:00(KST) 범위의 커밋을 한 번에 조회 후 분배
        since = datetime.fromisoformat(f"{yest_iso}T00:00:00+09:00")
        until = datetime.fromisoformat(f"{today_iso}T00:00:00+09:00") + timedelta(days=1)
        try:
            commits = await fetch_commits(
                x_gh_repo,
                since=since.isoformat(),
                until=until.isoformat(),
                token=x_gh_token,
            )
            for c in commits:
                d = c.get("date")
                if not d:
                    continue
                cd = datetime.fromisoformat(d.replace("Z", "+00:00")).astimezone(KST).date().isoformat()
                if cd == today_iso:
                    today_commits.append(c)
                elif cd == yest_iso:
                    yest_commits.append(c)
        except GitHubError as e:
            gh_error = str(e)

    ctx = build_context(
        yesterday=yest_dict,
        today=today_dict,
        yesterday_commits=yest_commits,
        today_commits=today_commits,
    )
    result = await generate_standup(ctx)
    return {
        **result,
        "date": today_iso,
        "context": ctx,
        "gh_error": gh_error,
    }
