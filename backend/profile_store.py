from threading import Lock
from typing import Dict

from gamification_models import DEFAULT_SKIN, EarnResult, Profile, SkinView, level_for_xp
from skins_catalog import get_skin, SKINS


class ProfileStore:
    def __init__(self) -> None:
        self._items: Dict[str, dict] = {}
        self._lock = Lock()

    def _raw(self, user_id: str) -> dict:
        if user_id not in self._items:
            self._items[user_id] = {
                "coins": 0,
                "xp": 0,
                "owned_skins": [DEFAULT_SKIN],
                "equipped_skin": DEFAULT_SKIN,
                "badges": [],
            }
        return self._items[user_id]

    def _to_profile(self, user_id: str, raw: dict) -> Profile:
        return Profile(
            user_id=user_id,
            coins=raw["coins"],
            xp=raw["xp"],
            level=level_for_xp(raw["xp"]),
            owned_skins=list(raw["owned_skins"]),
            equipped_skin=raw["equipped_skin"],
            badges=list(raw["badges"]),
        )

    def get(self, user_id: str) -> Profile:
        with self._lock:
            return self._to_profile(user_id, self._raw(user_id))

    def earn(self, user_id: str, minutes: int, completed: bool) -> EarnResult:
        with self._lock:
            raw = self._raw(user_id)
            before_level = level_for_xp(raw["xp"])
            bonus = 10 if completed else 0
            gained = minutes + bonus
            raw["coins"] += gained
            raw["xp"] += gained
            after_level = level_for_xp(raw["xp"])
            profile = self._to_profile(user_id, raw)
        return EarnResult(
            profile=profile,
            coins_gained=gained,
            xp_gained=gained,
            leveled_up=after_level > before_level,
            new_level=after_level,
        )

    def skin_views(self, user_id: str) -> list[SkinView]:
        with self._lock:
            raw = self._raw(user_id)
            owned = set(raw["owned_skins"])
            equipped = raw["equipped_skin"]
        return [
            SkinView(**s.model_dump(), owned=s.id in owned, equipped=s.id == equipped)
            for s in SKINS
        ]

    def buy_skin(self, user_id: str, skin_id: str) -> Profile:
        skin = get_skin(skin_id)
        if skin is None:
            raise ValueError("unknown")
        with self._lock:
            raw = self._raw(user_id)
            if skin_id in raw["owned_skins"]:
                raise ValueError("owned")
            if skin.premium:
                raise ValueError("premium")
            if raw["coins"] < skin.price:
                raise ValueError("insufficient")
            raw["coins"] -= skin.price
            raw["owned_skins"].append(skin_id)
            return self._to_profile(user_id, raw)

    def equip_skin(self, user_id: str, skin_id: str) -> Profile:
        if get_skin(skin_id) is None:
            raise ValueError("unknown")
        with self._lock:
            raw = self._raw(user_id)
            if skin_id not in raw["owned_skins"]:
                raw["owned_skins"].append(skin_id)
            raw["equipped_skin"] = skin_id
            return self._to_profile(user_id, raw)

    def merge_badges(self, user_id: str, badge_ids: list[str]) -> Profile:
        with self._lock:
            raw = self._raw(user_id)
            for b in badge_ids:
                if b not in raw["badges"]:
                    raw["badges"].append(b)
            return self._to_profile(user_id, raw)


profile_store = ProfileStore()
