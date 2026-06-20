import pytest

from team_store import GroupError, MAX_MEMBERS, TeamStore


def test_create_generates_code_and_owner_joins():
    store = TeamStore()
    g = store.create("스터디", "u1", "지호")
    assert len(g.code) == 6
    assert g.owner_id == "u1"
    assert [m.user_id for m in g.members] == ["u1"]


def test_join_by_code_adds_member():
    store = TeamStore()
    g = store.create("스터디", "u1", "지호")
    g2 = store.join(g.code, "u2", "민지")
    assert {m.user_id for m in g2.members} == {"u1", "u2"}


def test_join_bad_code_raises_not_found():
    store = TeamStore()
    with pytest.raises(GroupError, match="not_found"):
        store.join("ZZZZZZ", "u2", "민지")


def test_join_is_idempotent_and_updates_name():
    store = TeamStore()
    g = store.create("스터디", "u1", "지호")
    store.join(g.code, "u2", "민지")
    g2 = store.join(g.code, "u2", "민지수")  # 같은 유저 재참여
    members = [m for m in g2.members if m.user_id == "u2"]
    assert len(members) == 1
    assert members[0].name == "민지수"


def test_join_full_raises():
    store = TeamStore()
    g = store.create("스터디", "owner", "방장")
    for i in range(MAX_MEMBERS - 1):
        store.join(g.code, f"u{i}", f"이름{i}")
    with pytest.raises(GroupError, match="full"):
        store.join(g.code, "overflow", "초과")


def test_mine_lists_user_groups():
    store = TeamStore()
    a = store.create("A", "u1", "지호")
    b = store.create("B", "u9", "다른")
    store.join(b.code, "u1", "지호")
    mine = store.mine("u1")
    ids = {g.id for g in mine}
    assert ids == {a.id, b.id}


def test_find_by_code_case_insensitive():
    store = TeamStore()
    g = store.create("A", "u1", "지호")
    assert store.find_by_code(g.code.lower()).id == g.id
