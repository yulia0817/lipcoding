from session_models import SessionCreate
from session_store import SessionStore


def test_empty_breakdown_is_empty_list():
    assert SessionStore().daily_breakdown("u1") == []


def test_groups_sessions_by_day_and_aggregates_tasks():
    store = SessionStore()
    store.create("u1", SessionCreate(task="코딩", duration_min=25, completed=True))
    store.create("u1", SessionCreate(task="코딩", duration_min=25, completed=True))
    store.create("u1", SessionCreate(task="독서", duration_min=10, completed=True))

    days = store.daily_breakdown("u1")
    assert len(days) == 1  # all created "today"
    today = days[0]
    assert today.total_minutes == 60
    assert today.session_count == 3
    # tasks sorted by minutes desc
    assert today.tasks[0]["task"] == "코딩"
    assert today.tasks[0]["minutes"] == 50
    assert today.tasks[0]["count"] == 2
    assert today.tasks[1]["task"] == "독서"
    assert today.tasks[1]["minutes"] == 10
