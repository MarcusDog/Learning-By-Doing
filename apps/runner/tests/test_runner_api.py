from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_runner_healthcheck():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_execute_python_code_returns_stdout_and_trace_frames():
    response = client.post(
        "/execute",
        json={
            "source_code": "value = 2\nresult = value + 3\nprint(result)\n",
            "entrypoint": "main.py",
            "language": "python",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["stdout"].strip() == "5"
    assert body["exit_status"] == "completed"
    assert len(body["trace_frames"]) >= 1
    assert body["variable_states"][-1]["variables"]["result"] == "5"


def test_execute_python_code_times_out():
    response = client.post(
        "/execute",
        json={
            "source_code": "while True:\n    pass\n",
            "entrypoint": "main.py",
            "language": "python",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["exit_status"] == "timed_out"
    assert "timed out" in body["stderr"].lower()


def test_execute_rejects_unsafe_entrypoint():
    response = client.post(
        "/execute",
        json={
            "source_code": "print('hello')\n",
            "entrypoint": "../escape.py",
            "language": "python",
        },
    )

    assert response.status_code == 422
    assert "entrypoint" in response.text


def test_execute_rejects_unsupported_language():
    response = client.post(
        "/execute",
        json={
            "source_code": "console.log('hello')\n",
            "entrypoint": "main.py",
            "language": "javascript",
        },
    )

    assert response.status_code == 422
    assert "language" in response.text


def test_execute_truncates_large_stdout():
    response = client.post(
        "/execute",
        json={
            "source_code": "print('x' * 5000)\n",
            "entrypoint": "main.py",
            "language": "python",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["exit_status"] == "completed"
    assert len(body["stdout"]) < 5001
    assert body["stdout"].endswith("[truncated]\n")
    assert "stdout truncated" in body["stderr"].lower()


def test_execute_caps_trace_frames_for_long_running_program():
    response = client.post(
        "/execute",
        json={
            "source_code": (
                "count = 0\n"
                "for i in range(400):\n"
                "    count = i\n"
                "print(count)\n"
            ),
            "entrypoint": "main.py",
            "language": "python",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["exit_status"] == "completed"
    assert len(body["trace_frames"]) == 200
    assert len(body["variable_states"]) == 200
    assert "trace capture truncated" in body["stderr"].lower()
