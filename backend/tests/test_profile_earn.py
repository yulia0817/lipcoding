from profile_store import ProfileStore
from gamification_models import level_for_xp


def test_level_curve():
    assert level_for_xp(0) == 1
    assert level_for_xp(99) == 1
    assert level_for_xp(100) == 2
    assert level_for_xp(250) == 3


def test_default_profile_owns_and_equips_campfire():
    store = ProfileStore()
    p = store.get("u1")
    assert p.coins == 0
    assert p.level == 1
    assert p.owned_skins == ["campfire"]
    assert p.equipped_skin == "campfire"


def test_earn_grants_coins_and_xp_with_completion_bonus():
    store = ProfileStore()
    result = store.earn("u1", minutes=25, completed=True)
    assert result.coins_gained == 35  # 25 + 10 bonus
    assert result.xp_gained == 35
    assert result.profile.coins == 35
    assert result.profile.xp == 35


def test_earn_levels_up():
    store = ProfileStore()
    store.earn("u1", minutes=90, completed=False)  # 90 xp -> level 1
    assert store.get("u1").level == 1
    result = store.earn("u1", minutes=20, completed=False)  # total 110 -> level 2
    assert result.leveled_up is True
    assert result.new_level == 2
