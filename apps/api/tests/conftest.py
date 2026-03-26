from collections.abc import Generator
from pathlib import Path
import shutil
import subprocess
import sys
import time

import httpx
import pytest

from app.routers import run as run_router

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

RUNNER_ROOT = ROOT.parent / "runner"


def _runner_command(port: int) -> list[str]:
    uv_bin = shutil.which("uv")
    if uv_bin is not None:
        return [
            uv_bin,
            "run",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "warning",
        ]
    return [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--log-level",
        "warning",
    ]


def _wait_for_runner_ready(base_url: str, process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 10
    last_error = "runner did not start"

    while time.monotonic() < deadline:
        if process.poll() is not None:
            stderr = process.stderr.read() if process.stderr is not None else ""
            raise RuntimeError(f"Runner exited before becoming ready: {stderr.strip()}")
        try:
            response = httpx.get(f"{base_url}/health", timeout=0.2)
            if response.status_code == 200:
                return
            last_error = f"unexpected health status {response.status_code}"
        except httpx.HTTPError as error:
            last_error = str(error)
        time.sleep(0.1)

    raise RuntimeError(f"Runner did not become ready: {last_error}")


@pytest.fixture
def live_runner_base_url(monkeypatch: pytest.MonkeyPatch, unused_tcp_port_factory) -> Generator[str]:
    port = unused_tcp_port_factory()
    base_url = f"http://127.0.0.1:{port}"
    process = subprocess.Popen(
        _runner_command(port),
        cwd=RUNNER_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    try:
        _wait_for_runner_ready(base_url, process)
        monkeypatch.setattr(run_router, "RUNNER_BASE_URL", base_url)
        yield base_url
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
