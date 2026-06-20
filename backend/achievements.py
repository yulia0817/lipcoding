from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from session_models import Session

KST = timezone(timedelta(hours=9))


def _day(dt: datetime) -> date:
    return dt.astimezone(KST).date()


def evaluate_badges(sessions: list[Session]) -> list[str]:
    if not sessions:
        return []
    badges: set[str] = {"first_fire"}

    by_day: dict[date, int] = defaultdict(int)
    for s in sessions:
        by_day[_day(s.created_at)] += s.duration_min
        hour = s.created_at.astimezone(KST).hour
        if hour >= 22 or hour < 4:
            badges.add("night_owl")
        if 5 <= hour < 9:
            badges.add("early_bird")

    if any(m >= 100 for m in by_day.values()):
        badges.add("centurion")

    # streaks
    days = sorted(by_day.keys())
    best = run = 1
    for i in range(1, len(days)):
        if days[i] - days[i - 1] == timedelta(days=1):
            run += 1
            best = max(best, run)
        else:
            run = 1
    if best >= 3:
        badges.add("streak_3")
    if best >= 7:
        badges.add("streak_7")

    order = ["first_fire", "streak_3", "streak_7", "centurion", "early_bird", "night_owl"]
    return [b for b in order if b in badges]


def daily_quests(sessions: list[Session]) -> list[dict]:
    today = datetime.now(KST).date()
    todays = [s for s in sessions if _day(s.created_at) == today]
    count = len(todays)
    minutes = sum(s.duration_min for s in todays)
    retros = sum(1 for s in todays if s.retro)

    def q(qid, label, target, progress, reward):
        return {
            "id": qid,
            "label": label,
            "target": target,
            "progress": min(progress, target),
            "reward": reward,
            "done": progress >= target,
        }

    return [
        q("q_sessions", "오늘 3세션 집중", 3, count, 30),
        q("q_minutes", "오늘 60분 집중", 60, minutes, 40),
        q("q_retro", "회고 1개 남기기", 1, retros, 20),
    ]
