from typing import Optional

from gamification_models import Skin

SKINS: list[Skin] = [
    Skin(id="campfire", name="모닥불", emoji="🔥", price=0, premium=False,
         price_krw=0, description="기본 모닥불. 집중하면 활활 타오릅니다.",
         palette={"accent": "#ff7a18", "bg": "#1a1410"}),
    Skin(id="fireplace", name="벽난로", emoji="🪵", price=200, premium=False,
         price_krw=0, description="아늑한 실내 벽난로.",
         palette={"accent": "#e8643c", "bg": "#221814"}),
    Skin(id="beach", name="해변 모닥불", emoji="🏖️", price=300, premium=False,
         price_krw=0, description="파도 소리와 함께 타는 해변 불꽃.",
         palette={"accent": "#ffb74d", "bg": "#10243a"}),
    Skin(id="forest", name="숲속 캠프", emoji="🌲", price=400, premium=False,
         price_krw=0, description="울창한 숲속 캠프파이어.",
         palette={"accent": "#7bc47f", "bg": "#0f1f16"}),
    Skin(id="rainy", name="비 오는 밤", emoji="🌧️", price=300, premium=False,
         price_krw=0, description="빗소리 속의 차분한 불빛.",
         palette={"accent": "#6db3f2", "bg": "#0e1622"}),
    Skin(id="space", name="우주 캠프", emoji="🚀", price=0, premium=True,
         price_krw=3900, description="별빛 아래 떠다니는 집중의 불꽃. (프리미엄)",
         palette={"accent": "#b388ff", "bg": "#0a0a1a"}),
    Skin(id="aurora", name="오로라", emoji="🌌", price=0, premium=True,
         price_krw=3900, description="흐르는 오로라가 집중을 비춥니다. (프리미엄)",
         palette={"accent": "#64ffda", "bg": "#08131a"}),
]

_BY_ID = {s.id: s for s in SKINS}


def get_skin(skin_id: str) -> Optional[Skin]:
    return _BY_ID.get(skin_id)
