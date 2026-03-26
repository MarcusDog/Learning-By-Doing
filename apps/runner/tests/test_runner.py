from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_runner_executes_python() -> None:
    response = client.post("/run", json={"code": "print('hello')"})
    assert response.status_code == 200
    assert response.json()["stdout"] == "hello\n"


def test_runner_times_out_long_running_code() -> None:
    response = client.post("/run", json={"code": "while True:\n    pass", "timeout_seconds": 0.2})
    assert response.status_code == 200
    payload = response.json()
    assert payload["timed_out"] is True
    assert payload["exit_code"] == 124
