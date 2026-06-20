"""Pydantic 모델 정의. 대회 당일 주제에 맞춰 필드를 확장하세요."""
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ItemCreate(BaseModel):
    """생산성 항목 생성 요청. (할 일, 메모, 음성 캡처 등 범용)"""
    title: str = Field(..., min_length=1, max_length=500)
    note: Optional[str] = Field(default=None, max_length=5000)
    source: str = Field(default="text", description="text | voice")


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    note: Optional[str] = Field(default=None, max_length=5000)
    done: Optional[bool] = None


class Item(BaseModel):
    id: str
    title: str
    note: Optional[str] = None
    source: str = "text"
    done: bool = False
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
