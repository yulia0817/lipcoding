"""집중 세션 라우터: 세션 저장/조회 + 통계 (사용자별 분리)."""
from fastapi import APIRouter, Header

from session_models import (
    Session,
    SessionCreate,
    Stats,
    WeeklySummary,
    DayBreakdown,
    HourBucket,
    CategoryStat,
)
from session_store import session_store

router = APIRouter(prefix="/api", tags=["focus"])


@router.get("/sessions", response_model=list[Session])
async def list_sessions(x_user_id: str | None = Header(default=None)) -> list[Session]:
    return session_store.list(x_user_id)


@router.post("/sessions", response_model=Session, status_code=201)
async def create_session(
    data: SessionCreate, x_user_id: str | None = Header(default=None)
) -> Session:
    return session_store.create(x_user_id, data)


@router.get("/stats", response_model=Stats)
async def get_stats(x_user_id: str | None = Header(default=None)) -> Stats:
    return session_store.stats(x_user_id)


@router.get("/summary/weekly", response_model=WeeklySummary)
async def weekly_summary(x_user_id: str | None = Header(default=None)) -> WeeklySummary:
    return session_store.weekly_summary(x_user_id)


@router.get("/breakdown/daily", response_model=list[DayBreakdown])
async def daily_breakdown(x_user_id: str | None = Header(default=None)) -> list[DayBreakdown]:
    return session_store.daily_breakdown(x_user_id)


@router.get("/breakdown/hourly", response_model=list[HourBucket])
async def hourly_breakdown(x_user_id: str | None = Header(default=None)) -> list[HourBucket]:
    return session_store.hourly_breakdown(x_user_id)


@router.get("/breakdown/category", response_model=list[CategoryStat])
async def category_breakdown(x_user_id: str | None = Header(default=None)) -> list[CategoryStat]:
    return session_store.category_breakdown(x_user_id)
