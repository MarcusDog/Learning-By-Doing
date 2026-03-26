from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


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
    progress_response = client.get("/progress/demo-user/ai-prompt-basics")

    assert progress_response.status_code == 200
    progress_body = progress_response.json()
    assert progress_body["status"] == "in_progress"
    assert progress_body["completed_step_ids"] == ["spot-vague-prompt"]
    assert progress_body["notes"] == "正在练习把问题说得更具体。"

    pulse_response = client.get("/progress/me")

    assert pulse_response.status_code == 200
    pulse_body = pulse_response.json()
    assert pulse_body["completed_units"] == ["bubble-sort-intuition"]
