import pytest

from profile_store import ProfileStore
from skins_catalog import SKINS, get_skin


def test_catalog_has_default_free_campfire():
    campfire = get_skin("campfire")
    assert campfire is not None
    assert campfire.price == 0
    assert campfire.premium is False


def test_buy_requires_enough_coins():
    store = ProfileStore()
    with pytest.raises(ValueError, match="insufficient"):
        store.buy_skin("u1", "fireplace")  # 0 coins, costs 200


def test_buy_deducts_coins_and_grants_ownership():
    store = ProfileStore()
    store.earn("u1", minutes=300, completed=False)  # 300 coins
    profile = store.buy_skin("u1", "fireplace")  # 200
    assert "fireplace" in profile.owned_skins
    assert profile.coins == 100


def test_cannot_buy_premium_with_coins():
    store = ProfileStore()
    store.earn("u1", minutes=600, completed=False)
    with pytest.raises(ValueError, match="premium"):
        store.buy_skin("u1", "space")


def test_equip_any_skin_is_selectable():
    store = ProfileStore()
    # 보관함: 구매 없이 어떤 스킨이든 바로 선택(장착) 가능
    profile = store.equip_skin("u1", "fireplace")
    assert profile.equipped_skin == "fireplace"
    assert "fireplace" in profile.owned_skins


def test_equip_unknown_skin_raises():
    store = ProfileStore()
    with pytest.raises(ValueError, match="unknown"):
        store.equip_skin("u1", "nope")
