import { describe, expect, expectTypeOf, it } from "vitest";
import {
  AI_EXPLANATION_MODES,
  ADMIN_PROMPT_TEMPLATE_STATUSES,
  ADMIN_UNIT_CONTENT_STATUSES,
  AUDIENCE_LEVELS,
  PRACTICE_TASK_KINDS,
  PROGRESS_STATUSES,
  RUN_EXIT_STATUSES,
  RUN_JOB_STATUSES,
  VISUALIZATION_KINDS,
  type ApiAdminConfigBundle,
  type ApiAdminDashboardMetrics,
  type ApiAdminPublishingCheckUpdate,
  type ApiAdminPromptTemplateUpdate,
  type ApiAdminSeedContentResponse,
  type ApiAdminUnitInventoryItem,
  type ApiAdminUnitStatusUpdate,
  type ApiLearningUnit,
  type ApiRunCodeResponse,
  type ApiStudioBootstrapResponse,
} from "../src";

// @ts-expect-error admin visualization kinds should reject arbitrary strings
const INVALID_ADMIN_VISUALIZATION_KIND: ApiAdminUnitInventoryItem["visualization_kind"] =
  "not-a-real-visualization-kind";

describe("shared contracts", () => {
  it("exposes stable AI explanation modes", () => {
    expect(AI_EXPLANATION_MODES).toEqual([
      "explain",
      "code-map",
      "exercise-coach",
      "paper-tutor",
    ]);
  });

  it("exposes run job lifecycle statuses", () => {
    expect(RUN_JOB_STATUSES).toEqual([
      "queued",
      "running",
      "completed",
      "failed",
      "timed_out",
    ]);
  });

  it("keeps supported visualization kinds ordered from simplest to richest", () => {
    expect(VISUALIZATION_KINDS).toEqual([
      "variable-state",
      "control-flow",
      "call-stack",
      "data-structure",
      "algorithm-flow",
      "tensor-shape",
    ]);
  });

  it("exposes learner API contract literals used by the Python backend", () => {
    expect(AUDIENCE_LEVELS).toEqual([
      "beginner_first",
      "intermediate",
      "advanced",
    ]);
    expect(PRACTICE_TASK_KINDS).toEqual(["guided", "transfer"]);
    expect(PROGRESS_STATUSES).toEqual([
      "not_started",
      "in_progress",
      "completed",
    ]);
    expect(RUN_EXIT_STATUSES).toEqual([
      "completed",
      "failed",
      "timed_out",
    ]);
  });

  it("models learner studio payloads with backend-aligned snake_case fields", () => {
    expectTypeOf<ApiLearningUnit>().toMatchTypeOf<{
      audience_level: "beginner_first" | "intermediate" | "advanced";
      learning_goal: string;
      concept_explanation: string;
      example_code: string;
      visualization_spec: {
        kind: (typeof VISUALIZATION_KINDS)[number];
        frames: Array<{
          line_number: number;
          variables: Record<string, string>;
        }>;
      };
      practice_tasks: Array<{
        kind: "guided" | "transfer";
        expected_outcome: string;
      }>;
      ai_explanation_context: string;
      acceptance_criteria: string[];
    }>();

    expectTypeOf<ApiRunCodeResponse>().toMatchTypeOf<{
      job_id: string;
      exit_status: "completed" | "failed" | "timed_out";
      exit_code: number;
      timed_out: boolean;
      trace_frames: Array<{
        line_number: number;
        function_name: string;
      }>;
      variable_states: Array<{
        line_number: number;
        variables: Record<string, string>;
      }>;
      duration_ms: number;
    }>();

    expectTypeOf<ApiStudioBootstrapResponse>().toMatchTypeOf<{
      user_id: string;
      path_id: string;
      path_title: string;
      unit: ApiLearningUnit;
      run_result: ApiRunCodeResponse;
    }>();
  });

  it("models admin content ops payloads with backend-aligned snake_case fields", () => {
    expect(ADMIN_UNIT_CONTENT_STATUSES).toEqual([
      "draft",
      "review",
      "published",
      "archived",
    ]);
    expect(ADMIN_PROMPT_TEMPLATE_STATUSES).toEqual([
      "placeholder",
      "ready",
    ]);

    expectTypeOf<ApiAdminDashboardMetrics>().toMatchTypeOf<{
      published_units: number;
      draft_units: number;
      pending_reviews: number;
      ai_prompt_sets: number;
      total_paths: number;
      total_practice_tasks: number;
      total_acceptance_criteria: number;
    }>();

    expectTypeOf<ApiAdminUnitInventoryItem>().toMatchTypeOf<{
      slug: string;
      audience_level: (typeof AUDIENCE_LEVELS)[number];
      learning_goal: string;
      content_status: (typeof ADMIN_UNIT_CONTENT_STATUSES)[number];
      path_ids: string[];
      path_titles: string[];
      prerequisite_count: number;
      practice_task_count: number;
      acceptance_criteria_count: number;
      visualization_kind: (typeof VISUALIZATION_KINDS)[number];
    }>();

    expectTypeOf<ApiAdminUnitInventoryItem["visualization_kind"]>().toEqualTypeOf<
      (typeof VISUALIZATION_KINDS)[number]
    >();

    expectTypeOf<ApiAdminConfigBundle>().toMatchTypeOf<{
      prompt_templates: Array<{
        status: (typeof ADMIN_PROMPT_TEMPLATE_STATUSES)[number];
        applies_to_unit_slugs: string[];
      }>;
      publishing_checks: Array<{
        key: string;
        required: boolean;
        enabled: boolean;
      }>;
    }>();

    expectTypeOf<ApiAdminUnitStatusUpdate>().toMatchTypeOf<{
      content_status: (typeof ADMIN_UNIT_CONTENT_STATUSES)[number];
    }>();

    expectTypeOf<ApiAdminPromptTemplateUpdate>().toMatchTypeOf<{
      status: (typeof ADMIN_PROMPT_TEMPLATE_STATUSES)[number];
      description: string;
      applies_to_unit_slugs: string[];
    }>();

    expectTypeOf<ApiAdminPublishingCheckUpdate>().toMatchTypeOf<{
      enabled: boolean;
      required: boolean;
    }>();

    expectTypeOf<ApiAdminSeedContentResponse>().toMatchTypeOf<{
      seeded: number;
      slugs: string[];
    }>();
  });
});
