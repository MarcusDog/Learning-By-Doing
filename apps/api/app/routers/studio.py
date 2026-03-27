from fastapi import APIRouter, Depends, HTTPException

from ..current_user import resolve_optional_current_user
from ..schemas import (
    AIDiagnoseRequest,
    ProgressRecord,
    RunCodeRequest,
    UserProfile,
    StudioBootstrapResponse,
)
from ..services import (
    get_learning_pulse,
    get_learning_unit,
    get_primary_learning_path_for_unit,
    get_progress,
)
from .ai import explain
from .run import run_code

router = APIRouter(prefix="/studio", tags=["studio"])


def _infer_explanation_mode(visualization_kind: str) -> str:
    if visualization_kind == "algorithm-flow":
        return "exercise-coach"
    if visualization_kind == "control-flow":
        return "explain"
    return "code-map"


def _select_ai_focus_text(source_code: str) -> str | None:
    for line in source_code.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return None


def _build_studio_bootstrap(user_id: str, unit_slug: str) -> StudioBootstrapResponse:
    unit = get_learning_unit(unit_slug)
    path = get_primary_learning_path_for_unit(unit_slug)

    if unit is None or path is None:
        raise HTTPException(status_code=404, detail="Studio lesson not found")

    progress = get_progress(user_id, unit_slug)
    if progress is None:
        progress = ProgressRecord(user_id=user_id, unit_id=unit_slug)

    source_code = progress.code_draft or unit.example_code
    run_result = run_code(
        RunCodeRequest(
            source_code=source_code,
            language="python",
        )
    )
    ai_response = explain(
        AIDiagnoseRequest(
            mode=_infer_explanation_mode(unit.visualization_spec.kind),
            question=unit.learning_goal,
            code=source_code,
            selected_text=_select_ai_focus_text(source_code),
            context=unit.ai_explanation_context,
        )
    )

    return StudioBootstrapResponse(
        user_id=user_id,
        path_id=path.id,
        path_title=path.title,
        unit=unit,
        progress=progress,
        run_result=run_result,
        ai_response=ai_response,
        learning_pulse=get_learning_pulse(user_id),
    )


@router.get("/{user_id}/{unit_slug}", response_model=StudioBootstrapResponse)
def read_studio_bootstrap(
    user_id: str,
    unit_slug: str,
    current_user: UserProfile | None = Depends(resolve_optional_current_user),
) -> StudioBootstrapResponse:
    resolved_user_id = user_id
    if user_id == "me":
        if current_user is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        resolved_user_id = current_user.user_id

    return _build_studio_bootstrap(resolved_user_id, unit_slug)
