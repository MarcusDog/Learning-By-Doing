from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from .policy import MAX_STDIO_CHARS, MAX_TRACE_FRAMES


TRACE_WRAPPER = """
import contextlib
import io
import json
import sys
import traceback
from pathlib import Path

MAX_STDIO_CHARS = __MAX_STDIO_CHARS__
MAX_TRACE_FRAMES = __MAX_TRACE_FRAMES__
TRUNCATED_SUFFIX = "\\n[truncated]\\n"

script_path = Path(sys.argv[1]).resolve()
result_path = Path(sys.argv[2]).resolve()
trace_frames = []
variable_states = []
step = 0
notices = []
trace_limit_hit = False

def safe_repr(value):
    text = repr(value)
    if len(text) > 120:
        return text[:117] + "..."
    return text

def truncate_text(text, label):
    if len(text) <= MAX_STDIO_CHARS:
        return text
    notices.append(f"{label} truncated after {MAX_STDIO_CHARS} characters.")
    return text[: max(0, MAX_STDIO_CHARS - len(TRUNCATED_SUFFIX))] + TRUNCATED_SUFFIX

def tracer(frame, event, arg):
    global step, trace_limit_hit
    if event == "line" and Path(frame.f_code.co_filename).resolve() == script_path:
        if len(trace_frames) >= MAX_TRACE_FRAMES:
            trace_limit_hit = True
            return tracer
        step += 1
        variables = {
            key: safe_repr(value)
            for key, value in frame.f_locals.items()
            if not key.startswith("__")
        }
        trace_frames.append(
            {
                "step": step,
                "line_number": frame.f_lineno,
                "function_name": frame.f_code.co_name,
                "variables": variables,
            }
        )
        variable_states.append(
            {
                "step": step,
                "line_number": frame.f_lineno,
                "variables": variables,
            }
        )
    return tracer

stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()
exit_code = 0
exit_status = "completed"

globals_dict = {"__name__": "__main__", "__file__": str(script_path)}
source = compile(script_path.read_text(encoding="utf-8"), str(script_path), "exec")

try:
    sys.settrace(tracer)
    with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
        exec(source, globals_dict, globals_dict)
except Exception:
    exit_code = 1
    exit_status = "failed"
    traceback.print_exc(file=stderr_buffer)
finally:
    sys.settrace(None)

stdout_text = truncate_text(stdout_buffer.getvalue(), "stdout")
stderr_text = stderr_buffer.getvalue()
if trace_limit_hit:
    notices.append(f"Trace capture truncated after {MAX_TRACE_FRAMES} steps.")
stderr_text = truncate_text(stderr_text, "stderr")
if notices:
    if stderr_text and not stderr_text.endswith("\\n"):
        stderr_text += "\\n"
    stderr_text += "\\n".join(notices)
    if not stderr_text.endswith("\\n"):
        stderr_text += "\\n"

result_path.write_text(
    json.dumps(
        {
            "stdout": stdout_text,
            "stderr": stderr_text,
            "exit_code": exit_code,
            "exit_status": exit_status,
            "trace_frames": trace_frames,
            "variable_states": variable_states,
        },
        ensure_ascii=False,
    ),
    encoding="utf-8",
)
""".replace("__MAX_STDIO_CHARS__", str(MAX_STDIO_CHARS)).replace("__MAX_TRACE_FRAMES__", str(MAX_TRACE_FRAMES))


@dataclass(slots=True)
class ExecutionResult:
    job_id: str
    stdout: str
    stderr: str
    exit_code: int
    exit_status: str
    timed_out: bool
    trace_frames: list[dict]
    variable_states: list[dict]
    duration_ms: int


def run_python(source_code: str, stdin: str | None = None, timeout_seconds: float = 3.0, entrypoint: str = "main.py") -> ExecutionResult:
    started_at = time.perf_counter()
    job_id = f"run-{uuid4().hex[:8]}"

    with tempfile.TemporaryDirectory() as tmpdir:
        workdir = Path(tmpdir)
        script_path = workdir / entrypoint
        wrapper_path = workdir / "_trace_wrapper.py"
        result_path = workdir / "result.json"

        script_path.write_text(source_code, encoding="utf-8")
        wrapper_path.write_text(TRACE_WRAPPER, encoding="utf-8")

        try:
            subprocess.run(
                [sys.executable, "-I", str(wrapper_path), str(script_path), str(result_path)],
                input=stdin,
                text=True,
                capture_output=True,
                timeout=timeout_seconds,
                check=False,
            )
        except subprocess.TimeoutExpired as error:
            return ExecutionResult(
                job_id=job_id,
                stdout=error.stdout or "",
                stderr=(error.stderr or "Execution timed out"),
                exit_code=124,
                exit_status="timed_out",
                timed_out=True,
                trace_frames=[],
                variable_states=[],
                duration_ms=int((time.perf_counter() - started_at) * 1000),
            )

        if result_path.exists():
            payload = json.loads(result_path.read_text(encoding="utf-8"))
            return ExecutionResult(
                job_id=job_id,
                stdout=payload.get("stdout", ""),
                stderr=payload.get("stderr", ""),
                exit_code=payload.get("exit_code", 1),
                exit_status=payload.get("exit_status", "failed"),
                timed_out=False,
                trace_frames=payload.get("trace_frames", []),
                variable_states=payload.get("variable_states", []),
                duration_ms=int((time.perf_counter() - started_at) * 1000),
            )

        return ExecutionResult(
            job_id=job_id,
            stdout="",
            stderr="Runner failed to produce a result payload.",
            exit_code=1,
            exit_status="failed",
            timed_out=False,
            trace_frames=[],
            variable_states=[],
            duration_ms=int((time.perf_counter() - started_at) * 1000),
        )
