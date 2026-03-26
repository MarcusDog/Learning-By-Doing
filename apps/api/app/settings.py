from __future__ import annotations

import os
from pathlib import Path


RUNNER_BASE_URL = os.environ.get("LEARNING_RUNNER_BASE_URL", "http://127.0.0.1:8002").rstrip("/")
RUNNER_TIMEOUT_BUFFER_SECONDS = 1.0
API_ROOT = Path(__file__).resolve().parents[1]


def get_admin_content_state_path() -> Path:
    configured_path = os.environ.get("LEARNING_ADMIN_CONTENT_STATE_PATH")
    if configured_path:
        return Path(configured_path)
    return API_ROOT / ".local" / "admin-content-state.json"


def get_learner_state_path() -> Path:
    configured_path = os.environ.get("LEARNING_LEARNER_STATE_PATH")
    if configured_path:
        return Path(configured_path)
    return API_ROOT / ".local" / "learner-state.json"
