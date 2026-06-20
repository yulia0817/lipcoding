"""간단한 자체 로그인 저장소.

외부 OAuth 없이 username + password 로 가입/로그인.
- 비밀번호는 pbkdf2_hmac(sha256) + 솔트로 해시 저장 (평문 미저장).
- user_id 는 username 당 고정(UUID) → 기존 세션/프로필 데이터가 사용자에 귀속.
- 인메모리(Lock+dict). 영속성이 필요하면 이 파일만 DB로 교체하세요.
"""
import hashlib
import os
import uuid
from threading import Lock
from typing import Dict, Optional


class AuthError(Exception):
    """가입/로그인 실패."""


def _hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)


class AuthStore:
    def __init__(self) -> None:
        # username(소문자) -> {user_id, display_name, salt, hash}
        self._users: Dict[str, dict] = {}
        self._lock = Lock()

    def register(self, username: str, password: str, display_name: Optional[str] = None) -> dict:
        uname = username.strip().lower()
        if len(uname) < 2:
            raise AuthError("아이디는 2자 이상이어야 해요")
        if len(password) < 4:
            raise AuthError("비밀번호는 4자 이상이어야 해요")
        with self._lock:
            if uname in self._users:
                raise AuthError("이미 사용 중인 아이디예요")
            salt = os.urandom(16)
            record = {
                "user_id": "u-" + uuid.uuid4().hex[:12],
                "display_name": (display_name or username).strip(),
                "salt": salt,
                "hash": _hash(password, salt),
            }
            self._users[uname] = record
            return self._public(record)

    def login(self, username: str, password: str) -> dict:
        uname = username.strip().lower()
        with self._lock:
            record = self._users.get(uname)
        if not record or _hash(password, record["salt"]) != record["hash"]:
            raise AuthError("아이디 또는 비밀번호가 올바르지 않아요")
        return self._public(record)

    def _public(self, record: dict) -> dict:
        return {"user_id": record["user_id"], "display_name": record["display_name"]}

    def display_name(self, user_id: str) -> str:
        """user_id 로 표시 이름 조회. 멤버 이름을 서버가 신뢰해 채우기 위함.

        가입하지 않은 id(예: 테스터/익명)는 보기 좋은 기본값을 돌려줍니다.
        """
        with self._lock:
            for record in self._users.values():
                if record["user_id"] == user_id:
                    return record["display_name"]
        if user_id == "tester-demo":
            return "테스터"
        return "익명"


auth_store = AuthStore()
