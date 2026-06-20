"""GitHub 연동: 공개 저장소 커밋 조회 (MVP).

- 토큰 없이 공개 저장소의 커밋을 조회합니다(비인증 rate limit 60/h).
- 토큰(X-GH-Token)이 있으면 헤더에 실어 비공개 저장소·높은 rate limit 사용.
- httpx 로 GitHub REST API 직접 호출(컨테이너에 gh CLI 불필요).
- 데모 안전: 네트워크/권한 오류 시 GitHubError 로 변환해 라우터가 처리.
"""
from __future__ import annotations

from typing import List, Optional

import httpx

API_BASE = "https://api.github.com"
_TIMEOUT = httpx.Timeout(15.0)


class GitHubError(Exception):
    """GitHub API 호출 실패."""


def _headers(token: Optional[str]) -> dict:
    h = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "focus-scene",
    }
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def _parse_repo(repo: str) -> tuple[str, str]:
    """'owner/name' 또는 전체 URL 에서 (owner, name) 추출."""
    s = (repo or "").strip()
    if not s:
        raise GitHubError("저장소를 입력하세요 (예: owner/repo)")
    s = s.replace("https://github.com/", "").replace("http://github.com/", "")
    s = s.rstrip("/")
    if s.endswith(".git"):
        s = s[:-4]
    parts = [p for p in s.split("/") if p]
    if len(parts) < 2:
        raise GitHubError("저장소 형식은 owner/repo 예요")
    return parts[0], parts[1]


async def test_repo(repo: str, token: Optional[str] = None) -> dict:
    """저장소 접근 가능 여부 확인. {ok, full_name, private, default_branch}."""
    owner, name = _parse_repo(repo)
    url = f"{API_BASE}/repos/{owner}/{name}"
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            res = await client.get(url, headers=_headers(token))
    except httpx.HTTPError as e:
        raise GitHubError(f"네트워크 오류: {e}") from e
    if res.status_code == 404:
        raise GitHubError("저장소를 찾을 수 없어요 (비공개면 토큰이 필요해요)")
    if res.status_code in (401, 403):
        raise GitHubError("접근 권한이 없어요 (토큰을 확인하세요)")
    if res.status_code >= 400:
        raise GitHubError(f"GitHub 오류 ({res.status_code})")
    data = res.json()
    return {
        "ok": True,
        "full_name": data.get("full_name"),
        "private": data.get("private", False),
        "default_branch": data.get("default_branch"),
    }


async def fetch_commits(
    repo: str,
    since: Optional[str] = None,
    until: Optional[str] = None,
    author: Optional[str] = None,
    token: Optional[str] = None,
    per_page: int = 50,
) -> List[dict]:
    """저장소 커밋 조회. since/until 은 ISO8601(UTC) 문자열.

    반환: [{sha, short_sha, message, url, author, date, avatar}]
    """
    owner, name = _parse_repo(repo)
    url = f"{API_BASE}/repos/{owner}/{name}/commits"
    params: dict = {"per_page": min(per_page, 100)}
    if since:
        params["since"] = since
    if until:
        params["until"] = until
    if author:
        params["author"] = author
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            res = await client.get(url, headers=_headers(token), params=params)
    except httpx.HTTPError as e:
        raise GitHubError(f"네트워크 오류: {e}") from e
    if res.status_code == 404:
        raise GitHubError("저장소를 찾을 수 없어요 (비공개면 토큰이 필요해요)")
    if res.status_code == 403:
        raise GitHubError("요청 한도 초과 또는 접근 불가 (토큰을 추가하면 완화돼요)")
    if res.status_code >= 400:
        raise GitHubError(f"GitHub 오류 ({res.status_code})")

    out: List[dict] = []
    for item in res.json():
        commit = item.get("commit", {})
        author_info = commit.get("author", {}) or {}
        gh_author = item.get("author") or {}
        msg = (commit.get("message") or "").split("\n", 1)[0]
        sha = item.get("sha", "")
        out.append(
            {
                "sha": sha,
                "short_sha": sha[:7],
                "message": msg,
                "url": item.get("html_url"),
                "author": author_info.get("name"),
                "date": author_info.get("date"),
                "avatar": gh_author.get("avatar_url"),
            }
        )
    return out
