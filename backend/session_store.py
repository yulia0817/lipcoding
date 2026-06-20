"""집중 세션 인메모리 저장소 + 통계 계산.

영속성이 필요하면 이 파일만 DB로 교체하세요.
"""
import re
import uuid
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from threading import Lock
from typing import Dict, List

from session_models import (
    Session,
    SessionCreate,
    Stats,
    WeeklySummary,
    DayBreakdown,
    HourBucket,
    CategoryStat,
)

# 한국 시간 기준으로 '오늘/날짜'를 계산 (대회 환경)
KST = timezone(timedelta(hours=9))


class SessionStore:
    def __init__(self) -> None:
        self._items: Dict[str, Session] = {}
        self._lock = Lock()

    def list(self) -> List[Session]:
        with self._lock:
            return sorted(
                self._items.values(),
                key=lambda s: s.created_at,
                reverse=True,
            )

    def create(self, data: SessionCreate) -> Session:
        session = Session(id=uuid.uuid4().hex, **data.model_dump())
        with self._lock:
            self._items[session.id] = session
        return session

    def count(self) -> int:
        with self._lock:
            return len(self._items)

    def seed_many(self, sessions: List[Session]) -> int:
        """데모 세션을 일괄 주입. 이미 데이터가 있으면 아무 것도 하지 않습니다."""
        with self._lock:
            if self._items:
                return 0
            for s in sessions:
                self._items[s.id] = s
            return len(sessions)

    def _local_day(self, dt: datetime) -> date:
        return dt.astimezone(KST).date()

    def stats(self) -> Stats:
        with self._lock:
            sessions = list(self._items.values())

        today = datetime.now(KST).date()
        by_day: Dict[date, int] = defaultdict(int)
        focus_total = 0
        distract_total = 0
        completed = 0

        for s in sessions:
            day = self._local_day(s.created_at)
            by_day[day] += s.duration_min
            focus_total += s.duration_min
            distract_total += s.distracted_min
            if s.completed:
                completed += 1

        # streak: 오늘(또는 어제)부터 연속으로 집중한 날 수
        streak = 0
        cursor = today
        if by_day.get(today, 0) == 0 and by_day.get(today - timedelta(days=1), 0) > 0:
            cursor = today - timedelta(days=1)
        while by_day.get(cursor, 0) > 0:
            streak += 1
            cursor -= timedelta(days=1)

        # heatmap: 최근 84일 (12주)
        heatmap: Dict[str, int] = {}
        for i in range(84):
            d = today - timedelta(days=i)
            heatmap[d.isoformat()] = by_day.get(d, 0)

        return Stats(
            today_minutes=by_day.get(today, 0),
            streak_days=streak,
            completed_count=completed,
            total_sessions=len(sessions),
            focus_minutes=focus_total,
            distracted_minutes=distract_total,
            heatmap=heatmap,
        )

    def weekly_summary(self) -> WeeklySummary:
        with self._lock:
            sessions = list(self._items.values())

        now = datetime.now(KST)
        week_start = now.date() - timedelta(days=now.weekday())  # Monday
        week_end = week_start + timedelta(days=6)

        in_week = [
            s for s in sessions
            if week_start <= self._local_day(s.created_at) <= week_end
        ]

        total = sum(s.duration_min for s in in_week)
        completed = sum(1 for s in in_week if s.completed)

        per_task: Dict[str, int] = defaultdict(int)
        for s in in_week:
            per_task[s.task] += s.duration_min
        top_task, top_task_min = (None, 0)
        if per_task:
            top_task, top_task_min = max(per_task.items(), key=lambda kv: kv[1])

        words = Counter()
        for s in in_week:
            for w in re.findall(r"[0-9A-Za-z가-힣]+", s.task):
                if len(w) >= 2:
                    words[w] += 1
        keywords = [w for w, _ in words.most_common(5)]

        embers = [
            {
                "date": self._local_day(s.created_at).isoformat(),
                "task": s.task,
                "retro": s.retro,
            }
            for s in sorted(in_week, key=lambda s: s.created_at, reverse=True)
            if s.retro
        ]

        if total <= 0:
            fire_level = 0
        else:
            fire_level = min(5, 1 + (total - 1) // 60)

        return WeeklySummary(
            week_start=week_start.isoformat(),
            week_end=week_end.isoformat(),
            total_minutes=total,
            session_count=len(in_week),
            completed_count=completed,
            top_task=top_task,
            top_task_minutes=top_task_min,
            keywords=keywords,
            fire_level=fire_level,
            embers=embers,
        )

    def daily_breakdown(self, days: int = 14) -> List[DayBreakdown]:
        with self._lock:
            sessions = list(self._items.values())

        cutoff = datetime.now(KST).date() - timedelta(days=days - 1)
        per_day: Dict[date, list[Session]] = defaultdict(list)
        for s in sessions:
            day = self._local_day(s.created_at)
            if day >= cutoff:
                per_day[day].append(s)

        result: List[DayBreakdown] = []
        for day in sorted(per_day.keys(), reverse=True):
            day_sessions = per_day[day]
            per_task_min: Dict[str, int] = defaultdict(int)
            per_task_cnt: Dict[str, int] = defaultdict(int)
            for s in day_sessions:
                per_task_min[s.task] += s.duration_min
                per_task_cnt[s.task] += 1
            tasks = [
                {"task": t, "minutes": per_task_min[t], "count": per_task_cnt[t]}
                for t in per_task_min
            ]
            tasks.sort(key=lambda x: x["minutes"], reverse=True)
            result.append(
                DayBreakdown(
                    date=day.isoformat(),
                    total_minutes=sum(s.duration_min for s in day_sessions),
                    session_count=len(day_sessions),
                    tasks=tasks,
                )
            )
        return result


    def hourly_breakdown(self, days: int = 7) -> List[HourBucket]:
        """최근 N일 동안의 '시간대(0~23시, KST)별' 집중 분 분포."""
        with self._lock:
            sessions = list(self._items.values())

        cutoff = datetime.now(KST).date() - timedelta(days=days - 1)
        minutes = [0] * 24
        counts = [0] * 24
        for s in sessions:
            local = s.created_at.astimezone(KST)
            if local.date() >= cutoff:
                minutes[local.hour] += s.duration_min
                counts[local.hour] += 1

        return [
            HourBucket(hour=h, minutes=minutes[h], session_count=counts[h])
            for h in range(24)
        ]

    def category_breakdown(self, days: int = 30) -> List[CategoryStat]:
        """최근 N일 동안의 카테고리별 투자 시간 + 카테고리 내부 태그별 분."""
        with self._lock:
            sessions = list(self._items.values())

        cutoff = datetime.now(KST).date() - timedelta(days=days - 1)
        cat_min: Dict[str, int] = defaultdict(int)
        cat_cnt: Dict[str, int] = defaultdict(int)
        cat_tag_min: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

        for s in sessions:
            if self._local_day(s.created_at) < cutoff:
                continue
            cat = s.category or "기타"
            cat_min[cat] += s.duration_min
            cat_cnt[cat] += 1
            for tag in s.tags or []:
                cat_tag_min[cat][tag] += s.duration_min

        result: List[CategoryStat] = []
        for cat in sorted(cat_min, key=lambda c: cat_min[c], reverse=True):
            tags = [
                {"tag": t, "minutes": m}
                for t, m in sorted(
                    cat_tag_min[cat].items(), key=lambda kv: kv[1], reverse=True
                )
            ]
            result.append(
                CategoryStat(
                    category=cat,
                    minutes=cat_min[cat],
                    session_count=cat_cnt[cat],
                    tags=tags,
                )
            )
        return result


session_store = SessionStore()
