from fastapi import APIRouter, HTTPException

from ..schemas import (
    AdminConfigBundle,
    AdminDashboardMetrics,
    AdminPublishingCheck,
    AdminPublishingCheckUpdate,
    AdminPromptTemplate,
    AdminPromptTemplateUpdate,
    AdminUnitInventoryItem,
    AdminSeedContentResponse,
    AdminUnitStatusUpdate,
)
from ..services import (
    get_admin_config_bundle,
    get_admin_dashboard_metrics,
    list_admin_unit_inventory,
    list_learning_units,
    update_admin_publishing_check,
    update_admin_prompt_template,
    update_admin_unit_status,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboardMetrics)
def dashboard() -> AdminDashboardMetrics:
    return get_admin_dashboard_metrics()


@router.get("/content/units", response_model=list[AdminUnitInventoryItem])
def content_units() -> list[AdminUnitInventoryItem]:
    return list_admin_unit_inventory()


@router.patch("/content/units/{slug}", response_model=AdminUnitInventoryItem)
def update_content_unit(slug: str, payload: AdminUnitStatusUpdate) -> AdminUnitInventoryItem:
    updated_unit = update_admin_unit_status(slug, payload.content_status)
    if updated_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found.")
    return updated_unit


@router.get("/config", response_model=AdminConfigBundle)
def config() -> AdminConfigBundle:
    return get_admin_config_bundle()


@router.patch("/config/prompt-templates/{template_id}", response_model=AdminPromptTemplate)
def update_prompt_template(
    template_id: str,
    payload: AdminPromptTemplateUpdate,
) -> AdminPromptTemplate:
    updated_template = update_admin_prompt_template(template_id, payload)
    if updated_template is None:
        raise HTTPException(status_code=404, detail="Prompt template not found.")
    return updated_template


@router.patch("/config/publishing-checks/{key}", response_model=AdminPublishingCheck)
def update_publishing_check(
    key: str,
    payload: AdminPublishingCheckUpdate,
) -> AdminPublishingCheck:
    updated_check = update_admin_publishing_check(key, payload)
    if updated_check is None:
        raise HTTPException(status_code=404, detail="Publishing check not found.")
    return updated_check


@router.post("/content/seed", response_model=AdminSeedContentResponse)
def seed_content() -> AdminSeedContentResponse:
    units = list_learning_units()
    return AdminSeedContentResponse(
        seeded=len(units),
        slugs=[unit.slug for unit in units],
    )
