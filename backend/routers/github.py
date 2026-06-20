"""GitHub 연동 라우터 (MVP: 공개 저장소 커밋 조회).

토큰은 헤더 X-GH-Token 로 선택 전달(없으면 공개 저장소만).
저장소는 쿼리 ?repo=owner/name 또는 헤더 X-GH-Repo 로 전달.
"""
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from github_store import GitHubError, fetch_commits, test_repo

router = APIRouter(prefix="/api/github", tags=["github"])


def _repo(repo_q: Optional[str], repo_h: Optional[str]) -> str:
    repo = repo_q or repo_h
    if not repo:
        raise HTTPException(status_code=400, detail="저장소를 지정하세요 (owner/repo)")
    return repo


@router.get("/test")
async def github_test(
    repo: Optional[str] = Query(default=None),
    x_gh_repo: Optional[str] = Header(default=None),
    x_gh_token: Optional[str] = Header(default=None),
) -> dict:
    try:
        return await test_repo(_repo(repo, x_gh_repo), x_gh_token)
    except GitHubError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/commits")
async def github_commits(
    repo: Optional[str] = Query(default=None),
    since: Optional[str] = Query(default=None),
    until: Optional[str] = Query(default=None),
    author: Optional[str] = Query(default=None),
    x_gh_repo: Optional[str] = Header(default=None),
    x_gh_token: Optional[str] = Header(default=None),
) -> dict:
    try:
        commits = await fetch_commits(
            _repo(repo, x_gh_repo),
            since=since,
            until=until,
            author=author,
            token=x_gh_token,
        )
    except GitHubError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"commits": commits, "count": len(commits)}
