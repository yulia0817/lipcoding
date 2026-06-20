from datetime import datetime, timedelta, timezone

from session_models import SessionCreate
from session_store import SessionStore, KST


def test_category_defaults_to_etc():
    s = SessionCreate(task="무언가", duration_min=25)
    assert s.category == "기타"
    assert s.tags == []


def test_category_and_tags_persist_on_session():
    store = SessionStore()
    sess = store.create(
        SessionCreate(task="알고리즘", duration_min=25, category="공부", tags=["코테", "파이썬"])
    )
    assert sess.category == "공부"
    assert sess.tags == ["코테", "파이썬"]


def test_empty_category_breakdown_is_empty():
    assert SessionStore().category_breakdown() == []


def test_category_breakdown_aggregates_minutes_and_tags():
    store = SessionStore()
    store.create(SessionCreate(task="알고리즘", duration_min=25, category="공부", tags=["코테"]))
    store.create(SessionCreate(task="영어", duration_min=15, category="공부", tags=["단어"]))
    store.create(SessionCreate(task="러닝", duration_min=30, category="운동", tags=["유산소"]))

    cats = store.category_breakdown()
    # sorted by minutes desc -> 공부(40) before 운동(30)
    assert cats[0].category == "공부"
    assert cats[0].minutes == 40
    assert cats[0].session_count == 2
    # tags aggregated within category
    tag_names = {t["tag"] for t in cats[0].tags}
    assert tag_names == {"코테", "단어"}
    assert cats[1].category == "운동"
    assert cats[1].minutes == 30


def test_empty_hourly_breakdown_has_24_zero_buckets():
    buckets = SessionStore().hourly_breakdown()
    assert len(buckets) == 24
    assert all(b.minutes == 0 for b in buckets)
    assert [b.hour for b in buckets] == list(range(24))


def test_hourly_breakdown_buckets_by_local_hour():
    store = SessionStore()
    # craft a session at a known KST hour (e.g. 14:30 KST today)
    now_kst = datetime.now(KST)
    at_14 = now_kst.replace(hour=14, minute=30, second=0, microsecond=0)
    sess = store.create(SessionCreate(task="작업", duration_min=25, category="업무"))
    # overwrite created_at to the crafted time (stored as UTC internally is fine)
    store._items[sess.id].created_at = at_14.astimezone(timezone.utc)

    buckets = store.hourly_breakdown()
    assert buckets[14].minutes == 25
    assert buckets[14].session_count == 1
    assert sum(b.minutes for b in buckets) == 25
