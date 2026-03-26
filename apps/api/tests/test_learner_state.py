import json
from pathlib import Path

from fastapi.testclient import TestClient
from pytest import fixture

from app.main import app
from app.services import get_user, reload_learner_state, reset_learner_state


client = TestClient(app)


@fixture
def learner_state_path(tmp_path, monkeypatch) -> Path:
    state_path = tmp_path / "learner-state.json"
    monkeypatch.setenv("LEARNING_LEARNER_STATE_PATH", str(state_path))
    return state_path


@fixture(autouse=True)
def reset_learner_state_fixture(learner_state_path: Path) -> None:
    reset_learner_state(remove_persisted=True)
    yield
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
