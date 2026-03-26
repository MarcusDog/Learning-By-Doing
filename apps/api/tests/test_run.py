import httpx
from fastapi.testclient import TestClient

from app.routers import run as run_router
from app.main import app


client = TestClient(app)


def test_run_endpoint_executes_python(monkeypatch) -> None:
    class FakeResponse:
        status_code = 200

        def json(self) -> dict[str, object]:
            return {
                "job_id": "run-hello",
                "stdout": "hello\n",
                "stderr": "",
                "exit_status": "completed",
                "exit_code": 0,
                "timed_out": False,
                "trace_frames": [],
                "variable_states": [],
                "duration_ms": 8,
            }

    monkeypatch.setattr(run_router.httpx, "post", lambda url, **kwargs: FakeResponse())

    response = client.post("/run", json={"code": "print('hello')" })
    assert response.status_code == 200
    payload = response.json()
    assert payload["stdout"] == "hello\n"
    assert payload["timed_out"] is False


def test_run_endpoint_rejects_unsafe_entrypoint() -> None:
    response = client.post(
        "/run",
        json={"code": "print('hello')", "entrypoint": "../escape.py"},
    )

    assert response.status_code == 422
    assert "entrypoint" in response.text


def test_run_endpoint_rejects_timeout_above_limit() -> None:
    response = client.post(
        "/run",
        json={"code": "print('hello')", "timeout_seconds": 99},
    )

    assert response.status_code == 422
    assert "timeout_seconds" in response.text


def test_run_endpoint_proxies_to_runner(monkeypatch) -> None:
    class FakeResponse:
        status_code = 200

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "job_id": "run-proxied",
                "stdout": "hello\\n",
                "stderr": "",
                "exit_status": "completed",
                "exit_code": 0,
                "timed_out": False,
                "trace_frames": [],
                "variable_states": [],
                "duration_ms": 12,
            }

    captured: dict[str, object] = {}

    def fake_post(url: str, *, json: dict[str, object], timeout: float) -> FakeResponse:
        captured["url"] = url
        captured["json"] = json
        captured["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr(run_router.httpx, "post", fake_post)

    response = client.post(
        "/run",
        json={"code": "print('hello')", "entrypoint": "main.py", "timeout_seconds": 1.5},
    )

    assert response.status_code == 200
    assert response.json()["job_id"] == "run-proxied"
    assert captured["url"] == "http://127.0.0.1:8002/run"
    assert captured["json"] == {
        "source_code": "print('hello')",
        "code": "print('hello')",
        "entrypoint": "main.py",
        "language": "python",
        "stdin": None,
        "timeout_seconds": 1.5,
    }
    assert captured["timeout"] == 2.5


def test_run_endpoint_returns_bad_gateway_when_runner_is_unavailable(monkeypatch) -> None:
    def fake_post(url: str, *, json: dict[str, object], timeout: float):
        raise httpx.RequestError("runner offline", request=httpx.Request("POST", url))

    monkeypatch.setattr(run_router.httpx, "post", fake_post)

    response = client.post("/run", json={"code": "print('hello')"})

    assert response.status_code == 502
    assert "runner service is unavailable" in response.json()["detail"].lower()
