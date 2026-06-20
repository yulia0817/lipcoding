from datetime import datetime, timedelta, timezone

from session_models import SessionCreate
from session_store import SessionStore

KST = timezone(timedelta(hours=9))


def _store_with(*sessions):
    store = SessionStore()
    for s in sessions:
        store.create("u1", s)
    return store


def test_empty_week_has_zero_fire():
    store = SessionStore()
    summary = store.weekly_summary("u1")
    assert summary.total_minutes == 0
    assert summary.session_count == 0
    assert summary.fire_level == 0
    assert summary.top_task is None
    assert summary.embers == []


def test_top_task_is_the_one_with_most_minutes():
    store = _store_with(
        SessionCreate(task="코딩", duration_min=25, completed=True),
        SessionCreate(task="코딩", duration_min=25, completed=True),
        SessionCreate(task="독서", duration_min=25, completed=True),
    )
    summary = store.weekly_summary("u1")
    assert summary.top_task == "코딩"
    assert summary.top_task_minutes == 50
    assert summary.session_count == 3
    assert summary.total_minutes == 75


def test_keywords_extracted_from_tasks():
    store = _store_with(
        SessionCreate(task="리액트 컴포넌트 작성", duration_min=25, completed=True),
        SessionCreate(task="리액트 훅 정리", duration_min=25, completed=True),
    )
    summary = store.weekly_summary("u1")
    assert "리액트" in summary.keywords


def test_embers_only_include_sessions_with_retro_newest_first():
    store = _store_with(
        SessionCreate(task="A", duration_min=25, completed=True, retro="잘됨"),
        SessionCreate(task="B", duration_min=25, completed=True),  # no retro
        SessionCreate(task="C", duration_min=25, completed=True, retro="집중 잘됨"),
    )
    summary = store.weekly_summary("u1")
    assert len(summary.embers) == 2
    assert summary.embers[0]["task"] == "C"  # newest first
    assert all(e["retro"] for e in summary.embers)


def test_fire_level_scales_with_total_minutes():
    # 0min -> 0, 1-59 -> 1, then +1 per extra hour, capped at 5
    store = _store_with(SessionCreate(task="x", duration_min=25, completed=True))
    assert store.weekly_summary("u1").fire_level == 1
    big = SessionStore()
    for _ in range(20):  # 500 min -> capped 5
        big.create("u1", SessionCreate(task="x", duration_min=25, completed=True))
    assert big.weekly_summary("u1").fire_level == 5
