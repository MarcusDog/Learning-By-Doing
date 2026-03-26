export const USER_ROLES = ["learner", "editor", "admin"] as const;
export const LEARNING_PATHS = ["python-foundations", "ai-basics", "algorithm-visualization"] as const;
export const AUDIENCE_LEVELS = ["beginner_first", "intermediate", "advanced"] as const;
export const PRACTICE_TASK_KINDS = ["guided", "transfer"] as const;
export const PROGRESS_STATUSES = ["not_started", "in_progress", "completed"] as const;
export const RUN_JOB_STATUSES = ["queued", "running", "completed", "failed", "timed_out"] as const;
export const RUN_EXIT_STATUSES = ["completed", "failed", "timed_out"] as const;
export const ADMIN_UNIT_CONTENT_STATUSES = ["draft", "review", "published", "archived"] as const;
export const ADMIN_PROMPT_TEMPLATE_STATUSES = ["placeholder", "ready"] as const;
export const AI_EXPLANATION_MODES = ["explain", "code-map", "exercise-coach", "paper-tutor"] as const;
export const VISUALIZATION_KINDS = [
  "variable-state",
  "control-flow",
  "call-stack",
  "data-structure",
  "algorithm-flow",
  "tensor-shape",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type LearningPath = (typeof LEARNING_PATHS)[number];
export type AudienceLevel = (typeof AUDIENCE_LEVELS)[number];
export type PracticeTaskKind = (typeof PRACTICE_TASK_KINDS)[number];
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];
export type RunJobStatus = (typeof RUN_JOB_STATUSES)[number];
export type RunExitStatus = (typeof RUN_EXIT_STATUSES)[number];
export type AdminUnitContentStatus = (typeof ADMIN_UNIT_CONTENT_STATUSES)[number];
export type AdminPromptTemplateStatus = (typeof ADMIN_PROMPT_TEMPLATE_STATUSES)[number];
export type ExplanationMode = (typeof AI_EXPLANATION_MODES)[number];
export type VisualizationKind = (typeof VISUALIZATION_KINDS)[number];

export type LessonStep = {
  id: string;
  title: string;
  summary: string;
};

export type Exercise = {
  id: string;
  title: string;
  kind: PracticeTaskKind;
  prompt: string;
  expectedOutcome: string;
  hints: string[];
};

export type VisualizationFrame = {
  step: number;
  lineNumber: number;
  focus: string;
  variables: Record<string, string>;
};

export type VisualizationSpec = {
  kind: VisualizationKind;
  frames: VisualizationFrame[];
};

export type LearningUnit = {
  slug: string;
  title: string;
  audienceLevel: AudienceLevel;
  learningGoal: string;
  prerequisites: string[];
  conceptExplanation: string;
  exampleCode: string;
  visualizationSpec: VisualizationSpec;
  practiceTasks: Exercise[];
  aiExplanationContext: string;
  acceptanceCriteria: string[];
};

export type ProgressRecord = {
  userId: string;
  unitId: string;
  status: ProgressStatus;
  completedStepIds: string[];
  codeDraft?: string | null;
  notes?: string | null;
};

export type RunJob = {
  jobId: string;
  language: "python";
  sourceCode: string;
  entrypoint: string;
  status: RunJobStatus;
};

export type RunTraceFrame = {
  step: number;
  lineNumber: number;
  functionName: string;
  variables: Record<string, string>;
};

export type RunVariableState = {
  step: number;
  lineNumber: number;
  variables: Record<string, string>;
};

export type RunResult = {
  jobId: string;
  stdout: string;
  stderr: string;
  exitStatus: RunExitStatus;
  exitCode: number;
  timedOut: boolean;
  traceFrames: RunTraceFrame[];
  variableStates: RunVariableState[];
  durationMs: number;
};

export type AiExplainRequest = {
  mode: ExplanationMode;
  question: string;
  code?: string;
  selectedText?: string;
  context?: string;
};

export type AiExplainResponse = {
  mode: ExplanationMode;
  explanation: string;
  selectedText?: string | null;
};

export type ApiLearningPathSummary = {
  id: string;
  title: string;
  description: string;
  featured_unit_slugs: string[];
};

export type ApiPracticeTask = {
  id: string;
  title: string;
  kind: PracticeTaskKind;
  prompt: string;
  expected_outcome: string;
  hints: string[];
};

export type ApiVisualizationFrame = {
  step: number;
  line_number: number;
  focus: string;
  variables: Record<string, string>;
};

export type ApiVisualizationSpec = {
  kind: VisualizationKind;
  frames: ApiVisualizationFrame[];
};

export type ApiLearningUnit = {
  slug: string;
  title: string;
  audience_level: AudienceLevel;
  learning_goal: string;
  prerequisites: string[];
  concept_explanation: string;
  example_code: string;
  visualization_spec: ApiVisualizationSpec;
  practice_tasks: ApiPracticeTask[];
  ai_explanation_context: string;
  acceptance_criteria: string[];
};

export type ApiProgressRecord = {
  user_id: string;
  unit_id: string;
  status: ProgressStatus;
  completed_step_ids: string[];
  code_draft: string | null;
  notes: string | null;
};

export type ApiLearningPulse = {
  user_id: string;
  completed_units: string[];
  streak_days: number;
  recent_activity: string[];
};

export type ApiAIDiagnoseRequest = {
  mode: ExplanationMode;
  question: string;
  code?: string | null;
  selected_text?: string | null;
  context?: string | null;
};

export type ApiAIDiagnoseResponse = {
  mode: ExplanationMode;
  explanation: string;
  selected_text: string | null;
};

export type ApiTraceFrame = {
  step: number;
  line_number: number;
  function_name: string;
  variables: Record<string, string>;
};

export type ApiVariableState = {
  step: number;
  line_number: number;
  variables: Record<string, string>;
};

export type ApiRunCodeResponse = {
  job_id: string;
  stdout: string;
  stderr: string;
  exit_status: RunExitStatus;
  exit_code: number;
  timed_out: boolean;
  trace_frames: ApiTraceFrame[];
  variable_states: ApiVariableState[];
  duration_ms: number;
};

export type ApiStudioBootstrapResponse = {
  user_id: string;
  path_id: string;
  path_title: string;
  unit: ApiLearningUnit;
  progress: ApiProgressRecord;
  run_result: ApiRunCodeResponse;
  ai_response: ApiAIDiagnoseResponse;
  learning_pulse: ApiLearningPulse;
};

export type ApiAdminDashboardMetrics = {
  published_units: number;
  draft_units: number;
  pending_reviews: number;
  ai_prompt_sets: number;
  total_paths: number;
  total_practice_tasks: number;
  total_acceptance_criteria: number;
};

export type ApiAdminUnitInventoryItem = {
  slug: string;
  title: string;
  audience_level: AudienceLevel;
  learning_goal: string;
  content_status: AdminUnitContentStatus;
  path_ids: string[];
  path_titles: string[];
  prerequisite_count: number;
  practice_task_count: number;
  acceptance_criteria_count: number;
  visualization_kind: VisualizationKind;
};

export type ApiAdminPromptTemplate = {
  id: string;
  title: string;
  scope: string;
  status: AdminPromptTemplateStatus;
  description: string;
  applies_to_unit_slugs: string[];
};

export type ApiAdminPublishingCheck = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  enabled: boolean;
};

export type ApiAdminConfigBundle = {
  prompt_templates: ApiAdminPromptTemplate[];
  publishing_checks: ApiAdminPublishingCheck[];
};

export type ApiAdminUnitStatusUpdate = {
  content_status: AdminUnitContentStatus;
};

export type ApiAdminPromptTemplateUpdate = {
  status: AdminPromptTemplateStatus;
  description: string;
  applies_to_unit_slugs: string[];
};

export type ApiAdminPublishingCheckUpdate = {
  enabled: boolean;
  required: boolean;
};

export type ApiAdminSeedContentResponse = {
  seeded: number;
  slugs: string[];
};

export type UserProfile = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  learningPath: LearningPath;
};

export type ApiError = {
  code: string;
  message: string;
};
