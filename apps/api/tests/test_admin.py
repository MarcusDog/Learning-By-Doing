import json
from pathlib import Path
from typing import get_args

from fastapi.testclient import TestClient
from pytest import fixture

from app.main import app
from app.schemas import VisualizationKind
from app.services import reload_admin_content_state, reset_admin_content_state


client = TestClient(app)


@fixture
def admin_state_path(tmp_path, monkeypatch) -> Path:
    state_path = tmp_path / "admin-content-state.json"
    monkeypatch.setenv("LEARNING_ADMIN_CONTENT_STATE_PATH", str(state_path))
    return state_path


@fixture(autouse=True)
def reset_admin_state(admin_state_path: Path) -> None:
    reset_admin_content_state(remove_persisted=True)
    yield
    reset_admin_content_state(remove_persisted=True)


def test_admin_dashboard_reports_content_operations_metrics() -> None:
    response = client.get("/admin/dashboard")

    assert response.status_code == 200
    payload = response.json()
    assert payload["published_units"] == 2
    assert payload["draft_units"] == 2
    assert payload["pending_reviews"] == 2
    assert payload["ai_prompt_sets"] == 4
    assert payload["total_paths"] == 3
    assert payload["total_practice_tasks"] == 12
    assert payload["total_acceptance_criteria"] == 12


def test_admin_unit_inventory_includes_table_ready_metadata() -> None:
    response = client.get("/admin/content/units")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 6

    unit = next(item for item in payload if item["slug"] == "ai-prompt-basics")
    assert unit["title"] == "提示词第一步"
    assert unit["audience_level"] == "beginner_first"
    assert unit["learning_goal"] == "理解提示词如何影响模型输出，并学会把模糊需求改写成清晰请求。"
    assert unit["content_status"] == "draft"
    assert unit["practice_task_count"] == 2
    assert unit["acceptance_criteria_count"] == 2
    assert unit["visualization_kind"] == "control-flow"
    assert unit["path_ids"] == ["ai-basics"]
    assert unit["path_titles"] == ["AI 基础"]

    search_unit = next(item for item in payload if item["slug"] == "linear-search-intuition")
    assert search_unit["content_status"] == "review"
    assert search_unit["path_ids"] == ["algorithm-visualization"]
    assert search_unit["visualization_kind"] == "algorithm-flow"


def test_admin_prompt_and_config_placeholders_are_visible() -> None:
    config_response = client.get("/admin/config")

    assert config_response.status_code == 200
    config_payload = config_response.json()
    assert len(config_payload["prompt_templates"]) == 4
    assert config_payload["prompt_templates"][0]["status"] == "placeholder"
    assert config_payload["prompt_templates"][0]["scope"] == "content_pipeline"
    assert config_payload["prompt_templates"][0]["applies_to_unit_slugs"] == [
        "python-variables",
        "python-functions-intro",
        "ai-prompt-basics",
        "ai-answer-checking",
        "bubble-sort-intuition",
        "linear-search-intuition",
    ]
    assert len(config_payload["publishing_checks"]) == 4
    assert config_payload["publishing_checks"][0]["required"] is True
    assert config_payload["publishing_checks"][0]["enabled"] is True


def test_admin_seed_content_still_returns_current_unit_slugs() -> None:
    response = client.post("/admin/content/seed")

    assert response.status_code == 200
    payload = response.json()
    assert payload["seeded"] == 6
    assert payload["slugs"] == [
        "python-variables",
        "python-functions-intro",
        "ai-prompt-basics",
        "ai-answer-checking",
        "bubble-sort-intuition",
        "linear-search-intuition",
    ]


def test_admin_openapi_exposes_typed_inventory_and_seed_response_models() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    payload = response.json()
    schemas = payload["components"]["schemas"]
    unit_schema = schemas["AdminUnitInventoryItem"]
    visualization_kind_schema = unit_schema["properties"]["visualization_kind"]

    assert visualization_kind_schema["type"] == "string"
    assert visualization_kind_schema["enum"] == list(get_args(VisualizationKind))

    seed_response_schema = (
        payload["paths"]["/admin/content/seed"]["post"]["responses"]["200"]["content"][
            "application/json"
        ]["schema"]
    )
    assert seed_response_schema == {"$ref": "#/components/schemas/AdminSeedContentResponse"}


def test_admin_unit_status_update_flows_through_inventory_and_dashboard() -> None:
    response = client.patch(
        "/admin/content/units/ai-prompt-basics",
        json={"content_status": "review"},
    )

    assert response.status_code == 200
    assert response.json()["content_status"] == "review"

    dashboard_response = client.get("/admin/dashboard")
    assert dashboard_response.status_code == 200
    dashboard_payload = dashboard_response.json()
    assert dashboard_payload["published_units"] == 2
    assert dashboard_payload["draft_units"] == 1
    assert dashboard_payload["pending_reviews"] == 3

    inventory_response = client.get("/admin/content/units")
    assert inventory_response.status_code == 200
    inventory_payload = inventory_response.json()
    unit = next(item for item in inventory_payload if item["slug"] == "ai-prompt-basics")
    assert unit["content_status"] == "review"


def test_admin_prompt_template_patch_updates_template_fields() -> None:
    response = client.patch(
        "/admin/config/prompt-templates/unit-intro",
        json={
            "description": "为每个学习单元生成更明确的开场说明。",
            "applies_to_unit_slugs": ["python-variables"],
            "status": "ready",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["applies_to_unit_slugs"] == ["python-variables"]

    config_response = client.get("/admin/config")
    assert config_response.status_code == 200
    config_payload = config_response.json()
    template = next(
        item for item in config_payload["prompt_templates"] if item["id"] == "unit-intro"
    )
    assert template["status"] == "ready"
    assert template["description"] == "为每个学习单元生成更明确的开场说明。"
    assert template["applies_to_unit_slugs"] == ["python-variables"]


def test_admin_publishing_check_patch_updates_toggles() -> None:
    response = client.patch(
        "/admin/config/publishing-checks/seed-sync",
        json={
            "label": "种子同步审查",
            "description": "确认示例数据和内容编辑状态保持一致。",
            "required": True,
            "enabled": False,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "种子数据同步"
    assert payload["description"] == "确认内容变更和演示种子保持同步。"
    assert payload["enabled"] is False
    assert payload["required"] is True

    config_response = client.get("/admin/config")
    assert config_response.status_code == 200
    config_payload = config_response.json()
    check = next(
        item for item in config_payload["publishing_checks"] if item["key"] == "seed-sync"
    )
    assert check["label"] == "种子数据同步"
    assert check["enabled"] is False
    assert check["required"] is True


def test_admin_content_ops_state_persists_and_reloads_after_in_memory_reset(
    admin_state_path: Path,
) -> None:
    client.patch(
        "/admin/content/units/ai-prompt-basics",
        json={"content_status": "published"},
    )
    client.patch(
        "/admin/config/prompt-templates/unit-intro",
        json={
            "description": "为每个学习单元生成更明确的开场说明。",
            "applies_to_unit_slugs": ["ai-answer-checking", "linear-search-intuition"],
            "status": "ready",
        },
    )
    client.patch(
        "/admin/config/publishing-checks/seed-sync",
        json={"required": True, "enabled": False},
    )

    assert admin_state_path.exists() is True
    persisted_payload = json.loads(admin_state_path.read_text(encoding="utf-8"))
    assert persisted_payload["unit_content_statuses"]["ai-prompt-basics"] == "published"

    reset_admin_content_state()

    reset_inventory_response = client.get("/admin/content/units")
    reset_config_response = client.get("/admin/config")
    reset_unit = next(
        item for item in reset_inventory_response.json() if item["slug"] == "ai-prompt-basics"
    )
    reset_template = next(
        item
        for item in reset_config_response.json()["prompt_templates"]
        if item["id"] == "unit-intro"
    )
    reset_check = next(
        item
        for item in reset_config_response.json()["publishing_checks"]
        if item["key"] == "seed-sync"
    )

    assert reset_unit["content_status"] == "draft"
    assert reset_template["status"] == "placeholder"
    assert reset_check["enabled"] is True
    assert reset_check["required"] is False

    reload_admin_content_state()

    reloaded_inventory_response = client.get("/admin/content/units")
    reloaded_config_response = client.get("/admin/config")
    reloaded_unit = next(
        item
        for item in reloaded_inventory_response.json()
        if item["slug"] == "ai-prompt-basics"
    )
    reloaded_template = next(
        item
        for item in reloaded_config_response.json()["prompt_templates"]
        if item["id"] == "unit-intro"
    )
    reloaded_check = next(
        item
        for item in reloaded_config_response.json()["publishing_checks"]
        if item["key"] == "seed-sync"
    )

    assert reloaded_unit["content_status"] == "published"
    assert reloaded_template["status"] == "ready"
    assert reloaded_template["description"] == "为每个学习单元生成更明确的开场说明。"
    assert reloaded_template["applies_to_unit_slugs"] == [
        "ai-answer-checking",
        "linear-search-intuition",
    ]
    assert reloaded_check["enabled"] is False
    assert reloaded_check["required"] is True
