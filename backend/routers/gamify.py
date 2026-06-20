from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from achievements import daily_quests, evaluate_badges
from gamification_models import EarnResult, Profile, SkinView
from profile_store import profile_store
from session_store import session_store

router = APIRouter(prefix="/api", tags=["gamify"])


def _uid(x_user_id: str | None) -> str:
    return x_user_id or "anon"


class EarnBody(BaseModel):
    minutes: int
    completed: bool = True


@router.get("/profile", response_model=Profile)
async def get_profile(x_user_id: str | None = Header(default=None)) -> Profile:
    return profile_store.get(_uid(x_user_id))


@router.post("/earn", response_model=EarnResult)
async def earn(body: EarnBody, x_user_id: str | None = Header(default=None)) -> EarnResult:
    uid = _uid(x_user_id)
    result = profile_store.earn(uid, body.minutes, body.completed)
    badges = evaluate_badges(session_store.list())
    merged = profile_store.merge_badges(uid, badges)
    result.profile = merged
    return result


@router.get("/skins", response_model=list[SkinView])
async def list_skins(x_user_id: str | None = Header(default=None)) -> list[SkinView]:
    return profile_store.skin_views(_uid(x_user_id))


@router.post("/skins/{skin_id}/buy", response_model=Profile)
async def buy_skin(skin_id: str, x_user_id: str | None = Header(default=None)) -> Profile:
    try:
        return profile_store.buy_skin(_uid(x_user_id), skin_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/skins/{skin_id}/equip", response_model=Profile)
async def equip_skin(skin_id: str, x_user_id: str | None = Header(default=None)) -> Profile:
    try:
        return profile_store.equip_skin(_uid(x_user_id), skin_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quests")
async def quests() -> list[dict]:
    return daily_quests(session_store.list())
