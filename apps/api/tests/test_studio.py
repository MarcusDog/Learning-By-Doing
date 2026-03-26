from fastapi.testclient import TestClient

from app.routers import run as run_router
from app.main import app


client = TestClient(app)


def test_studio_bootstrap_aggregates_unit_progress_run_and_ai(monkeypatch) -> None:
    class FakeResponse:
        status_code = 200

        def json(self) -> dict[str, object]:
            return {
                "job_id": "run-bootstrap",
                "stdout": "请用项目符号解释变量，并给一个点奶茶的例子。\n",
                "stderr": "",
                "exit_status": "completed",
                "exit_code": 0,
                "timed_out": False,
                "trace_frames": [],
                "variable_states": [],
                "duration_ms": 18,
            }

    monkeypatch.setattr(run_router.httpx, "post", lambda url, **kwargs: FakeResponse())

    response = client.get("/studio/demo-user/ai-prompt-basics")

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == "demo-user"
    assert payload["path_id"] == "ai-basics"
    assert payload["path_title"] == "AI 基础"
    assert payload["unit"]["slug"] == "ai-prompt-basics"
    assert payload["progress"]["status"] == "in_progress"
    assert payload["progress"]["completed_step_ids"] == ["spot-vague-prompt"]
    assert payload["run_result"]["job_id"] == "run-bootstrap"
    assert payload["ai_response"]["mode"] == "explain"
    assert "task = " in payload["ai_response"]["selected_text"]
    assert payload["learning_pulse"]["completed_units"] == ["bubble-sort-intuition"]


def test_studio_bootstrap_returns_not_found_for_unknown_unit() -> None:
    response = client.get("/studio/demo-user/does-not-exist")

    assert response.status_code == 404
    assert response.json()["detail"] == "Studio lesson not found"
