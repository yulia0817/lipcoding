"""'같이 집중' 모임 모델."""
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Member(BaseModel):
    user_id: str
    name: str
    joined_at: datetime = Field(default_factory=_now)


class Group(BaseModel):
    id: str
    code: str
    name: str
    owner_id: str
    created_at: datetime = Field(default_factory=_now)
    members: list[Member] = Field(default_factory=list)


class LeaderRow(BaseModel):
    user_id: str
    name: str
    minutes: int
    sessions: int


class GroupSummary(BaseModel):
    group_id: str
    name: str
    code: str
    member_count: int
    total_minutes: int
    goal_minutes: int
    goal_progress: float  # 0.0 ~ 1.0
    fire_level: int
    leaderboard: list[LeaderRow]
    mvp_id: Optional[str]


class PresenceRow(BaseModel):
    user_id: str
    name: str
    task: Optional[str]
    seconds_ago: int


class FeedItem(BaseModel):
    user_id: str
    name: str
    task: str
    minutes: int
    at: datetime
