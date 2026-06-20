"""스탠드업(데일리 스크럼) 생성 로직.

집중 세션 + GitHub 커밋을 모아 '어제 한 일 / 오늘 할 일 / 블로커' 형식의
요약을 만든다. 환경변수로 Azure OpenAI 가 설정돼 있으면 LLM 으로 자연스럽게
다듬고, 없으면 항상 동작하는 스마트 템플릿으로 생성한다.
"""
from __future__ import annotations

import os
from typing import List, Optional


def _fmt_minutes(total: int) -> str:
    if total <= 0:
        return "0분"
    h, m = divmod(total, 60)
    if h and m:
        return f"{h}시간 {m}분"
    if h:
        return f"{h}시간"
    return f"{m}분"


def _summarize_day(day: Optional[dict]) -> dict:
    """daily_breakdown 의 하루 항목을 요약."""
    if not day:
        return {"total_minutes": 0, "session_count": 0, "tasks": [], "retros": []}
    tasks = []
    for t in day.get("tasks", []):
        tasks.append(
            {
                "task": t.get("task", ""),
                "minutes": t.get("minutes", 0),
                "count": t.get("count", 0),
            }
        )
    retros = [
        e.get("retro", "").strip()
        for e in day.get("entries", [])
        if (e.get("retro") or "").strip()
    ]
    return {
        "total_minutes": day.get("total_minutes", 0),
        "session_count": day.get("session_count", 0),
        "tasks": tasks,
        "retros": retros,
    }


def build_context(
    *,
    yesterday: Optional[dict],
    today: Optional[dict],
    yesterday_commits: List[dict],
    today_commits: List[dict],
) -> dict:
    """스탠드업 생성을 위한 정규화된 컨텍스트."""
    y = _summarize_day(yesterday)
    t = _summarize_day(today)
    return {
        "yesterday": {
            **y,
            "commits": [c.get("message", "") for c in yesterday_commits if c.get("message")],
        },
        "today": {
            **t,
            "commits": [c.get("message", "") for c in today_commits if c.get("message")],
        },
    }


def _template_standup(ctx: dict) -> str:
    """LLM 없이도 항상 동작하는 구조화된 스탠드업 텍스트."""
    y = ctx["yesterday"]
    t = ctx["today"]

    lines: List[str] = ["📋 오늘의 스탠드업", ""]

    # 어제 한 일
    lines.append("✅ 어제 한 일")
    did_any = False
    for task in y["tasks"][:5]:
        did_any = True
        lines.append(f"  • {task['task']} ({_fmt_minutes(task['minutes'])}, {task['count']}회)")
    for msg in y["commits"][:5]:
        did_any = True
        lines.append(f"  • 커밋: {msg}")
    for retro in y["retros"][:3]:
        lines.append(f"    └ 회고: {retro}")
    if not did_any:
        lines.append("  • (기록된 집중 세션이나 커밋이 없어요)")
    if y["total_minutes"]:
        lines.append(f"  → 총 집중 {_fmt_minutes(y['total_minutes'])} · 커밋 {len(y['commits'])}건")

    lines.append("")

    # 오늘 할 일
    lines.append("🎯 오늘 할 일")
    today_any = False
    for task in t["tasks"][:5]:
        today_any = True
        lines.append(f"  • {task['task']} ({_fmt_minutes(task['minutes'])} 집중 중)")
    for msg in t["commits"][:3]:
        today_any = True
        lines.append(f"  • 커밋: {msg}")
    if not today_any:
        lines.append("  • (오늘 계획을 집중 타이머로 시작해 보세요)")

    lines.append("")

    # 블로커
    lines.append("🚧 블로커")
    blockers = [r for r in (y["retros"] + t["retros"]) if _looks_like_blocker(r)]
    if blockers:
        for b in blockers[:3]:
            lines.append(f"  • {b}")
    else:
        lines.append("  • 없음")

    return "\n".join(lines)


_BLOCKER_HINTS = ("막힘", "막혔", "안됨", "안 됨", "에러", "오류", "어려", "이슈", "blocker", "block", "stuck")


def _looks_like_blocker(text: str) -> bool:
    low = text.lower()
    return any(h in low for h in _BLOCKER_HINTS)


def _aoai_config() -> Optional[dict]:
    ep = os.getenv("AZURE_OPENAI_ENDPOINT")
    key = os.getenv("AZURE_OPENAI_API_KEY")
    dep = os.getenv("AZURE_OPENAI_DEPLOYMENT") or os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")
    if ep and key and dep:
        return {
            "endpoint": ep.rstrip("/"),
            "key": key,
            "deployment": dep,
            "api_version": os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
        }
    return None


async def _aoai_standup(ctx: dict, cfg: dict) -> Optional[str]:
    """Azure OpenAI 로 스탠드업 다듬기. 실패하면 None 반환(상위에서 템플릿 폴백)."""
    import json

    import httpx

    url = (
        f"{cfg['endpoint']}/openai/deployments/{cfg['deployment']}"
        f"/chat/completions?api-version={cfg['api_version']}"
    )
    system = (
        "너는 개발자의 데일리 스탠드업을 작성하는 비서야. "
        "주어진 집중 세션과 커밋 데이터를 바탕으로 '어제 한 일 / 오늘 할 일 / 블로커' "
        "세 항목으로 간결한 한국어 스탠드업을 작성해. 과장하지 말고 데이터에 충실하게, "
        "이모지 헤더(✅ 🎯 🚧)를 사용해."
    )
    user = "다음 데이터로 스탠드업을 작성해줘:\n" + json.dumps(ctx, ensure_ascii=False)
    payload = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.4,
        "max_tokens": 500,
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                url,
                headers={"api-key": cfg["key"], "Content-Type": "application/json"},
                json=payload,
            )
        if res.status_code >= 400:
            return None
        data = res.json()
        text = data["choices"][0]["message"]["content"].strip()
        return text or None
    except Exception:
        return None


async def generate_standup(ctx: dict) -> dict:
    """스탠드업 생성. {text, source}."""
    cfg = _aoai_config()
    if cfg:
        ai = await _aoai_standup(ctx, cfg)
        if ai:
            return {"text": ai, "source": "ai"}
    return {"text": _template_standup(ctx), "source": "template"}
