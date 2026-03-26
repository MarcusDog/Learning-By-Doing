from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

MIN_TIMEOUT_SECONDS = 0.1
MAX_TIMEOUT_SECONDS = 5.0
MAX_SOURCE_CODE_CHARS = 20_000
MAX_STDIN_CHARS = 8_000
ENTRYPOINT_PATTERN = r"^[A-Za-z0-9_.-]+\.py$"

AudienceLevel = Literal["beginner_first", "intermediate", "advanced"]
ProgressStatus = Literal["not_started", "in_progress", "completed"]
ExplanationMode = Literal["explain", "code-map", "exercise-coach", "paper-tutor"]
RunExitStatus = Literal["completed", "failed", "timed_out"]
AdminUnitContentStatus = Literal["draft", "review", "published", "archived"]
AdminPromptTemplateStatus = Literal["placeholder", "ready"]
VisualizationKind = Literal[
    "variable-state",
    "control-flow",
    "call-stack",
    "data-structure",
    "algorithm-flow",
    "tensor-shape",
]


class PracticeTask(BaseModel):
    id: str
    title: str
    kind: Literal["guided", "transfer"]
    prompt: str
    expected_outcome: str
    hints: list[str] = Field(default_factory=list)


class VisualizationFrame(BaseModel):
    step: int
    line_number: int
    focus: str
    variables: dict[str, str] = Field(default_factory=dict)


class VisualizationSpec(BaseModel):
    kind: VisualizationKind
    frames: list[VisualizationFrame] = Field(default_factory=list)


class LearningUnit(BaseModel):
    slug: str
    title: str
    audience_level: AudienceLevel
    learning_goal: str
    prerequisites: list[str] = Field(default_factory=list)
    concept_explanation: str
    example_code: str
    visualization_spec: VisualizationSpec
    practice_tasks: list[PracticeTask] = Field(default_factory=list)
    ai_explanation_context: str
    acceptance_criteria: list[str] = Field(default_factory=list)


class LearningPathSummary(BaseModel):
    id: str
    title: str
    description: str
    featured_unit_slugs: list[str]


class RegisterRequest(BaseModel):
    email: str
    name: str = "学习者"
    password: str = "demo-password"


class LoginRequest(BaseModel):
    email: str
    password: str = "demo-password"


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user_id: str


class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    plan: Literal["free", "pro"] = "free"


class ProgressRecord(BaseModel):
    user_id: str
    unit_id: str
    status: ProgressStatus = "not_started"
    completed_step_ids: list[str] = Field(default_factory=list)
    code_draft: str | None = None
    notes: str | None = None


class LearningPulse(BaseModel):
    user_id: str
    completed_units: list[str] = Field(default_factory=list)
    streak_days: int = 0
    recent_activity: list[str] = Field(default_factory=list)


class AIDiagnoseRequest(BaseModel):
    mode: ExplanationMode = "explain"
    question: str
    code: str | None = None
    selected_text: str | None = None
    context: str | None = None


class AIDiagnoseResponse(BaseModel):
    mode: ExplanationMode
    explanation: str
    selected_text: str | None = None


class RunCodeRequest(BaseModel):
    source_code: str | None = Field(default=None, max_length=MAX_SOURCE_CODE_CHARS)
    code: str | None = Field(default=None, max_length=MAX_SOURCE_CODE_CHARS)
    entrypoint: str = Field(default="main.py", pattern=ENTRYPOINT_PATTERN)
    language: Literal["python"] = "python"
    stdin: str | None = Field(default=None, max_length=MAX_STDIN_CHARS)
    timeout_seconds: float = Field(default=3.0, ge=MIN_TIMEOUT_SECONDS, le=MAX_TIMEOUT_SECONDS)

    @model_validator(mode="after")
    def ensure_source_code(self) -> "RunCodeRequest":
        source_code = self.source_code if self.source_code is not None else self.code
        if source_code is None or not source_code.strip():
            raise ValueError("Either source_code or code must be provided.")
        self.source_code = source_code
        return self


class TraceFrame(BaseModel):
    step: int
    line_number: int
    function_name: str
    variables: dict[str, str] = Field(default_factory=dict)


class VariableState(BaseModel):
    step: int
    line_number: int
    variables: dict[str, str] = Field(default_factory=dict)


class RunCodeResponse(BaseModel):
    job_id: str
    stdout: str
    stderr: str
    exit_status: RunExitStatus
    exit_code: int
    timed_out: bool = False
    trace_frames: list[TraceFrame] = Field(default_factory=list)
    variable_states: list[VariableState] = Field(default_factory=list)
    duration_ms: int = 0


class StudioBootstrapResponse(BaseModel):
    user_id: str
    path_id: str
    path_title: str
    unit: LearningUnit
    progress: ProgressRecord
    run_result: RunCodeResponse
    ai_response: AIDiagnoseResponse
    learning_pulse: LearningPulse


class AdminDashboardMetrics(BaseModel):
    published_units: int
    draft_units: int
    pending_reviews: int
    ai_prompt_sets: int
    total_paths: int
    total_practice_tasks: int
    total_acceptance_criteria: int


class AdminUnitInventoryItem(BaseModel):
    slug: str
    title: str
    audience_level: AudienceLevel
    learning_goal: str
    content_status: AdminUnitContentStatus
    path_ids: list[str] = Field(default_factory=list)
    path_titles: list[str] = Field(default_factory=list)
    prerequisite_count: int
    practice_task_count: int
    acceptance_criteria_count: int
    visualization_kind: VisualizationKind


class AdminPromptTemplate(BaseModel):
    id: str
    title: str
    scope: str
    status: AdminPromptTemplateStatus
    description: str
    applies_to_unit_slugs: list[str] = Field(default_factory=list)


class AdminPublishingCheck(BaseModel):
    key: str
    label: str
    description: str
    required: bool = True
    enabled: bool = True


class AdminConfigBundle(BaseModel):
    prompt_templates: list[AdminPromptTemplate] = Field(default_factory=list)
    publishing_checks: list[AdminPublishingCheck] = Field(default_factory=list)


class AdminUnitStatusUpdate(BaseModel):
    content_status: AdminUnitContentStatus


class AdminPromptTemplateUpdate(BaseModel):
    status: AdminPromptTemplateStatus
    description: str
    applies_to_unit_slugs: list[str] = Field(default_factory=list)


class AdminPublishingCheckUpdate(BaseModel):
    enabled: bool
    required: bool


class AdminSeedContentResponse(BaseModel):
    seeded: int
    slugs: list[str] = Field(default_factory=list)


class AdminContentOpsState(BaseModel):
    unit_content_statuses: dict[str, AdminUnitContentStatus] = Field(default_factory=dict)
    prompt_templates: list[AdminPromptTemplate] = Field(default_factory=list)
    publishing_checks: list[AdminPublishingCheck] = Field(default_factory=list)


class LearnerState(BaseModel):
    users: dict[str, UserProfile] = Field(default_factory=dict)
    progress_records: list[ProgressRecord] = Field(default_factory=list)
