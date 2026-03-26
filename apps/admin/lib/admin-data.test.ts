import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ApiAdminConfigBundle,
  ApiAdminDashboardMetrics,
  ApiAdminPromptTemplate,
  ApiAdminPromptTemplateUpdate,
  ApiAdminPublishingCheck,
  ApiAdminPublishingCheckUpdate,
  ApiAdminSeedContentResponse,
  ApiAdminUnitInventoryItem,
  ApiAdminUnitStatusUpdate,
} from "@learning-by-doing/shared-types";

import {
  getAdminContentOpsData,
  seedAdminContent,
  updatePublishingCheck,
  updatePromptTemplate,
  updateUnitStatus,
} from "./admin-data";

const API_BASE_URL = "http://learning-api.test";

const fetchMock = vi.fn();

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function installFetchHandlers(
  handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>,
) {
  fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const handler = handlers[`${method} ${url}`];

    if (!handler) {
      throw new Error(`Unhandled fetch: ${method} ${url}`);
    }

    return handler(init);
  });
}

beforeEach(() => {
  process.env.LEARNING_API_BASE_URL = API_BASE_URL;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.LEARNING_API_BASE_URL;
});

describe("admin data", () => {
  it("loads and normalizes the content ops overview from the live API", async () => {
    const dashboardPayload: ApiAdminDashboardMetrics = {
      published_units: 3,
      draft_units: 2,
      pending_reviews: 1,
      ai_prompt_sets: 4,
      total_paths: 3,
      total_practice_tasks: 6,
      total_acceptance_criteria: 5,
    };
    const unitsPayload: ApiAdminUnitInventoryItem[] = [
      {
        slug: "python-variables",
        title: "第一段 Python",
        audience_level: "beginner_first",
        learning_goal: "理解变量、表达式和输出的关系。",
        prerequisite_count: 0,
        practice_task_count: 2,
        acceptance_criteria_count: 2,
        visualization_kind: "variable-state",
        path_ids: ["python-foundations"],
        path_titles: ["Python 入门"],
        content_status: "published",
      },
      {
        slug: "ai-prompt-basics",
        title: "提示词第一步",
        audience_level: "beginner_first",
        learning_goal: "学会把模糊问题改写成清晰请求。",
        prerequisite_count: 0,
        practice_task_count: 2,
        acceptance_criteria_count: 2,
        visualization_kind: "control-flow",
        path_ids: ["ai-basics"],
        path_titles: ["AI 基础"],
        content_status: "draft",
      },
    ];
    const configPayload: ApiAdminConfigBundle = {
      prompt_templates: [
        {
          id: "lesson-outline",
          title: "课程大纲生成",
          scope: "content_pipeline",
          status: "placeholder",
          description: "统一学习目标、讲解结构和练习任务骨架。",
          applies_to_unit_slugs: ["python-variables"],
        },
      ],
      publishing_checks: [
        {
          key: "beginner-language",
          label: "新手语言检查",
          description: "避免术语跳步，确保示例从生活类比切入。",
          required: true,
          enabled: true,
        },
      ],
    };

    installFetchHandlers({
      [`GET ${API_BASE_URL}/admin/dashboard`]: () => jsonResponse(dashboardPayload),
      [`GET ${API_BASE_URL}/admin/content/units`]: () => jsonResponse(unitsPayload),
      [`GET ${API_BASE_URL}/admin/config`]: () => jsonResponse(configPayload),
    });

    const result = await getAdminContentOpsData();

    expect(result).toMatchObject({
      dashboard: {
        publishedUnits: 3,
        draftUnits: 2,
        pendingReviews: 1,
        aiPromptSets: 4,
        totalPaths: 3,
        totalPracticeTasks: 6,
        totalAcceptanceCriteria: 5,
      },
      units: [
        {
          slug: "python-variables",
          audienceLevel: "beginner_first",
          prerequisiteCount: 0,
          practiceTaskCount: 2,
          acceptanceCriteriaCount: 2,
          visualizationKind: "variable-state",
          pathIds: ["python-foundations"],
          pathTitles: ["Python 入门"],
          contentStatus: "published",
        },
        {
          slug: "ai-prompt-basics",
          contentStatus: "draft",
        },
      ],
      promptTemplates: [
        {
          id: "lesson-outline",
          title: "课程大纲生成",
          scope: "content_pipeline",
          description: "统一学习目标、讲解结构和练习任务骨架。",
          status: "placeholder",
        },
      ],
      publishingChecks: [
        {
          key: "beginner-language",
          label: "新手语言检查",
          required: true,
          enabled: true,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("posts the seed action to the live API", async () => {
    const responsePayload: ApiAdminSeedContentResponse = {
      seeded: 3,
      slugs: ["python-variables", "ai-prompt-basics", "bubble-sort-intuition"],
    };

    installFetchHandlers({
      [`POST ${API_BASE_URL}/admin/content/seed`]: (init) => {
        expect(init?.method).toBe("POST");

        return jsonResponse(responsePayload);
      },
    });

    await expect(seedAdminContent()).resolves.toEqual(responsePayload);
  });

  it("patches unit workflow status through the live API", async () => {
    const requestPayload: ApiAdminUnitStatusUpdate = {
      content_status: "review",
    };
    const responsePayload: ApiAdminUnitInventoryItem = {
      slug: "ai-prompt-basics",
      title: "提示词第一步",
      audience_level: "beginner_first",
      learning_goal: "学会把模糊问题改写成清晰请求。",
      prerequisite_count: 0,
      practice_task_count: 2,
      acceptance_criteria_count: 2,
      visualization_kind: "control-flow",
      path_ids: ["ai-basics"],
      path_titles: ["AI 基础"],
      content_status: "review",
    };

    installFetchHandlers({
      [`PATCH ${API_BASE_URL}/admin/content/units/ai-prompt-basics`]: (init) => {
        expect(init?.method).toBe("PATCH");
        expect(init?.headers).toMatchObject({
          "Content-Type": "application/json",
        });
        expect(init?.body).toBe(JSON.stringify(requestPayload));

        return jsonResponse(responsePayload);
      },
    });

    await expect(updateUnitStatus("ai-prompt-basics", "review")).resolves.toMatchObject({
      slug: "ai-prompt-basics",
      contentStatus: "review",
    });
  });

  it("patches prompt template details through the live API", async () => {
    const requestPayload: ApiAdminPromptTemplateUpdate = {
      status: "ready",
      description: "统一生成学习导语，并附带一个贴近日常的比喻。",
      applies_to_unit_slugs: ["python-variables", "ai-prompt-basics"],
    };
    const responsePayload: ApiAdminPromptTemplate = {
      id: "unit-intro",
      title: "单元导语模板",
      scope: "content_pipeline",
      status: "ready",
      description: "统一生成学习导语，并附带一个贴近日常的比喻。",
      applies_to_unit_slugs: ["python-variables", "ai-prompt-basics"],
    };

    installFetchHandlers({
      [`PATCH ${API_BASE_URL}/admin/config/prompt-templates/unit-intro`]: (init) => {
        expect(init?.method).toBe("PATCH");
        expect(init?.body).toBe(JSON.stringify(requestPayload));

        return jsonResponse(responsePayload);
      },
    });

    await expect(
      updatePromptTemplate("unit-intro", {
        status: "ready",
        description: "统一生成学习导语，并附带一个贴近日常的比喻。",
        appliesToUnitSlugs: ["python-variables", "ai-prompt-basics"],
      }),
    ).resolves.toMatchObject({
      id: "unit-intro",
      status: "ready",
      appliesToUnitSlugs: ["python-variables", "ai-prompt-basics"],
    });
  });

  it("patches publishing check toggles through the live API", async () => {
    const requestPayload: ApiAdminPublishingCheckUpdate = {
      enabled: false,
      required: false,
    };
    const responsePayload: ApiAdminPublishingCheck = {
      key: "seed-sync",
      label: "种子数据同步",
      description: "确认内容变更和演示种子保持同步。",
      required: false,
      enabled: false,
    };

    installFetchHandlers({
      [`PATCH ${API_BASE_URL}/admin/config/publishing-checks/seed-sync`]: (init) => {
        expect(init?.method).toBe("PATCH");
        expect(init?.body).toBe(JSON.stringify(requestPayload));

        return jsonResponse(responsePayload);
      },
    });

    await expect(
      updatePublishingCheck("seed-sync", {
        enabled: false,
        required: false,
      }),
    ).resolves.toMatchObject({
      key: "seed-sync",
      enabled: false,
      required: false,
    });
  });
});
