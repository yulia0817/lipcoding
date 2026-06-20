from datetime import datetime, timedelta, timezone

from session_models import Session
from achievements import evaluate_badges, daily_quests

KST = timezone(timedelta(hours=9))


def _session(task="x", minutes=25, retro=None, created_at=None):
    return Session(
        id="s",
        task=task,
        duration_min=minutes,
        completed=True,
        distracted_min=0,
        retro=retro,
        source="text",
        created_at=created_at or datetime.now(KST),
    )


def test_first_fire_badge_after_one_session():
    badges = evaluate_badges([_session()])
    assert "first_fire" in badges


def test_centurion_badge_for_100_minutes_in_a_day():
    sessions = [_session(minutes=50), _session(minutes=60)]
    assert "centurion" in evaluate_badges(sessions)


def test_no_badges_when_empty():
    assert evaluate_badges([]) == []


def test_daily_quests_track_progress_and_completion():
    sessions = [_session(retro="좋았다"), _session(), _session()]
    quests = {q["id"]: q for q in daily_quests(sessions)}
    assert quests["q_sessions"]["progress"] == 3
    assert quests["q_sessions"]["done"] is True
    assert quests["q_retro"]["progress"] == 1
    assert quests["q_retro"]["done"] is True
    assert quests["q_minutes"]["target"] == 60
