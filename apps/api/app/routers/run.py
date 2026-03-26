from __future__ import annotations

import httpx

from fastapi import APIRouter, HTTPException

from ..schemas import RunCodeRequest, RunCodeResponse
from ..settings import RUNNER_BASE_URL, RUNNER_TIMEOUT_BUFFER_SECONDS

router = APIRouter(prefix="/run", tags=["run"])


def _run_python(request: RunCodeRequest) -> RunCodeResponse:
    try:
        response = httpx.post(
            f"{RUNNER_BASE_URL}/run",
            json=request.model_dump(mode="json"),
            timeout=request.timeout_seconds + RUNNER_TIMEOUT_BUFFER_SECONDS,
        )
    except httpx.RequestError as error:
        raise HTTPException(status_code=502, detail="Runner service is unavailable.") from error

    if response.status_code >= 500:
        raise HTTPException(status_code=502, detail="Runner service failed to execute code.")
    if response.status_code >= 400:
        detail = "Runner rejected the request."
        try:
            payload = response.json()
        except ValueError:
            payload = None
        if isinstance(payload, dict) and "detail" in payload:
            detail = payload["detail"]
        raise HTTPException(status_code=response.status_code, detail=detail)

    try:
        return RunCodeResponse.model_validate(response.json())
    except (ValueError, TypeError) as error:
        raise HTTPException(status_code=502, detail="Runner returned an invalid response.") from error


@router.post("", response_model=RunCodeResponse)
@router.post("/execute", response_model=RunCodeResponse)
def run_code(request: RunCodeRequest) -> RunCodeResponse:
    return _run_python(request)
