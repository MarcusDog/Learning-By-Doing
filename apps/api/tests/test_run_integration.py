from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_run_endpoint_delegates_to_spawned_runner(live_runner_base_url: str) -> None:
    response = client.post(
        "/run",
        json={
            "code": "value = 2\nprint(value + 3)\n",
            "entrypoint": "main.py",
            "timeout_seconds": 1.5,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["exit_status"] == "completed"
    assert payload["stdout"] == "5\n"
    assert payload["timed_out"] is False
    assert payload["job_id"].startswith("run-")
    assert len(payload["trace_frames"]) >= 1
    assert payload["variable_states"][-1]["variables"]["value"] == "2"
