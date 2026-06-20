from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _register(username, password="pw1234", name=None):
    r = client.post(
        "/api/auth/register",
        json={"username": username, "password": password, "display_name": name or username},
    )
    assert r.status_code == 201, r.text
    return r.json()["user_id"]


def test_summary_aggregates_member_sessions_and_mvp():
    a = _register("alice")
    b = _register("bob")

    # 모임 생성/참여
    g = client.post("/api/teams", json={"name": "같이 집중"}, headers={"X-User-Id": a}).json()
    client.post("/api/teams/join", json={"code": g["code"]}, headers={"X-User-Id": b})

    # 각자 세션 저장 (오늘)
    client.post("/api/sessions", json={"task": "알고리즘", "duration_min": 50, "completed": True}, headers={"X-User-Id": a})
    client.post("/api/sessions", json={"task": "영어", "duration_min": 20, "completed": True}, headers={"X-User-Id": b})

    s = client.get(f"/api/teams/{g['id']}/summary").json()
    assert s["member_count"] == 2
    assert s["total_minutes"] == 70
    assert s["mvp_id"] == a  # alice 가 더 많이 집중
    # 리더보드 정렬: alice 먼저, 이름은 서버가 채움
    assert s["leaderboard"][0]["name"] == "alice"
    assert s["leaderboard"][0]["minutes"] == 50


def test_presence_heartbeat_then_listed():
    a = _register("carol")
    g = client.post("/api/teams", json={"name": "P"}, headers={"X-User-Id": a}).json()
    client.post(f"/api/teams/{g['id']}/heartbeat", json={"task": "집중중"}, headers={"X-User-Id": a})
    rows = client.get(f"/api/teams/{g['id']}/presence").json()
    assert any(r["user_id"] == a and r["task"] == "집중중" for r in rows)


def test_feed_lists_completed_sessions():
    a = _register("dave")
    g = client.post("/api/teams", json={"name": "F"}, headers={"X-User-Id": a}).json()
    client.post("/api/sessions", json={"task": "독서", "duration_min": 30, "completed": True}, headers={"X-User-Id": a})
    feed = client.get(f"/api/teams/{g['id']}/feed").json()
    assert any(item["task"] == "독서" and item["name"] == "dave" for item in feed)


def test_join_unknown_code_returns_404():
    a = _register("erin")
    r = client.post("/api/teams/join", json={"code": "ZZZZZZ"}, headers={"X-User-Id": a})
    assert r.status_code == 404


def test_create_requires_login():
    r = client.post("/api/teams", json={"name": "X"})
    assert r.status_code == 401
