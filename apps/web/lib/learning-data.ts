import type {
  ApiAIDiagnoseResponse,
  ApiLearningPathSummary,
  ApiLearningPulse,
  ApiLearningUnit,
  ApiPracticeTask,
  ApiProgressRecord,
  ApiRunCodeResponse,
  ApiStudioBootstrapResponse,
} from "../../../packages/shared-types/src";

type ApiRequestOptions = RequestInit & {
  allowNotFound?: boolean;
};

const DEFAULT_USER_ID = process.env.LEARNING_DEMO_USER_ID ?? "demo-user";

export type LessonUnit = {
  slug: string;
  title: string;
  audienceLevel: ApiLearningUnit["audience_level"];
  learningGoal: string;
  prerequisites: string[];
  conceptExplanation: string;
  exampleCode: string;
  visualization: {
    kind: ApiLearningUnit["visualization_spec"]["kind"];
    frames: Array<{
      step: number;
      lineNumber: number;
      focus: string;
      variables: Record<string, string>;
    }>;
  };
  practiceTasks: Array<{
    id: string;
    title: string;
    kind: ApiPracticeTask["kind"];
    prompt: string;
    expectedOutcome: string;
    hints: string[];
  }>;
  aiExplanationContext: string;
  acceptanceCriteria: string[];
};

export type LessonPath = {
  id: string;
  title: string;
  description: string;
  featuredUnitSlugs: string[];
  featuredUnit: LessonUnit;
  units: LessonUnit[];
};

export type StudioLesson = {
  pathId: string;
  pathTitle: string;
  unit: LessonUnit;
  progress: {
    userId: string;
    unitId: string;
    status: ApiProgressRecord["status"];
    completedStepIds: string[];
    codeDraft: string | null;
    notes: string | null;
  };
  runResult: ApiRunCodeResponse;
  aiResponse: {
    mode: ApiAIDiagnoseResponse["mode"];
    explanation: string;
    selectedText: string | null;
  };
  learningPulse: {
    userId: string;
    completedUnits: string[];
    streakDays: number;
    recentActivity: string[];
  };
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

async function fetchLearningApi<T>(
  pathname: string,
  { allowNotFound = false, ...init }: ApiRequestOptions = {},
): Promise<T | undefined> {
  const response = await fetch(`${getApiBaseUrl()}${pathname}`, {
    cache: "no-store",
    ...init,
  });

  if (allowNotFound && response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`Learning API request failed: ${response.status} ${pathname}`);
  }

  return (await response.json()) as T;
}

function normalizeUnit(unit: ApiLearningUnit): LessonUnit {
  return {
    slug: unit.slug,
    title: unit.title,
    audienceLevel: unit.audience_level,
    learningGoal: unit.learning_goal,
    prerequisites: unit.prerequisites,
    conceptExplanation: unit.concept_explanation,
    exampleCode: unit.example_code,
    visualization: {
      kind: unit.visualization_spec.kind,
      frames: unit.visualization_spec.frames.map((frame) => ({
        step: frame.step,
        lineNumber: frame.line_number,
        focus: frame.focus,
        variables: frame.variables,
      })),
    },
    practiceTasks: unit.practice_tasks.map((task) => ({
      id: task.id,
      title: task.title,
      kind: task.kind,
      prompt: task.prompt,
      expectedOutcome: task.expected_outcome,
      hints: task.hints,
    })),
    aiExplanationContext: unit.ai_explanation_context,
    acceptanceCriteria: unit.acceptance_criteria,
  };
}

function normalizeProgress(progress: ApiProgressRecord) {
  return {
    userId: progress.user_id,
    unitId: progress.unit_id,
    status: progress.status,
    completedStepIds: progress.completed_step_ids,
    codeDraft: progress.code_draft,
    notes: progress.notes,
  };
}

function normalizeLearningPulse(progressFeed: ApiLearningPulse) {
  return {
    userId: progressFeed.user_id,
    completedUnits: progressFeed.completed_units,
    streakDays: progressFeed.streak_days,
    recentActivity: progressFeed.recent_activity,
  };
}

function attachFeaturedUnit(
  path: ApiLearningPathSummary,
  unitsBySlug: Map<string, LessonUnit>,
): LessonPath {
  const featuredUnitSlug = path.featured_unit_slugs[0];
  const featuredUnit = unitsBySlug.get(featuredUnitSlug);
  const units = path.featured_unit_slugs.map((slug) => {
    const unit = unitsBySlug.get(slug);

    if (!unit) {
      throw new Error(`Missing lesson ${slug} for path ${path.id}`);
    }

    return unit;
  });

  if (!featuredUnit) {
    throw new Error(`Missing featured lesson for path ${path.id}`);
  }

  return {
    id: path.id,
    title: path.title,
    description: path.description,
    featuredUnitSlugs: path.featured_unit_slugs,
    featuredUnit,
    units,
  };
}

async function listPathSummaries() {
  return (await fetchLearningApi<ApiLearningPathSummary[]>(
    "/content/paths",
  )) as ApiLearningPathSummary[];
}

async function listRawUnits() {
  return (await fetchLearningApi<ApiLearningUnit[]>(
    "/content/units",
  )) as ApiLearningUnit[];
}

async function getRawUnit(slug: string) {
  return await fetchLearningApi<ApiLearningUnit>(
    `/content/units/${slug}`,
    { allowNotFound: true },
  );
}

export async function listLessonUnits(): Promise<LessonUnit[]> {
  const units = await listRawUnits();
  return units.map(normalizeUnit);
}

export async function getLessonUnit(
  slug: string,
): Promise<LessonUnit | undefined> {
  const unit = await getRawUnit(slug);
  return unit ? normalizeUnit(unit) : undefined;
}

export async function listLessonPaths(): Promise<LessonPath[]> {
  const [paths, units] = await Promise.all([listPathSummaries(), listRawUnits()]);
  const unitsBySlug = new Map(
    units.map((unit) => {
      const normalized = normalizeUnit(unit);
      return [normalized.slug, normalized] as const;
    }),
  );

  return paths.map((path) => attachFeaturedUnit(path, unitsBySlug));
}

export async function getLessonPath(
  id: string,
): Promise<LessonPath | undefined> {
  const [paths, units] = await Promise.all([listPathSummaries(), listRawUnits()]);
  const path = paths.find((candidate) => candidate.id === id);

  if (!path) {
    return undefined;
  }

  const unitsBySlug = new Map(
    units.map((unit) => {
      const normalized = normalizeUnit(unit);
      return [normalized.slug, normalized] as const;
    }),
  );

  return attachFeaturedUnit(path, unitsBySlug);
}

export async function getStudioLesson(
  unitSlug: string,
): Promise<StudioLesson | undefined> {
  const bootstrap = await fetchLearningApi<ApiStudioBootstrapResponse>(
    `/studio/${DEFAULT_USER_ID}/${unitSlug}`,
    { allowNotFound: true },
  );

  if (!bootstrap) {
    return undefined;
  }

  return {
    pathId: bootstrap.path_id,
    pathTitle: bootstrap.path_title,
    unit: normalizeUnit(bootstrap.unit),
    progress: normalizeProgress(bootstrap.progress),
    runResult: bootstrap.run_result,
    aiResponse: {
      mode: bootstrap.ai_response.mode,
      explanation: bootstrap.ai_response.explanation,
      selectedText: bootstrap.ai_response.selected_text,
    },
    learningPulse: normalizeLearningPulse(bootstrap.learning_pulse),
  };
}
