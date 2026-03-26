import type {
  AdminPromptTemplateStatus,
  AdminUnitContentStatus,
  ApiAdminConfigBundle,
  ApiAdminDashboardMetrics,
  ApiAdminPromptTemplate,
  ApiAdminPromptTemplateUpdate,
  ApiAdminPublishingCheck,
  ApiAdminPublishingCheckUpdate,
  ApiAdminSeedContentResponse,
  ApiAdminUnitInventoryItem,
  ApiAdminUnitStatusUpdate,
  VisualizationKind,
} from "@learning-by-doing/shared-types";

export type AdminDashboard = {
  publishedUnits: number;
  draftUnits: number;
  pendingReviews: number;
  aiPromptSets: number;
  totalPaths: number;
  totalPracticeTasks: number;
  totalAcceptanceCriteria: number;
};

export type AdminUnitSummary = {
  slug: string;
  title: string;
  audienceLevel: ApiAdminUnitInventoryItem["audience_level"];
  learningGoal: string;
  prerequisiteCount: number;
  practiceTaskCount: number;
  acceptanceCriteriaCount: number;
  visualizationKind: VisualizationKind;
  pathIds: string[];
  pathTitles: string[];
  contentStatus: ApiAdminUnitInventoryItem["content_status"];
};

export type PromptTemplate = {
  id: string;
  title: string;
  scope: string;
  description: string;
  status: AdminPromptTemplateStatus;
  appliesToUnitSlugs: string[];
};

export type PublishingCheck = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  enabled: boolean;
};

export type SeedAdminContentResult = ApiAdminSeedContentResponse;

export type AdminUnitStatus = AdminUnitContentStatus;
export type PromptTemplateStatus = AdminPromptTemplateStatus;

export type AdminContentOpsData = {
  dashboard: AdminDashboard;
  units: AdminUnitSummary[];
  promptTemplates: PromptTemplate[];
  publishingChecks: PublishingCheck[];
};

function getApiBaseUrl() {
  const configuredBaseUrl =
    process.env.LEARNING_API_BASE_URL ??
    process.env.NEXT_PUBLIC_LEARNING_API_BASE_URL ??
    "http://127.0.0.1:8000";

  return configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;
}

async function fetchLearningApi<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${pathname}`, {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Learning API request failed: ${response.status} ${pathname}`);
  }

  return (await response.json()) as T;
}

function normalizeDashboard(dashboard: ApiAdminDashboardMetrics): AdminDashboard {
  return {
    publishedUnits: dashboard.published_units,
    draftUnits: dashboard.draft_units,
    pendingReviews: dashboard.pending_reviews,
    aiPromptSets: dashboard.ai_prompt_sets,
    totalPaths: dashboard.total_paths,
    totalPracticeTasks: dashboard.total_practice_tasks,
    totalAcceptanceCriteria: dashboard.total_acceptance_criteria,
  };
}

function normalizeUnit(unit: ApiAdminUnitInventoryItem): AdminUnitSummary {
  return {
    slug: unit.slug,
    title: unit.title,
    audienceLevel: unit.audience_level,
    learningGoal: unit.learning_goal,
    prerequisiteCount: unit.prerequisite_count,
    practiceTaskCount: unit.practice_task_count,
    acceptanceCriteriaCount: unit.acceptance_criteria_count,
    visualizationKind: unit.visualization_kind,
    pathIds: unit.path_ids,
    pathTitles: unit.path_titles,
    contentStatus: unit.content_status,
  };
}

export async function getAdminContentOpsData(): Promise<AdminContentOpsData> {
  const [dashboard, units, config] = await Promise.all([
    fetchLearningApi<ApiAdminDashboardMetrics>("/admin/dashboard"),
    fetchLearningApi<ApiAdminUnitInventoryItem[]>("/admin/content/units"),
    fetchLearningApi<ApiAdminConfigBundle>("/admin/config"),
  ]);

  return {
    dashboard: normalizeDashboard(dashboard),
    units: units.map(normalizeUnit),
    promptTemplates: config.prompt_templates.map((template) => ({
      id: template.id,
      title: template.title,
      scope: template.scope,
      description: template.description,
      status: template.status,
      appliesToUnitSlugs: template.applies_to_unit_slugs,
    })),
    publishingChecks: config.publishing_checks.map((check) => ({
      key: check.key,
      label: check.label,
      description: check.description,
      required: check.required,
      enabled: check.enabled,
    })),
  };
}

export async function seedAdminContent(): Promise<SeedAdminContentResult> {
  return fetchLearningApi<ApiAdminSeedContentResponse>("/admin/content/seed", {
    method: "POST",
  });
}

export async function updateUnitStatus(
  slug: string,
  contentStatus: AdminUnitStatus,
): Promise<AdminUnitSummary> {
  const requestPayload: ApiAdminUnitStatusUpdate = {
    content_status: contentStatus,
  };

  const unit = await fetchLearningApi<ApiAdminUnitInventoryItem>(`/admin/content/units/${slug}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  return normalizeUnit(unit);
}

export async function updatePromptTemplate(
  id: string,
  payload: {
    status: PromptTemplateStatus;
    description: string;
    appliesToUnitSlugs: string[];
  },
): Promise<PromptTemplate> {
  const requestPayload: ApiAdminPromptTemplateUpdate = {
    status: payload.status,
    description: payload.description,
    applies_to_unit_slugs: payload.appliesToUnitSlugs,
  };

  const template = await fetchLearningApi<ApiAdminPromptTemplate>(
    `/admin/config/prompt-templates/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    },
  );

  return {
    id: template.id,
    title: template.title,
    scope: template.scope,
    description: template.description,
    status: template.status,
    appliesToUnitSlugs: template.applies_to_unit_slugs,
  };
}

export async function updatePublishingCheck(
  key: string,
  payload: {
    enabled: boolean;
    required: boolean;
  },
): Promise<PublishingCheck> {
  const requestPayload: ApiAdminPublishingCheckUpdate = {
    enabled: payload.enabled,
    required: payload.required,
  };

  const check = await fetchLearningApi<ApiAdminPublishingCheck>(
    `/admin/config/publishing-checks/${key}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    },
  );

  return {
    key: check.key,
    label: check.label,
    description: check.description,
    required: check.required,
    enabled: check.enabled,
  };
}
