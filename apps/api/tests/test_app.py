from fastapi.testclient import TestClient
from pytest import fixture

from app.main import app


client = TestClient(app)


@fixture(autouse=True)
def clear_client_cookies() -> None:
    client.cookies.clear()
    yield
    client.cookies.clear()


def test_healthcheck():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_learning_unit_lookup():
    response = client.get("/content/learning-units/python-variables")

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "python-variables"
    assert body["audience_level"] == "beginner_first"


def test_progress_upsert_roundtrip():
    payload = {
        "user_id": "user-demo",
        "unit_id": "python-variables",
        "status": "in_progress",
        "completed_step_ids": ["step-1"],
        "code_draft": "count = 1",
        "notes": "Need to review variables again.",
    }

    save_response = client.put("/progress/user-demo/python-variables", json=payload)
    assert save_response.status_code == 200
    assert save_response.json()["status"] == "in_progress"

    fetch_response = client.get("/progress/user-demo/python-variables")
    assert fetch_response.status_code == 200
    assert fetch_response.json()["completed_step_ids"] == ["step-1"]


def test_demo_progress_seed_supports_live_studio_bootstrap():
    login_response = client.post(
        "/auth/login",
        json={"email": "learner@example.com", "password": "demo-password"},
    )
    assert login_response.status_code == 200

    demo_headers = {
        "Authorization": f"Bearer {login_response.json()['access_token']}",
    }

    progress_response = client.get("/progress/demo-user/ai-prompt-basics")

    assert progress_response.status_code == 200
    progress_body = progress_response.json()
    assert progress_body["status"] == "in_progress"
    assert progress_body["completed_step_ids"] == ["spot-vague-prompt"]
    assert progress_body["notes"] == "正在练习把问题说得更具体。"

    pulse_response = client.get("/progress/me", headers=demo_headers)

    assert pulse_response.status_code == 200
    pulse_body = pulse_response.json()
    assert pulse_body["completed_units"] == ["bubble-sort-intuition"]


def test_current_user_routes_require_bearer_token():
    auth_response = client.get("/auth/me")
    assert auth_response.status_code == 401
    assert auth_response.json()["detail"] == "Authentication required"

    pulse_response = client.get("/progress/me")
    assert pulse_response.status_code == 401
    assert pulse_response.json()["detail"] == "Authentication required"

    studio_response = client.get("/studio/me/ai-prompt-basics")
    assert studio_response.status_code == 401
    assert studio_response.json()["detail"] == "Authentication required"


def test_guest_auth_issues_cookie_backed_session():
    guest_response = client.post("/auth/guest")

    assert guest_response.status_code == 200
    payload = guest_response.json()
    assert payload["access_token"]
    assert "learning_session=" in guest_response.headers["set-cookie"]

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {payload['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"].startswith("guest-")


def test_current_user_routes_accept_session_cookie_without_bearer_header():
    guest_response = client.post("/auth/guest")
    assert guest_response.status_code == 200

    me_response = client.get("/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"].startswith("guest-")

    pulse_response = client.get("/progress/me")
    assert pulse_response.status_code == 200
    assert pulse_response.json()["user_id"] == guest_response.json()["user_id"]


def test_current_user_progress_records_route_accepts_session_cookie() -> None:
    guest_response = client.post("/auth/guest")
    assert guest_response.status_code == 200
    user_id = guest_response.json()["user_id"]

    progress_payload = {
        "user_id": user_id,
        "unit_id": "ai-prompt-basics",
        "status": "in_progress",
        "completed_step_ids": ["read-example"],
        "code_draft": 'task = "Explain variables simply."\nprint(task)\n',
        "notes": "Picked back up in studio.",
    }
    save_response = client.put(f"/progress/{user_id}/ai-prompt-basics", json=progress_payload)
    assert save_response.status_code == 200

    records_response = client.get("/progress/me/records")
    assert records_response.status_code == 200
    assert records_response.json() == [progress_payload]
