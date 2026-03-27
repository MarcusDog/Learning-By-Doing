from fastapi import APIRouter, HTTPException, status

from ..schemas import (
    AdminConfigBundle,
    AdminDashboardMetrics,
    AdminPublishingCheck,
    AdminPublishingCheckUpdate,
    AdminPromptTemplate,
    AdminPromptTemplateUpdate,
    AdminUnitCreateRequest,
    AdminUnitInventoryItem,
    AdminUnitReviewUpdate,
    AdminSeedContentResponse,
    AdminUnitStatusUpdate,
)
from ..services import (
    create_admin_unit,
    get_admin_config_bundle,
    get_admin_dashboard_metrics,
    list_admin_unit_inventory,
    list_learning_units,
    publish_admin_unit,
    update_admin_unit_review,
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


@router.post(
    "/content/units",
    response_model=AdminUnitInventoryItem,
    status_code=status.HTTP_201_CREATED,
)
def create_content_unit(payload: AdminUnitCreateRequest) -> AdminUnitInventoryItem:
    created_unit = create_admin_unit(payload)
    if created_unit is None:
        raise HTTPException(status_code=409, detail="Unit slug or path is invalid.")
    return created_unit


@router.patch("/content/units/{slug}", response_model=AdminUnitInventoryItem)
def update_content_unit(slug: str, payload: AdminUnitStatusUpdate) -> AdminUnitInventoryItem:
    if payload.content_status == "published":
        raise HTTPException(status_code=409, detail="Use the publish action for published state.")
    updated_unit = update_admin_unit_status(slug, payload.content_status)
    if updated_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found.")
    return updated_unit


@router.patch("/content/units/{slug}/review", response_model=AdminUnitInventoryItem)
def update_content_unit_review(
    slug: str,
    payload: AdminUnitReviewUpdate,
) -> AdminUnitInventoryItem:
    updated_unit = update_admin_unit_review(slug, payload)
    if updated_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found.")
    return updated_unit


@router.post("/content/units/{slug}/publish", response_model=AdminUnitInventoryItem)
def publish_content_unit(slug: str) -> AdminUnitInventoryItem:
    published_unit, blockers = publish_admin_unit(slug)
    if published_unit is None and blockers:
        raise HTTPException(status_code=409, detail=blockers)
    if published_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found.")
    return published_unit


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
