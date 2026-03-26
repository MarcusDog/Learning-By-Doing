from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator

from .executor import run_python
from .policy import (
    ENTRYPOINT_PATTERN,
    MAX_SOURCE_CODE_CHARS,
    MAX_STDIN_CHARS,
    MAX_TIMEOUT_SECONDS,
    MIN_TIMEOUT_SECONDS,
)


class RunRequest(BaseModel):
    source_code: str | None = Field(default=None, max_length=MAX_SOURCE_CODE_CHARS)
    code: str | None = Field(default=None, max_length=MAX_SOURCE_CODE_CHARS)
    stdin: str | None = Field(default=None, max_length=MAX_STDIN_CHARS)
    timeout_seconds: float = Field(default=3.0, ge=MIN_TIMEOUT_SECONDS, le=MAX_TIMEOUT_SECONDS)
    entrypoint: str = Field(default="main.py", pattern=ENTRYPOINT_PATTERN)
    language: Literal["python"] = "python"

    @model_validator(mode="after")
    def ensure_source_code(self) -> "RunRequest":
        source_code = self.source_code if self.source_code is not None else self.code
        if source_code is None or not source_code.strip():
            raise ValueError("Either source_code or code must be provided.")
        self.source_code = source_code
        return self


class TraceFrame(BaseModel):
    step: int
    line_number: int
    function_name: str
    variables: dict[str, str] = Field(default_factory=dict)


class VariableState(BaseModel):
    step: int
    line_number: int
    variables: dict[str, str] = Field(default_factory=dict)


class RunResponse(BaseModel):
    job_id: str
    stdout: str
    stderr: str
    exit_code: int
    exit_status: str
    timed_out: bool = False
    trace_frames: list[TraceFrame] = Field(default_factory=list)
    variable_states: list[VariableState] = Field(default_factory=list)
    duration_ms: int


app = FastAPI(title="Learning By Doing Runner", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _execute(request: RunRequest) -> RunResponse:
    source_code = request.source_code or request.code or ""
    result = run_python(
        source_code=source_code,
        stdin=request.stdin,
        timeout_seconds=request.timeout_seconds,
        entrypoint=request.entrypoint,
    )
    return RunResponse(
        job_id=result.job_id,
        stdout=result.stdout,
        stderr=result.stderr,
        exit_code=result.exit_code,
        exit_status=result.exit_status,
        timed_out=result.timed_out,
        trace_frames=result.trace_frames,
        variable_states=result.variable_states,
        duration_ms=result.duration_ms,
    )


@app.post("/run", response_model=RunResponse)
def run(request: RunRequest) -> RunResponse:
    return _execute(request)


@app.post("/execute", response_model=RunResponse)
def execute(request: RunRequest) -> RunResponse:
    return _execute(request)
