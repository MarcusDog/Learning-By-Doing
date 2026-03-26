from fastapi import APIRouter, HTTPException

from ..schemas import LearningPathSummary, LearningUnit
from ..services import get_learning_unit, list_learning_paths, list_learning_units

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/paths", response_model=list[LearningPathSummary])
def list_paths() -> list[LearningPathSummary]:
    return list_learning_paths()


@router.get("/units", response_model=list[LearningUnit])
def list_units() -> list[LearningUnit]:
    return list_learning_units()


@router.get("/units/{slug}", response_model=LearningUnit)
@router.get("/learning-units/{slug}", response_model=LearningUnit)
def get_unit(slug: str) -> LearningUnit:
    unit = get_learning_unit(slug)
    if unit is None:
        raise HTTPException(status_code=404, detail="Learning unit not found")
    return unit
