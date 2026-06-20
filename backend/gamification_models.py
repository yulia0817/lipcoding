from pydantic import BaseModel

DEFAULT_SKIN = "campfire"


def level_for_xp(xp: int) -> int:
    return 1 + xp // 100


class Profile(BaseModel):
    user_id: str
    coins: int
    xp: int
    level: int
    owned_skins: list[str]
    equipped_skin: str
    badges: list[str]


class EarnResult(BaseModel):
    profile: Profile
    coins_gained: int
    xp_gained: int
    leveled_up: bool
    new_level: int


class Skin(BaseModel):
    id: str
    name: str
    emoji: str
    price: int
    premium: bool
    price_krw: int
    description: str
    palette: dict


class SkinView(Skin):
    owned: bool
    equipped: bool
