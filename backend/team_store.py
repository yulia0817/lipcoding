"""'같이 집중' 모임 인메모리 저장소.

session_store 와 동일한 Lock + dict 패턴. DB가 필요하면 이 파일만 교체하세요.
- 6자 코드(헷갈리는 0/O/1/I 제외).
- 멤버 이름은 호출부가 auth_store 로 조회해 넘겨줍니다(서버 신뢰).
- user_id -> set(group_id) 역인덱스로 '내 모임' 조회.
"""
import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, List, Optional, Set

from team_models import Group, Member

KST = timezone(timedelta(hours=9))
MAX_MEMBERS = 8
CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 0,O,1,I 제외


class GroupError(Exception):
    """모임 생성/참여 실패."""


class TeamStore:
    def __init__(self) -> None:
        self._groups: Dict[str, Group] = {}
        self._by_code: Dict[str, str] = {}          # code -> group_id
        self._mine: Dict[str, Set[str]] = {}        # user_id -> {group_id}
        self._lock = Lock()

    def _gen_code(self) -> str:
        while True:
            code = "".join(random.choice(CODE_CHARS) for _ in range(6))
            if code not in self._by_code:
                return code

    def create(self, name: str, owner_id: str, owner_name: str) -> Group:
        name = (name or "").strip() or "같이 집중"
        with self._lock:
            gid = "g-" + uuid.uuid4().hex[:10]
            code = self._gen_code()
            group = Group(
                id=gid,
                code=code,
                name=name,
                owner_id=owner_id,
                members=[Member(user_id=owner_id, name=owner_name)],
            )
            self._groups[gid] = group
            self._by_code[code] = gid
            self._mine.setdefault(owner_id, set()).add(gid)
            return group

    def join(self, code: str, user_id: str, user_name: str) -> Group:
        code = (code or "").strip().upper()
        with self._lock:
            gid = self._by_code.get(code)
            if not gid:
                raise GroupError("not_found")
            group = self._groups[gid]
            existing = next((m for m in group.members if m.user_id == user_id), None)
            if existing:
                existing.name = user_name  # 이름 갱신, 멱등
            else:
                if len(group.members) >= MAX_MEMBERS:
                    raise GroupError("full")
                group.members.append(Member(user_id=user_id, name=user_name))
            self._mine.setdefault(user_id, set()).add(gid)
            return group

    def get(self, group_id: str) -> Group:
        with self._lock:
            group = self._groups.get(group_id)
        if not group:
            raise GroupError("not_found")
        return group

    def find_by_code(self, code: str) -> Optional[Group]:
        code = (code or "").strip().upper()
        with self._lock:
            gid = self._by_code.get(code)
            return self._groups.get(gid) if gid else None

    def mine(self, user_id: str) -> List[Group]:
        with self._lock:
            ids = list(self._mine.get(user_id, set()))
            return [self._groups[i] for i in ids if i in self._groups]

    def member_ids(self, group_id: str) -> List[str]:
        return [m.user_id for m in self.get(group_id).members]


team_store = TeamStore()
