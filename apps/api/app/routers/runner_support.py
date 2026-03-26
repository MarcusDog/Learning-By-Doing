from __future__ import annotations

import io
import multiprocessing
import queue
import traceback
from contextlib import redirect_stderr, redirect_stdout

from ..schemas import RunCodeResponse


def _run_snippet_worker(code: str, stdin: str | None, output_queue: multiprocessing.Queue) -> None:
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    namespace: dict[str, object] = {}

    try:
        with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
            if stdin is not None:
                namespace["stdin"] = stdin
            exec(compile(code, "<snippet>", "exec"), namespace, namespace)
        output_queue.put(
            {
                "stdout": stdout_buffer.getvalue(),
                "stderr": stderr_buffer.getvalue(),
                "exit_code": 0,
                "timed_out": False,
            }
        )
    except Exception:  # noqa: BLE001
        traceback.print_exc(file=stderr_buffer)
        output_queue.put(
            {
                "stdout": stdout_buffer.getvalue(),
                "stderr": stderr_buffer.getvalue(),
                "exit_code": 1,
                "timed_out": False,
            }
        )


def run_python_snippet(code: str, stdin: str | None, timeout_seconds: float) -> RunCodeResponse:
    ctx = multiprocessing.get_context("spawn")
    output_queue: multiprocessing.Queue = ctx.Queue()
    process = ctx.Process(target=_run_snippet_worker, args=(code, stdin, output_queue))
    process.start()
    process.join(timeout_seconds)

    if process.is_alive():
        process.terminate()
        process.join()
        return RunCodeResponse(
            stdout="",
            stderr="Execution timed out",
            exit_code=124,
            timed_out=True,
            trace_frames=[],
        )

    try:
        result = output_queue.get_nowait()
    except queue.Empty:
        result = {
            "stdout": "",
            "stderr": "Execution failed without output",
            "exit_code": 1,
            "timed_out": False,
        }

    return RunCodeResponse(
        stdout=result["stdout"],
        stderr=result["stderr"],
        exit_code=result["exit_code"],
        timed_out=result["timed_out"],
        trace_frames=[],
    )
