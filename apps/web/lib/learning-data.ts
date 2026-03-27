import { cookies } from "next/headers";
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

type ApiRequestOptions = RequestLearningApiOptions & {
  allowNotFound?: boolean;
  allowUnauthorized?: boolean;
};

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

export type LessonPathNavigationItem = Pick<LessonPath, "id" | "title">;

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

export type LearnerSummary = {
  userId: string;
  name: string;
  email: string;
  plan: "free" | "pro";
  completedUnitCount: number;
  streakDays: number;
  recentActivity: string[];
};

export type LearnerUnitProgressSummary = {
  unitSlug: string;
  unitTitle: string;
  pathId: string;
  pathTitle: string;
  status: ApiProgressRecord["status"];
  completedStepCount: number;
  totalStepCount: number;
  lessonHref: string;
  studioHref: string;
};

export type LearnerPathProgressSummary = {
  pathId: string;
  pathTitle: string;
  totalUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  notStartedUnits: number;
  completionPercent: number;
  nextUnitSlug: string | null;
  nextUnitTitle: string | null;
  units: LearnerUnitProgressSummary[];
};

export type LearnerProgressSnapshot = {
  totalUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  notStartedUnits: number;
  completionPercent: number;
  recentActivity: string[];
  pathSummaries: LearnerPathProgressSummary[];
};

export type LearnerOverview = {
  summary: LearnerSummary;
  progressSnapshot: LearnerProgressSnapshot;
};

type ApiCurrentUserProfile = {
  user_id: string;
  name: string;
  email: string;
  plan: LearnerSummary["plan"];
};

type SessionAccessOptions = {
  bootstrapGuestSession?: boolean;
  accessToken?: string | null;
};

type RequestLearningApiOptions = RequestInit & SessionAccessOptions;

function getApiBaseUrl() {
  const configuredBaseUrl =
    process.env.LEARNING_API_BASE_URL ??
    process.env.NEXT_PUBLIC_LEARNING_API_BASE_URL ??
    "http://127.0.0.1:8000";

  return configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;
}

async function getSessionAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("learning_session")?.value ?? null;
}

async function createGuestSessionAccessToken() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/guest`, {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      access_token?: string;
    };
    return payload.access_token ?? null;
  } catch {
    return null;
  }
}

async function resolveSessionAccessToken(bootstrapGuestSession = false) {
  const existingAccessToken = await getSessionAccessToken();
  if (existingAccessToken) {
    return existingAccessToken;
  }

  if (!bootstrapGuestSession) {
    return null;
  }

  return createGuestSessionAccessToken();
}

function withAuthorizationHeader(
  init: RequestInit = {},
  accessToken: string | null,
) {
  const headers = new Headers(init.headers);

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
  };
}

async function requestLearningApi(
  pathname: string,
  {
    bootstrapGuestSession = false,
    accessToken,
    ...init
  }: RequestLearningApiOptions = {},
) {
  const resolvedAccessToken = accessToken ?? await resolveSessionAccessToken(bootstrapGuestSession);
  const requestInit = withAuthorizationHeader(init, resolvedAccessToken);

  return fetch(`${getApiBaseUrl()}${pathname}`, {
    cache: "no-store",
    ...requestInit,
  });
}

async function fetchLearningApi<T>(
  pathname: string,
  {
    allowNotFound = false,
    allowUnauthorized = false,
    ...init
  }: ApiRequestOptions = {},
): Promise<T | undefined> {
  const response = await requestLearningApi(pathname, init);

  if (allowNotFound && response.status === 404) {
    return undefined;
  }

  if (allowUnauthorized && response.status === 401) {
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

function getUnitProgressStatus(
  unitSlug: string,
  record: ApiProgressRecord | undefined,
  completedUnitSlugs: Set<string>,
): ApiProgressRecord["status"] {
  if (completedUnitSlugs.has(unitSlug) || record?.status === "completed") {
    return "completed";
  }

  if (record?.status === "in_progress") {
    return "in_progress";
  }

  return "not_started";
}

function buildLearnerProgressSnapshot(
  paths: LessonPath[],
  pulse: ApiLearningPulse,
  progressRecords: ApiProgressRecord[],
): LearnerProgressSnapshot {
  const recordsByUnit = new Map(progressRecords.map((record) => [record.unit_id, record] as const));
  const completedUnitSlugs = new Set(pulse.completed_units);

  const pathSummaries = paths.map((path) => {
    const units = path.units.map((unit) => {
      const record = recordsByUnit.get(unit.slug);
      const totalStepCount = unit.practiceTasks.length + 1;
      const status = getUnitProgressStatus(unit.slug, record, completedUnitSlugs);
      const completedStepCount = status === "completed"
        ? totalStepCount
        : Math.min(record?.completed_step_ids.length ?? 0, totalStepCount);

      return {
        unitSlug: unit.slug,
        unitTitle: unit.title,
        pathId: path.id,
        pathTitle: path.title,
        status,
        completedStepCount,
        totalStepCount,
        lessonHref: `/learn/${path.id}/${unit.slug}`,
        studioHref: `/studio/${unit.slug}`,
      } satisfies LearnerUnitProgressSummary;
    });

    const completedUnits = units.filter((unit) => unit.status === "completed").length;
    const inProgressUnits = units.filter((unit) => unit.status === "in_progress").length;
    const totalUnits = units.length;
    const notStartedUnits = totalUnits - completedUnits - inProgressUnits;
    const nextUnit = units.find((unit) => unit.status !== "completed") ?? null;

    return {
      pathId: path.id,
      pathTitle: path.title,
      totalUnits,
      completedUnits,
      inProgressUnits,
      notStartedUnits,
      completionPercent: totalUnits === 0 ? 0 : Math.round((completedUnits / totalUnits) * 100),
      nextUnitSlug: nextUnit?.unitSlug ?? null,
      nextUnitTitle: nextUnit?.unitTitle ?? null,
      units,
    } satisfies LearnerPathProgressSummary;
  });

  const totalUnits = pathSummaries.reduce((sum, path) => sum + path.totalUnits, 0);
  const completedUnits = pathSummaries.reduce((sum, path) => sum + path.completedUnits, 0);
  const inProgressUnits = pathSummaries.reduce((sum, path) => sum + path.inProgressUnits, 0);
  const notStartedUnits = totalUnits - completedUnits - inProgressUnits;

  return {
    totalUnits,
    completedUnits,
    inProgressUnits,
    notStartedUnits,
    completionPercent: totalUnits === 0 ? 0 : Math.round((completedUnits / totalUnits) * 100),
    recentActivity: pulse.recent_activity,
    pathSummaries,
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

export async function listLessonPathNavigation(): Promise<LessonPathNavigationItem[]> {
  const paths = await listPathSummaries();
  return paths.map((path) => ({
    id: path.id,
    title: path.title,
  }));
}

export function getRecommendedPathUnit(
  path: LessonPath,
  progressSummary?: LearnerPathProgressSummary | null,
) {
  if (!progressSummary?.nextUnitSlug) {
    return path.featuredUnit;
  }

  return path.units.find((unit) => unit.slug === progressSummary.nextUnitSlug) ?? path.featuredUnit;
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
  options: SessionAccessOptions = {},
): Promise<StudioLesson | undefined> {
  const bootstrap = await fetchLearningApi<ApiStudioBootstrapResponse>(
    `/studio/me/${unitSlug}`,
    {
      allowNotFound: true,
      allowUnauthorized: true,
      bootstrapGuestSession: true,
      ...options,
    },
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

export async function getStudioSessionAccessToken() {
  return resolveSessionAccessToken(true);
}

export async function getCurrentLearnerSummary(
  options: SessionAccessOptions = {},
): Promise<LearnerSummary | null> {
  const resolvedAccessToken =
    options.accessToken ?? await resolveSessionAccessToken(options.bootstrapGuestSession);
  if (!resolvedAccessToken) {
    return null;
  }

  try {
    const profileResponse = await requestLearningApi("/auth/me", {
      ...options,
      accessToken: resolvedAccessToken,
    });
    if (profileResponse.status === 401) {
      return null;
    }
    if (!profileResponse.ok) {
      return null;
    }

    const pulseResponse = await requestLearningApi("/progress/me", {
      ...options,
      accessToken: resolvedAccessToken,
    });
    if (pulseResponse.status === 401) {
      return null;
    }
    if (!pulseResponse.ok) {
      return null;
    }

    const profile = (await profileResponse.json()) as ApiCurrentUserProfile;
    const pulse = (await pulseResponse.json()) as ApiLearningPulse;

    return {
      userId: profile.user_id,
      name: profile.name,
      email: profile.email,
      plan: profile.plan,
      completedUnitCount: pulse.completed_units.length,
      streakDays: pulse.streak_days,
      recentActivity: pulse.recent_activity,
    };
  } catch {
    return null;
  }
}

export async function getCurrentLearnerOverview(
  paths: LessonPath[],
  options: SessionAccessOptions = {},
): Promise<LearnerOverview | null> {
  const resolvedAccessToken =
    options.accessToken ?? await resolveSessionAccessToken(options.bootstrapGuestSession);
  if (!resolvedAccessToken) {
    return null;
  }

  try {
    const [profileResponse, pulseResponse, progressRecordsResponse] = await Promise.all([
      requestLearningApi("/auth/me", {
        ...options,
        accessToken: resolvedAccessToken,
      }),
      requestLearningApi("/progress/me", {
        ...options,
        accessToken: resolvedAccessToken,
      }),
      requestLearningApi("/progress/me/records", {
        ...options,
        accessToken: resolvedAccessToken,
      }).catch(() => null),
    ]);

    if (
      profileResponse.status === 401 ||
      pulseResponse.status === 401
    ) {
      return null;
    }

    if (!profileResponse.ok || !pulseResponse.ok) {
      return null;
    }

    const [profile, pulse] = await Promise.all([
      profileResponse.json() as Promise<ApiCurrentUserProfile>,
      pulseResponse.json() as Promise<ApiLearningPulse>,
    ]);
    const progressRecords = progressRecordsResponse?.ok
      ? ((await progressRecordsResponse.json()) as ApiProgressRecord[])
      : [];

    return {
      summary: {
        userId: profile.user_id,
        name: profile.name,
        email: profile.email,
        plan: profile.plan,
        completedUnitCount: pulse.completed_units.length,
        streakDays: pulse.streak_days,
        recentActivity: pulse.recent_activity,
      },
      progressSnapshot: buildLearnerProgressSnapshot(paths, pulse, progressRecords),
    };
  } catch {
    return null;
  }
}
