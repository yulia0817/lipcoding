"""집중 세션 라우터: 세션 저장/조회 + 통계."""
from fastapi import APIRouter

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
async def list_sessions() -> list[Session]:
    return session_store.list()


@router.post("/sessions", response_model=Session, status_code=201)
async def create_session(data: SessionCreate) -> Session:
    return session_store.create(data)


@router.get("/stats", response_model=Stats)
async def get_stats() -> Stats:
    return session_store.stats()


@router.get("/summary/weekly", response_model=WeeklySummary)
async def weekly_summary() -> WeeklySummary:
    return session_store.weekly_summary()


@router.get("/breakdown/daily", response_model=list[DayBreakdown])
async def daily_breakdown() -> list[DayBreakdown]:
    return session_store.daily_breakdown()


@router.get("/breakdown/hourly", response_model=list[HourBucket])
async def hourly_breakdown() -> list[HourBucket]:
    return session_store.hourly_breakdown()


@router.get("/breakdown/category", response_model=list[CategoryStat])
async def category_breakdown() -> list[CategoryStat]:
    return session_store.category_breakdown()
