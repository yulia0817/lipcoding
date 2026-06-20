"""데모용 임시 시드 데이터.

인메모리 저장소라 재시작 시 비므로, 저장소가 비어 있을 때 시작 시점에
최근 14일치 현실적인 집중 세션을 채워 넣어 화면(날짜별/활동분석/통계)을
바로 둘러볼 수 있게 합니다. SEED_DEMO=0 이면 비활성화됩니다.
"""
import random
import uuid
from datetime import datetime, timedelta, timezone

from session_models import Session

KST = timezone(timedelta(hours=9))

# (task, category, tags, 선호 시간대 후보, 회고 후보)
_TEMPLATES = [
    ("알고리즘 문제 풀이", "공부", ["코테", "복습"], [9, 10, 11, 14], ["DP 3문제 완료", "그래프 탐색 복습", "생각보다 잘 풀렸다"]),
    ("사이드 프로젝트 개발", "업무", ["프로젝트"], [13, 14, 15, 21], ["API 연동 끝", "버그 하나 잡음", "리팩터링 진행"]),
    ("영어 단어 암기", "공부", ["영어"], [7, 8, 22], ["50단어 암기", "어제 것 복습"]),
    ("러닝", "운동", ["유산소"], [6, 7, 19, 20], ["5km 완주", "날씨 좋았다", "페이스 유지 성공"]),
    ("근력 운동", "운동", ["근력"], [18, 19, 20], ["하체 데이", "상체 집중", "PT 루틴"]),
    ("기술 서적 읽기", "독서", ["복습"], [21, 22, 23], ["클린코드 4장", "리팩터링 챕터", "메모 정리"]),
    ("주간 회의 준비", "업무", ["회의"], [10, 11, 16], ["발표 자료 정리", "안건 정리"]),
    ("블로그 글쓰기", "취미", ["프로젝트"], [14, 15, 22], ["초안 작성", "예제 코드 추가"]),
    ("디자인 스케치", "취미", [], [13, 20, 21], ["아이디어 스케치", "컬러 팔레트 탐색"]),
    ("CS 강의 수강", "공부", ["복습"], [9, 13, 20], ["운영체제 2강", "네트워크 정리"]),
]


def _make(task, category, tags, day_offset, hour, minute, duration, completed, retro):
    base = datetime.now(KST).replace(hour=hour, minute=minute, second=0, microsecond=0)
    created = base - timedelta(days=day_offset)
    return Session(
        id=uuid.uuid4().hex,
        task=task,
        duration_min=duration,
        completed=completed,
        distracted_min=0 if completed else random.choice([3, 5, 8]),
        retro=retro,
        source=random.choice(["text", "text", "voice"]),
        category=category,
        tags=list(tags),
        created_at=created,
    )


def build_demo_sessions(seed: int = 42) -> list[Session]:
    rng = random.Random(seed)
    sessions: list[Session] = []
    # 최근 14일, 하루 2~4세션
    for day_offset in range(0, 14):
        count = rng.randint(2, 4)
        chosen = rng.sample(_TEMPLATES, count)
        used_hours: set[int] = set()
        for task, category, tags, hours, retros in chosen:
            hour = rng.choice(hours)
            while hour in used_hours:
                hour = rng.randint(7, 23)
            used_hours.add(hour)
            minute = rng.choice([0, 5, 10, 15, 30])
            duration = rng.choice([25, 25, 45, 50])
            completed = rng.random() > 0.15  # 약 85% 완료
            retro = rng.choice(retros) if (retros and rng.random() > 0.3) else None
            sessions.append(
                _make(task, category, tags, day_offset, hour, minute, duration, completed, retro)
            )
    return sessions
