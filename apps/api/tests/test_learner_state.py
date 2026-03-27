import json
from pathlib import Path

from fastapi.testclient import TestClient
from pytest import fixture

from app.main import app
from app.routers import run as run_router
from app.services import get_user, get_user_by_id, reload_learner_state, reset_learner_state


client = TestClient(app)


@fixture
def learner_state_path(tmp_path, monkeypatch) -> Path:
    state_path = tmp_path / "learner-state.json"
    monkeypatch.setenv("LEARNING_LEARNER_STATE_PATH", str(state_path))
    return state_path


@fixture(autouse=True)
def reset_learner_state_fixture(learner_state_path: Path) -> None:
    client.cookies.clear()
    reset_learner_state(remove_persisted=True)
    yield
    client.cookies.clear()
    reset_learner_state(remove_persisted=True)


def test_learner_state_persists_auth_and_progress_after_in_memory_reset(
    learner_state_path: Path,
) -> None:
    register_response = client.post(
        "/auth/register",
        json={
            "email": "persisted@example.com",
            "name": "Persisted Learner",
            "password": "demo-password",
        },
    )
    assert register_response.status_code == 200
    user_id = register_response.json()["user_id"]

    progress_payload = {
        "user_id": user_id,
        "unit_id": "python-variables",
        "status": "in_progress",
        "completed_step_ids": ["step-1", "step-2"],
        "code_draft": "value = 3\nprint(value)\n",
        "notes": "Need to revisit the second step.",
    }
    progress_response = client.put(
        f"/progress/{user_id}/python-variables",
        json=progress_payload,
    )
    assert progress_response.status_code == 200

    assert learner_state_path.exists() is True
    persisted_payload = json.loads(learner_state_path.read_text(encoding="utf-8"))
    assert persisted_payload["users"]["persisted@example.com"]["user_id"] == user_id
    assert {
        "user_id": user_id,
        "unit_id": "python-variables",
        "status": "in_progress",
        "completed_step_ids": ["step-1", "step-2"],
        "code_draft": "value = 3\nprint(value)\n",
        "notes": "Need to revisit the second step.",
    } in persisted_payload["progress_records"]

    reset_learner_state()

    assert get_user("persisted@example.com") is None
    reset_progress_response = client.get(f"/progress/{user_id}/python-variables")
    assert reset_progress_response.status_code == 200
    assert reset_progress_response.json()["status"] == "not_started"

    reload_learner_state()

    reloaded_user = get_user("persisted@example.com")
    assert reloaded_user is not None
    assert reloaded_user.user_id == user_id

    login_response = client.post(
        "/auth/login",
        json={"email": "persisted@example.com", "password": "demo-password"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user_id"] == user_id

    reloaded_progress_response = client.get(f"/progress/{user_id}/python-variables")
    assert reloaded_progress_response.status_code == 200
    assert reloaded_progress_response.json()["completed_step_ids"] == ["step-1", "step-2"]
    assert reloaded_progress_response.json()["notes"] == "Need to revisit the second step."


def test_current_user_session_routes_resolve_reloaded_non_demo_learner(
    learner_state_path: Path,
    monkeypatch,
) -> None:
    class FakeResponse:
        status_code = 200

        def json(self) -> dict[str, object]:
            return {
                "job_id": "run-session-user",
                "stdout": "3\n",
                "stderr": "",
                "exit_status": "completed",
                "exit_code": 0,
                "timed_out": False,
                "trace_frames": [],
                "variable_states": [],
                "duration_ms": 17,
            }

    monkeypatch.setattr(run_router.httpx, "post", lambda url, **kwargs: FakeResponse())

    register_response = client.post(
        "/auth/register",
        json={
            "email": "session@example.com",
            "name": "Session Learner",
            "password": "demo-password",
        },
    )
    assert register_response.status_code == 200
    auth_payload = register_response.json()
    user_id = auth_payload["user_id"]
    access_token = auth_payload["access_token"]

    progress_payload = {
        "user_id": user_id,
        "unit_id": "python-variables",
        "status": "completed",
        "completed_step_ids": ["read-example", "run-example", "predict-output"],
        "code_draft": "value = 3\nprint(value)\n",
        "notes": "Ready to move on.",
    }
    progress_response = client.put(
        f"/progress/{user_id}/python-variables",
        json=progress_payload,
    )
    assert progress_response.status_code == 200

    assert learner_state_path.exists() is True

    reset_learner_state()
    reload_learner_state()

    headers = {"Authorization": f"Bearer {access_token}"}

    me_response = client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "session@example.com"
    assert me_response.json()["user_id"] == user_id

    pulse_response = client.get("/progress/me", headers=headers)
    assert pulse_response.status_code == 200
    assert pulse_response.json()["user_id"] == user_id
    assert pulse_response.json()["completed_units"] == ["python-variables"]

    records_response = client.get("/progress/me/records", headers=headers)
    assert records_response.status_code == 200
    assert records_response.json() == [progress_payload]

    studio_response = client.get("/studio/me/python-variables", headers=headers)
    assert studio_response.status_code == 200
    assert studio_response.json()["user_id"] == user_id
    assert studio_response.json()["progress"]["completed_step_ids"] == [
        "read-example",
        "run-example",
        "predict-output",
    ]


def test_current_user_routes_reject_forged_email_shaped_tokens(learner_state_path: Path) -> None:
    register_response = client.post(
        "/auth/register",
        json={
            "email": "forged@example.com",
            "name": "Forged Learner",
            "password": "demo-password",
        },
    )
    assert register_response.status_code == 200

    client.cookies.clear()
    forged_headers = {"Authorization": "Bearer demo-token-for-forged@example.com"}

    me_response = client.get("/auth/me", headers=forged_headers)
    assert me_response.status_code == 401

    pulse_response = client.get("/progress/me", headers=forged_headers)
    assert pulse_response.status_code == 401


def test_guest_auth_stays_transient_until_guest_progress_is_saved(
    learner_state_path: Path,
) -> None:
    guest_response = client.post("/auth/guest")
    assert guest_response.status_code == 200
    guest_payload = guest_response.json()

    assert get_user_by_id(guest_payload["user_id"]) is None
    assert learner_state_path.exists() is False

    progress_response = client.put(
        f"/progress/{guest_payload['user_id']}/python-variables",
        json={
            "user_id": guest_payload["user_id"],
            "unit_id": "python-variables",
            "status": "in_progress",
            "completed_step_ids": ["step-1"],
            "code_draft": "value = 5\nprint(value)\n",
            "notes": "Guest learner saved progress.",
        },
    )
    assert progress_response.status_code == 200

    assert learner_state_path.exists() is True
    persisted_payload = json.loads(learner_state_path.read_text(encoding="utf-8"))
    assert any(
        email.startswith("guest-") and profile["user_id"] == guest_payload["user_id"]
        for email, profile in persisted_payload["users"].items()
    )
