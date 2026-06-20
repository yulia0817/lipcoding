"""Focus Campfire 세션 모델."""
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SessionCreate(BaseModel):
    """집중 세션 종료 시 저장 요청."""
    task: str = Field(..., min_length=1, max_length=500, description="무엇에 집중했는지")
    duration_min: int = Field(..., ge=1, le=600, description="집중한 분")
    completed: bool = Field(default=True, description="끝까지 완료했는지")
    distracted_min: int = Field(default=0, ge=0, le=600, description="딴짓한 분")
    retro: Optional[str] = Field(default=None, max_length=1000, description="한 줄 회고")
    source: str = Field(default="text", description="text | voice")
    category: str = Field(default="기타", max_length=50, description="공부/운동/업무 등")
    tags: list[str] = Field(default_factory=list, description="자유 태그")


class Session(SessionCreate):
    id: str
    created_at: datetime = Field(default_factory=_now)


class Stats(BaseModel):
    today_minutes: int
    streak_days: int
    completed_count: int
    total_sessions: int
    focus_minutes: int
    distracted_minutes: int
    heatmap: dict[str, int]  # 'YYYY-MM-DD' -> 집중 분


class WeeklySummary(BaseModel):
    week_start: str
    week_end: str
    total_minutes: int
    session_count: int
    completed_count: int
    top_task: Optional[str]
    top_task_minutes: int
    keywords: list[str]
    fire_level: int
    embers: list[dict]


class DayBreakdown(BaseModel):
    date: str
    total_minutes: int
    session_count: int
    tasks: list[dict]
    entries: list[dict] = []  # 세션별 타임라인 [{start, end, task, ...}]


class HourBucket(BaseModel):
    hour: int  # 0-23 (KST)
    minutes: int
    session_count: int


class CategoryStat(BaseModel):
    category: str
    minutes: int
    session_count: int
    tags: list[dict]  # [{tag, minutes}]
