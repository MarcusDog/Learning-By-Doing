from fastapi import APIRouter

router = APIRouter(prefix="/imports", tags=["imports"])


@router.get("/status")
def status() -> dict[str, str]:
    return {"paper_imports": "disabled_until_phase_5"}

