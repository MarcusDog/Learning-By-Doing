from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..schemas import LearningPulse, ProgressRecord
from ..services import (
    complete_progress,
    get_learning_pulse,
    get_progress,
    list_progress_for_user,
    save_progress,
)

router = APIRouter(prefix="/progress", tags=["progress"])


class CompleteProgressRequest(BaseModel):
    completed_step_ids: list[str] = Field(default_factory=list)


@router.get("/me", response_model=LearningPulse)
def me() -> LearningPulse:
    return get_learning_pulse("demo-user")


@router.get("/{user_id}", response_model=list[ProgressRecord])
def list_user_progress(user_id: str) -> list[ProgressRecord]:
    return list_progress_for_user(user_id)


@router.get("/{user_id}/{unit_id}", response_model=ProgressRecord)
def read_progress(user_id: str, unit_id: str) -> ProgressRecord:
    record = get_progress(user_id, unit_id)
    if record is None:
        return ProgressRecord(user_id=user_id, unit_id=unit_id)
    return record


@router.put("/{user_id}/{unit_id}", response_model=ProgressRecord)
def upsert_progress(user_id: str, unit_id: str, payload: ProgressRecord) -> ProgressRecord:
    return save_progress(payload.model_copy(update={"user_id": user_id, "unit_id": unit_id}))


@router.post("/{user_id}/complete/{unit_id}", response_model=ProgressRecord)
def mark_completed(user_id: str, unit_id: str, payload: CompleteProgressRequest) -> ProgressRecord:
    return complete_progress(user_id, unit_id, payload.completed_step_ids)
