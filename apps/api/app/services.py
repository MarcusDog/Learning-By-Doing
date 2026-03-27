from __future__ import annotations

from collections import Counter
from collections.abc import Iterable
import json
import secrets
import time
from uuid import uuid4

from pydantic import ValidationError

from .schemas import (
    AdminContentOpsState,
    AdminConfigBundle,
    AdminDraftUnit,
    AdminDashboardMetrics,
    AdminPublishingCheck,
    AdminPublishingCheckUpdate,
    AdminPromptTemplate,
    AdminPromptTemplateUpdate,
    AdminUnitCreateRequest,
    AdminUnitInventoryItem,
    AdminUnitReviewState,
    AdminUnitReviewUpdate,
    LearningPathSummary,
    LearningPulse,
    LearnerState,
    LearningUnit,
    PracticeTask,
    ProgressRecord,
    UserProfile,
    VisualizationFrame,
    VisualizationSpec,
    AdminUnitContentStatus,
)
from .settings import get_admin_content_state_path, get_learner_state_path

SESSION_COOKIE_NAME = "learning_session"
TRANSIENT_SESSION_TTL_SECONDS = 60 * 60
MAX_TRANSIENT_GUEST_SESSIONS = 256

LEARNING_PATHS: list[LearningPathSummary] = [
    LearningPathSummary(
        id="python-foundations",
        title="Python 入门",
        description="从变量、表达式、函数到基础练习的零基础路径。",
        featured_unit_slugs=["python-variables", "python-functions-intro"],
    ),
    LearningPathSummary(
        id="ai-basics",
        title="AI 基础",
        description="理解提示词、模型输入输出和 AI 工具的基本用法。",
        featured_unit_slugs=["ai-prompt-basics", "ai-answer-checking"],
    ),
    LearningPathSummary(
        id="algorithm-visualization",
        title="算法可视化",
        description="通过状态变化看懂排序、递归和图搜索。",
        featured_unit_slugs=["bubble-sort-intuition", "linear-search-intuition"],
    ),
]

SAMPLE_UNITS: list[LearningUnit] = [
    LearningUnit(
        slug="python-variables",
        title="第一段 Python",
        audience_level="beginner_first",
        learning_goal="理解变量、表达式和输出是如何连起来工作的。",
        prerequisites=[],
        concept_explanation="变量像贴了标签的盒子，表达式会生成新值，print 会把最终结果展示给你看。",
        example_code="value = 2\nresult = value + 3\nprint(result)\n",
        visualization_spec=VisualizationSpec(
            kind="variable-state",
            frames=[
                VisualizationFrame(
                    step=1,
                    line_number=1,
                    focus="value 被赋值",
                    variables={"value": "2"},
                ),
                VisualizationFrame(
                    step=2,
                    line_number=2,
                    focus="result 接住了 value + 3 的结果",
                    variables={"value": "2", "result": "5"},
                ),
            ],
        ),
        practice_tasks=[
            PracticeTask(
                id="guided-rename",
                title="改一个变量名",
                kind="guided",
                prompt="把 value 改成 count，再运行一次。",
                expected_outcome="程序仍然输出 5。",
                hints=["赋值和使用位置都要一起改。"],
            ),
            PracticeTask(
                id="transfer-change-number",
                title="自己改一个数字",
                kind="transfer",
                prompt="把 + 3 改成 + 10，并预测输出结果。",
                expected_outcome="你能在运行前说出会输出 12。",
                hints=["先看 value 现在是多少。"],
            ),
        ],
        ai_explanation_context="Use beginner-friendly language. Map value and result directly back to the code lines.",
        acceptance_criteria=[
            "Learner can explain what a variable stores.",
            "Learner can predict output before running the code.",
        ],
    ),
    LearningUnit(
        slug="python-functions-intro",
        title="第一个函数",
        audience_level="beginner_first",
        learning_goal="理解函数如何把一段重复动作打包起来，并学会调用它。",
        prerequisites=["变量"],
        concept_explanation="函数像一个可重复使用的小工具。`def` 用来定义它，参数是传进去的值，调用就是把这个小工具真正运行起来。",
        example_code='def greet(name):\n    print("你好，" + name)\n\ngreet("小明")\ngreet("小红")\n',
        visualization_spec=VisualizationSpec(
            kind="call-stack",
            frames=[
                VisualizationFrame(
                    step=1,
                    line_number=1,
                    focus="定义 greet，函数先被保存下来",
                    variables={"greet": "<function greet(name)>"},
                ),
                VisualizationFrame(
                    step=2,
                    line_number=4,
                    focus='第一次调用 greet("小明")，name 接住了传入的名字',
                    variables={"name": "小明"},
                ),
                VisualizationFrame(
                    step=3,
                    line_number=2,
                    focus="函数体执行 print，把问候语拼出来",
                    variables={"name": "小明"},
                ),
                VisualizationFrame(
                    step=4,
                    line_number=5,
                    focus="第二次调用换成另一个名字",
                    variables={"name": "小红"},
                ),
            ],
        ),
        practice_tasks=[
            PracticeTask(
                id="guided-rename-function",
                title="改一个函数名",
                kind="guided",
                prompt="把 greet 改成 say_hi，并把两次调用一起改掉。",
                expected_outcome="函数换名后程序仍然能运行，并输出两次问候。",
                hints=["定义处和调用处要一起改。"],
            ),
            PracticeTask(
                id="transfer-add-another-call",
                title="再调用一次",
                kind="transfer",
                prompt="再加一次调用，传入你自己的名字。",
                expected_outcome="你能预测程序会多输出一行问候。",
                hints=["每调用一次，函数体就会再执行一次。"],
            ),
        ],
        ai_explanation_context='Explain `def greet(name)` as defining a reusable action, `name` as the parameter, and `greet("小明")` as a call. Keep the answer beginner-friendly and map each code line to what happens at runtime.',
        acceptance_criteria=[
            "Learner can explain what a function is and why it is reusable.",
            "Learner can tell definition from call and predict the output after changing an argument.",
        ],
    ),
    LearningUnit(
        slug="ai-prompt-basics",
        title="提示词第一步",
        audience_level="beginner_first",
        learning_goal="理解提示词如何影响模型输出，并学会把模糊需求改写成清晰请求。",
        prerequisites=[],
        concept_explanation="提示词像给 AI 的任务说明书。说清楚目标、格式和边界，模型更容易给出你想要的结果。",
        example_code='task = "请用三句话解释什么是变量，并举一个生活里的例子。"\nprint(task)\n',
        visualization_spec=VisualizationSpec(
            kind="control-flow",
            frames=[
                VisualizationFrame(
                    step=1,
                    line_number=1,
                    focus="task 保存了你准备发给 AI 的指令",
                    variables={
                        "task": "请用三句话解释什么是变量，并举一个生活里的例子。",
                    },
                ),
                VisualizationFrame(
                    step=2,
                    line_number=2,
                    focus="print 把当前提示词展示出来，方便你检查是否足够清楚",
                    variables={
                        "task": "请用三句话解释什么是变量，并举一个生活里的例子。",
                    },
                ),
            ],
        ),
        practice_tasks=[
            PracticeTask(
                id="guided-add-format",
                title="补上输出格式",
                kind="guided",
                prompt="在提示词里补一句“请用项目符号回答”。",
                expected_outcome="你会看到格式要求会改变回答结构。",
                hints=["想想你希望 AI 用什么排版返回结果。"],
            ),
            PracticeTask(
                id="transfer-make-it-clear",
                title="把模糊问题改清楚",
                kind="transfer",
                prompt="把“讲讲 Python”改成一个更容易回答的提示词。",
                expected_outcome="新的提示词至少要包含目标、范围和输出形式。",
                hints=["试着限制长度、主题或读者对象。"],
            ),
        ],
        ai_explanation_context="Explain prompts as instructions with goals, constraints, and output format. Tie each improvement back to the text of the prompt.",
        acceptance_criteria=[
            "Learner can explain why vague prompts lead to vague answers.",
            "Learner can add one concrete constraint to improve a prompt.",
        ],
    ),
    LearningUnit(
        slug="ai-answer-checking",
        title="AI 回答先检查",
        audience_level="beginner_first",
        learning_goal="理解 AI 的输入、输出和简单核对方法。",
        prerequisites=["提示词"],
        concept_explanation="AI 会先读你的问题，再给出回答。但回答看起来顺，不代表一定完全正确。先分清输入和输出，再用一个小清单检查它有没有答题、有没有跑题。",
        example_code=(
            'question = "请用一句话解释什么是变量。"\n'
            'answer = "变量像贴标签的盒子。"\n\n'
            'print("问题:", question)\n'
            'print("回答:", answer)\n'
            'print("检查1: 有没有回答问题？")\n'
            'print("检查2: 有没有跑题？")\n'
        ),
        visualization_spec=VisualizationSpec(
            kind="control-flow",
            frames=[
                VisualizationFrame(
                    step=1,
                    line_number=1,
                    focus="先保存 AI 要回答的问题",
                    variables={"question": "请用一句话解释什么是变量。"},
                ),
                VisualizationFrame(
                    step=2,
                    line_number=2,
                    focus="把 AI 的回答和问题分开看",
                    variables={
                        "question": "请用一句话解释什么是变量。",
                        "answer": "变量像贴标签的盒子。",
                    },
                ),
                VisualizationFrame(
                    step=3,
                    line_number=6,
                    focus="开始逐条核对回答",
                    variables={"check1": "有没有回答问题？", "check2": "有没有跑题？"},
                ),
            ],
        ),
        practice_tasks=[
            PracticeTask(
                id="guided-add-check",
                title="再加一条检查",
                kind="guided",
                prompt='在现有两条检查后面，再补一句“有没有用太难的词？”。',
                expected_outcome="你会看到检查清单可以一条一条增加。",
                hints=["检查句子可以像清单一样排下去。"],
            ),
            PracticeTask(
                id="transfer-change-question",
                title="换一个问题",
                kind="transfer",
                prompt='把问题改成“请用一句话解释 print 是什么”，再预测回答应该重点讲什么。',
                expected_outcome="你能把输入和输出对应起来，而不是只背原来的例子。",
                hints=["新的问题会决定新的回答重点。"],
            ),
        ],
        ai_explanation_context="Explain that AI input is the question and output is the answer. Focus on the habit of checking whether the answer actually addresses the question, stays on topic, and needs fact-checking. Do not overcomplicate with model internals.",
        acceptance_criteria=[
            "Learner can explain input vs output and name one check.",
            "Learner can predict how changing the question changes the answer focus.",
        ],
    ),
    LearningUnit(
        slug="bubble-sort-intuition",
        title="冒泡排序直觉",
        audience_level="beginner_first",
        learning_goal="看懂排序过程中的比较、交换与状态变化。",
        prerequisites=["列表"],
        concept_explanation="相邻元素逐个比较，把更大的值慢慢推到后面。",
        example_code=(
            "nums = [3, 2, 1]\n"
            "for i in range(len(nums)):\n"
            "    for j in range(len(nums) - i - 1):\n"
            "        if nums[j] > nums[j + 1]:\n"
            "            nums[j], nums[j + 1] = nums[j + 1], nums[j]\n"
            "print(nums)\n"
        ),
        visualization_spec=VisualizationSpec(
            kind="algorithm-flow",
            frames=[
                VisualizationFrame(
                    step=1,
                    line_number=4,
                    focus="比较 nums[0] 和 nums[1]",
                    variables={"nums": "[3, 2, 1]"},
                ),
                VisualizationFrame(
                    step=2,
                    line_number=5,
                    focus="发生交换",
                    variables={"nums": "[2, 3, 1]"},
                ),
            ],
        ),
        practice_tasks=[
            PracticeTask(
                id="guided-longer-list",
                title="试试更长的列表",
                kind="guided",
                prompt="把 nums 改成 5 个数字，再观察交换过程。",
                expected_outcome="你会看到更长的列表需要更多轮比较。",
                hints=["列表长度增加，比较次数也会增加。"],
            ),
            PracticeTask(
                id="transfer-predict-first-round",
                title="预测第一轮结果",
                kind="transfer",
                prompt="在运行前写下第一轮结束后的列表状态。",
                expected_outcome="你能解释为什么最大的值会先冒到最后。",
                hints=["只关注第一轮完整结束时的列表。"],
            ),
        ],
        ai_explanation_context="Explain bubble sort as repeated neighbour comparisons and map each swap back to the code loop.",
        acceptance_criteria=[
            "Learner can explain what one outer loop round does.",
            "Learner can identify when a swap happens.",
        ],
    ),
    LearningUnit(
        slug="linear-search-intuition",
        title="顺序查找直觉",
        audience_level="beginner_first",
        learning_goal="理解顺序查找如何一个一个检查列表，直到找到目标或走完整个列表。",
        prerequisites=["列表"],
        concept_explanation="顺序查找就是从左到右挨个看。`found` 像一个开关，开始时是 False，找到目标后变成 True。",
        example_code=(
            "nums = [4, 7, 2, 9]\n"
            "target = 2\n"
            "found = False\n\n"
            "for num in nums:\n"
            "    if num == target:\n"
            "        found = True\n"
            "        break\n\n"
            "print(found)\n"
        ),
        visualization_spec=VisualizationSpec(
            kind="algorithm-flow",
            frames=[
                VisualizationFrame(
                    step=1,
                    line_number=5,
                    focus="开始检查列表里的数字",
                    variables={"nums": "[4, 7, 2, 9]", "target": "2", "found": "False", "num": "4"},
                ),
                VisualizationFrame(
                    step=2,
                    line_number=6,
                    focus="前两个数字都不是目标，found 还是 False",
                    variables={"num": "7", "found": "False"},
                ),
                VisualizationFrame(
                    step=3,
                    line_number=7,
                    focus="找到 2 以后，found 变成 True",
                    variables={"num": "2", "found": "True"},
                ),
                VisualizationFrame(
                    step=4,
                    line_number=8,
                    focus="break 让循环停下来",
                    variables={"found": "True"},
                ),
            ],
        ),
        practice_tasks=[
            PracticeTask(
                id="guided-change-target",
                title="换一个目标",
                kind="guided",
                prompt="把 target 改成 9，先预测什么时候会找到它。",
                expected_outcome="你能说出搜索会在列表最后才结束。",
                hints=["目标在列表越靠后，循环走得越久。"],
            ),
            PracticeTask(
                id="transfer-try-missing-number",
                title="试试找不到的数字",
                kind="transfer",
                prompt="把 target 改成 5，再预测最终会输出什么。",
                expected_outcome="你能解释为什么找不到时 found 仍然是 False。",
                hints=["如果列表里没有这个数字，循环会把所有元素都看一遍。"],
            ),
        ],
        ai_explanation_context="Explain sequential search as checking items one by one and mapping `found`, the loop, and `break` to the visible state change. Keep the explanation simple and tied to the code.",
        acceptance_criteria=[
            "Learner can explain one-by-one scanning and the `found` flag.",
            "Learner can predict the output when the target is present or absent.",
        ],
    ),
]

INITIAL_ADMIN_UNIT_CONTENT_STATUSES: dict[str, AdminUnitContentStatus] = {
    "python-variables": "published",
    "python-functions-intro": "review",
    "ai-prompt-basics": "draft",
    "ai-answer-checking": "draft",
    "bubble-sort-intuition": "published",
    "linear-search-intuition": "review",
}


def _build_admin_prompt_templates() -> list[AdminPromptTemplate]:
    return [
        AdminPromptTemplate(
            id="unit-intro",
            title="单元导语模板",
            scope="content_pipeline",
            status="placeholder",
            description="为每个学习单元生成一句清晰的学习导语。",
            applies_to_unit_slugs=[
                "python-variables",
                "python-functions-intro",
                "ai-prompt-basics",
                "ai-answer-checking",
                "bubble-sort-intuition",
                "linear-search-intuition",
            ],
        ),
        AdminPromptTemplate(
            id="practice-coach",
            title="练习陪练模板",
            scope="practice_feedback",
            status="placeholder",
            description="为练习题生成鼓励、纠错和下一步提示。",
            applies_to_unit_slugs=[
                "python-variables",
                "python-functions-intro",
                "ai-prompt-basics",
                "ai-answer-checking",
                "bubble-sort-intuition",
                "linear-search-intuition",
            ],
        ),
        AdminPromptTemplate(
            id="visualization-narration",
            title="可视化讲解模板",
            scope="visualization",
            status="placeholder",
            description="把状态变化翻成适合屏幕展示的简短说明。",
            applies_to_unit_slugs=[
                "python-variables",
                "python-functions-intro",
                "ai-prompt-basics",
                "ai-answer-checking",
                "bubble-sort-intuition",
                "linear-search-intuition",
            ],
        ),
        AdminPromptTemplate(
            id="publishing-summary",
            title="发布摘要模板",
            scope="publishing",
            status="placeholder",
            description="给审核者和内容编辑展示发布前摘要。",
            applies_to_unit_slugs=[
                "python-variables",
                "python-functions-intro",
                "ai-prompt-basics",
                "ai-answer-checking",
                "bubble-sort-intuition",
                "linear-search-intuition",
            ],
        ),
    ]


def _build_admin_publishing_checks() -> list[AdminPublishingCheck]:
    return [
        AdminPublishingCheck(
            key="content-completeness",
            label="内容完整性",
            description="确认学习目标、示例、练习与验收标准都已填好。",
            required=True,
            enabled=True,
        ),
        AdminPublishingCheck(
            key="visualization-match",
            label="可视化一致性",
            description="确认可视化步骤和示例代码的执行结果一致。",
            required=True,
            enabled=True,
        ),
        AdminPublishingCheck(
            key="ai-tone",
            label="AI 语气检查",
            description="确认 AI 文案保持清晰、鼓励式、面向初学者。",
            required=True,
            enabled=True,
        ),
        AdminPublishingCheck(
            key="seed-sync",
            label="种子数据同步",
            description="确认内容变更和演示种子保持同步。",
            required=False,
            enabled=True,
        ),
    ]


def _build_initial_admin_content_state() -> AdminContentOpsState:
    return AdminContentOpsState(
        unit_content_statuses=dict(INITIAL_ADMIN_UNIT_CONTENT_STATUSES),
        prompt_templates=_build_admin_prompt_templates(),
        publishing_checks=_build_admin_publishing_checks(),
        custom_units=[],
        unit_reviews={},
    )


def _snapshot_admin_content_state() -> AdminContentOpsState:
    return AdminContentOpsState(
        unit_content_statuses=dict(ADMIN_UNIT_CONTENT_STATUSES),
        prompt_templates=[template.model_copy(deep=True) for template in ADMIN_PROMPT_TEMPLATES],
        publishing_checks=[check.model_copy(deep=True) for check in ADMIN_PUBLISHING_CHECKS],
        custom_units=[unit.model_copy(deep=True) for unit in ADMIN_CUSTOM_UNITS],
        unit_reviews={
            slug: review.model_copy(deep=True) for slug, review in sorted(ADMIN_UNIT_REVIEWS.items())
        },
    )


def _apply_admin_content_state(state: AdminContentOpsState) -> None:
    global ADMIN_UNIT_CONTENT_STATUSES
    global ADMIN_PROMPT_TEMPLATES
    global ADMIN_PUBLISHING_CHECKS
    global ADMIN_CUSTOM_UNITS
    global ADMIN_UNIT_REVIEWS

    ADMIN_UNIT_CONTENT_STATUSES = dict(state.unit_content_statuses)
    ADMIN_PROMPT_TEMPLATES = [template.model_copy(deep=True) for template in state.prompt_templates]
    ADMIN_PUBLISHING_CHECKS = [check.model_copy(deep=True) for check in state.publishing_checks]
    ADMIN_CUSTOM_UNITS = [unit.model_copy(deep=True) for unit in state.custom_units]
    ADMIN_UNIT_REVIEWS = {
        slug: review.model_copy(deep=True) for slug, review in state.unit_reviews.items()
    }


def _persist_admin_content_state() -> None:
    state_path = get_admin_content_state_path()
    state_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = state_path.parent / f".{state_path.name}.tmp"
    temporary_path.write_text(
        json.dumps(_snapshot_admin_content_state().model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temporary_path.replace(state_path)


def reload_admin_content_state() -> None:
    state_path = get_admin_content_state_path()
    if not state_path.exists():
        _apply_admin_content_state(_build_initial_admin_content_state())
        return

    try:
        payload = json.loads(state_path.read_text(encoding="utf-8"))
        persisted_state = AdminContentOpsState.model_validate(payload)
    except (OSError, json.JSONDecodeError, ValidationError):
        _apply_admin_content_state(_build_initial_admin_content_state())
        return

    _apply_admin_content_state(persisted_state)


ADMIN_UNIT_CONTENT_STATUSES: dict[str, AdminUnitContentStatus]
ADMIN_PROMPT_TEMPLATES: list[AdminPromptTemplate]
ADMIN_PUBLISHING_CHECKS: list[AdminPublishingCheck]
ADMIN_CUSTOM_UNITS: list[AdminDraftUnit]
ADMIN_UNIT_REVIEWS: dict[str, AdminUnitReviewState]
reload_admin_content_state()

INITIAL_DEMO_PROGRESS_RECORDS: list[ProgressRecord] = [
    ProgressRecord(
        user_id="demo-user",
        unit_id="python-variables",
        status="in_progress",
        completed_step_ids=["read-example", "run-example"],
        code_draft="value = 2\nresult = value + 10\nprint(result)\n",
        notes="已经能看懂变量，但还想多练一次预测输出。",
    ),
    ProgressRecord(
        user_id="demo-user",
        unit_id="ai-prompt-basics",
        status="in_progress",
        completed_step_ids=["spot-vague-prompt"],
        code_draft='task = "请用项目符号解释变量，并给一个点奶茶的例子。"\nprint(task)\n',
        notes="正在练习把问题说得更具体。",
    ),
    ProgressRecord(
        user_id="demo-user",
        unit_id="bubble-sort-intuition",
        status="completed",
        completed_step_ids=["trace-swap", "predict-round-one", "change-input"],
        code_draft=(
            "nums = [5, 1, 4, 2]\n"
            "for i in range(len(nums)):\n"
            "    for j in range(len(nums) - i - 1):\n"
            "        if nums[j] > nums[j + 1]:\n"
            "            nums[j], nums[j + 1] = nums[j + 1], nums[j]\n"
            "print(nums)\n"
        ),
        notes="已经能解释为什么最大值会先被推到最后。",
    ),
]

INITIAL_USER_STORE: dict[str, UserProfile] = {
    "learner@example.com": UserProfile(
        user_id="demo-user",
        name="学习者",
        email="learner@example.com",
        plan="free",
    )
}


def _build_initial_learner_state() -> LearnerState:
    return LearnerState(
        users={email: profile.model_copy(deep=True) for email, profile in INITIAL_USER_STORE.items()},
        progress_records=[record.model_copy(deep=True) for record in INITIAL_DEMO_PROGRESS_RECORDS],
        session_tokens={},
    )


def _snapshot_learner_state() -> LearnerState:
    return LearnerState(
        users={
            email: profile.model_copy(deep=True)
            for email, profile in sorted(USER_STORE.items(), key=lambda item: item[0])
        },
        progress_records=[
            record.model_copy(deep=True)
            for _, record in sorted(PROGRESS_STORE.items(), key=lambda item: item[0])
        ],
        session_tokens=dict(sorted(SESSION_STORE.items())),
    )


def _apply_learner_state(state: LearnerState) -> None:
    global USER_STORE
    global PROGRESS_STORE
    global SESSION_STORE
    global TRANSIENT_USER_STORE
    global TRANSIENT_SESSION_STORE

    USER_STORE = {
        email: profile.model_copy(deep=True)
        for email, profile in state.users.items()
    }
    PROGRESS_STORE = {
        (record.user_id, record.unit_id): record.model_copy(deep=True)
        for record in state.progress_records
    }
    SESSION_STORE = dict(state.session_tokens)
    TRANSIENT_USER_STORE = {}
    TRANSIENT_SESSION_STORE = {}


def _persist_learner_state() -> None:
    state_path = get_learner_state_path()
    state_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = state_path.parent / f".{state_path.name}.tmp"
    temporary_path.write_text(
        json.dumps(_snapshot_learner_state().model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temporary_path.replace(state_path)


def reload_learner_state() -> None:
    state_path = get_learner_state_path()
    if not state_path.exists():
        _apply_learner_state(_build_initial_learner_state())
        return

    try:
        payload = json.loads(state_path.read_text(encoding="utf-8"))
        persisted_state = LearnerState.model_validate(payload)
    except (OSError, json.JSONDecodeError, ValidationError):
        _apply_learner_state(_build_initial_learner_state())
        return

    _apply_learner_state(persisted_state)


PROGRESS_STORE: dict[tuple[str, str], ProgressRecord]
USER_STORE: dict[str, UserProfile]
SESSION_STORE: dict[str, str]
TRANSIENT_USER_STORE: dict[str, UserProfile]
TRANSIENT_SESSION_STORE: dict[str, tuple[str, float]]
reload_learner_state()


def list_learning_units() -> list[LearningUnit]:
    return SAMPLE_UNITS


def get_learning_unit(slug: str) -> LearningUnit | None:
    for unit in SAMPLE_UNITS:
        if unit.slug == slug:
            return unit
    return None


def list_learning_paths() -> list[LearningPathSummary]:
    return LEARNING_PATHS


def get_primary_learning_path_for_unit(slug: str) -> LearningPathSummary | None:
    paths = _get_paths_for_unit(slug)
    return paths[0] if paths else None


def _get_learning_path_by_id(path_id: str) -> LearningPathSummary | None:
    for path in LEARNING_PATHS:
        if path.id == path_id:
            return path
    return None


def _find_custom_admin_unit(slug: str) -> AdminDraftUnit | None:
    for unit in ADMIN_CUSTOM_UNITS:
        if unit.slug == slug:
            return unit
    return None


def _get_admin_unit_review_state(slug: str) -> AdminUnitReviewState:
    return ADMIN_UNIT_REVIEWS.get(slug, AdminUnitReviewState())


def _get_publish_blockers(slug: str, content_status: AdminUnitContentStatus) -> list[str]:
    blockers: list[str] = []

    if content_status == "archived":
        blockers.append("已归档单元不能直接发布。")
        return blockers

    if content_status == "draft":
        blockers.append("先送审，再发布。")

    review_state = _get_admin_unit_review_state(slug)
    reviewed_check_keys = set(review_state.reviewed_check_keys)
    for check in ADMIN_PUBLISHING_CHECKS:
        if not check.enabled or not check.required:
            continue
        if check.key not in reviewed_check_keys:
            blockers.append(f"完成检查：{check.label}")

    has_ready_prompt = any(
        template.status == "ready" and slug in template.applies_to_unit_slugs
        for template in ADMIN_PROMPT_TEMPLATES
    )
    if not has_ready_prompt:
        blockers.append("至少关联一个已就绪的提示词模板。")

    return blockers


def get_admin_dashboard_metrics() -> AdminDashboardMetrics:
    status_counts = Counter(ADMIN_UNIT_CONTENT_STATUSES.values())
    return AdminDashboardMetrics(
        published_units=status_counts.get("published", 0),
        draft_units=status_counts.get("draft", 0),
        pending_reviews=status_counts.get("review", 0),
        ai_prompt_sets=len(ADMIN_PROMPT_TEMPLATES),
        total_paths=len(LEARNING_PATHS),
        total_practice_tasks=sum(len(unit.practice_tasks) for unit in SAMPLE_UNITS),
        total_acceptance_criteria=sum(len(unit.acceptance_criteria) for unit in SAMPLE_UNITS),
    )


def _build_admin_unit_inventory_item(unit: LearningUnit) -> AdminUnitInventoryItem:
    paths = _get_paths_for_unit(unit.slug)
    content_status = ADMIN_UNIT_CONTENT_STATUSES.get(unit.slug, "draft")
    review_state = _get_admin_unit_review_state(unit.slug)
    publish_blockers = _get_publish_blockers(unit.slug, content_status)
    return AdminUnitInventoryItem(
        slug=unit.slug,
        title=unit.title,
        audience_level=unit.audience_level,
        learning_goal=unit.learning_goal,
        origin="seeded",
        content_status=content_status,
        path_ids=[path.id for path in paths],
        path_titles=[path.title for path in paths],
        prerequisite_count=len(unit.prerequisites),
        practice_task_count=len(unit.practice_tasks),
        acceptance_criteria_count=len(unit.acceptance_criteria),
        visualization_kind=unit.visualization_spec.kind,
        ready_to_publish=len(publish_blockers) == 0,
        publish_blockers=publish_blockers,
        review_notes=review_state.review_notes or None,
        reviewed_check_keys=list(review_state.reviewed_check_keys),
    )


def _get_paths_for_unit(slug: str) -> list[LearningPathSummary]:
    path_index: dict[str, list[LearningPathSummary]] = {}
    for path in LEARNING_PATHS:
        for featured_slug in path.featured_unit_slugs:
            path_index.setdefault(featured_slug, []).append(path)
    return path_index.get(slug, [])


def _build_admin_custom_unit_inventory_item(unit: AdminDraftUnit) -> AdminUnitInventoryItem:
    path = _get_learning_path_by_id(unit.path_id)
    content_status = ADMIN_UNIT_CONTENT_STATUSES.get(unit.slug, "draft")
    review_state = _get_admin_unit_review_state(unit.slug)
    publish_blockers = _get_publish_blockers(unit.slug, content_status)
    return AdminUnitInventoryItem(
        slug=unit.slug,
        title=unit.title,
        audience_level=unit.audience_level,
        learning_goal=unit.learning_goal,
        origin="custom",
        content_status=content_status,
        path_ids=[unit.path_id],
        path_titles=[path.title] if path is not None else [unit.path_id],
        prerequisite_count=unit.prerequisite_count,
        practice_task_count=unit.practice_task_count,
        acceptance_criteria_count=unit.acceptance_criteria_count,
        visualization_kind=unit.visualization_kind,
        ready_to_publish=len(publish_blockers) == 0,
        publish_blockers=publish_blockers,
        review_notes=review_state.review_notes or None,
        reviewed_check_keys=list(review_state.reviewed_check_keys),
    )


def list_admin_unit_inventory() -> list[AdminUnitInventoryItem]:
    seeded_units = [_build_admin_unit_inventory_item(unit) for unit in SAMPLE_UNITS]
    custom_units = [_build_admin_custom_unit_inventory_item(unit) for unit in ADMIN_CUSTOM_UNITS]
    return seeded_units + custom_units


def get_admin_config_bundle() -> AdminConfigBundle:
    return AdminConfigBundle(
        prompt_templates=ADMIN_PROMPT_TEMPLATES,
        publishing_checks=ADMIN_PUBLISHING_CHECKS,
    )


def reset_admin_content_state(*, remove_persisted: bool = False) -> None:
    _apply_admin_content_state(_build_initial_admin_content_state())
    if remove_persisted:
        state_path = get_admin_content_state_path()
        if state_path.exists():
            state_path.unlink()


def _get_admin_inventory_item_by_slug(slug: str) -> AdminUnitInventoryItem | None:
    seeded_unit = get_learning_unit(slug)
    if seeded_unit is not None:
        return _build_admin_unit_inventory_item(seeded_unit)

    custom_unit = _find_custom_admin_unit(slug)
    if custom_unit is not None:
        return _build_admin_custom_unit_inventory_item(custom_unit)

    return None


def create_admin_unit(payload: AdminUnitCreateRequest) -> AdminUnitInventoryItem | None:
    if get_learning_unit(payload.slug) is not None or _find_custom_admin_unit(payload.slug) is not None:
        return None

    if _get_learning_path_by_id(payload.path_id) is None:
        return None

    ADMIN_CUSTOM_UNITS.append(
        AdminDraftUnit(
            slug=payload.slug,
            title=payload.title,
            path_id=payload.path_id,
            audience_level=payload.audience_level,
            learning_goal=payload.learning_goal,
            visualization_kind=payload.visualization_kind,
        )
    )
    ADMIN_UNIT_CONTENT_STATUSES[payload.slug] = "draft"
    _persist_admin_content_state()
    created_unit = _find_custom_admin_unit(payload.slug)
    return (
        _build_admin_custom_unit_inventory_item(created_unit)
        if created_unit is not None
        else None
    )


def update_admin_unit_status(slug: str, content_status: AdminUnitContentStatus) -> AdminUnitInventoryItem | None:
    if _get_admin_inventory_item_by_slug(slug) is None:
        return None

    ADMIN_UNIT_CONTENT_STATUSES[slug] = content_status
    if content_status in {"draft", "archived"}:
        ADMIN_UNIT_REVIEWS.pop(slug, None)
    _persist_admin_content_state()
    return _get_admin_inventory_item_by_slug(slug)


def update_admin_unit_review(
    slug: str,
    update: AdminUnitReviewUpdate,
) -> AdminUnitInventoryItem | None:
    if _get_admin_inventory_item_by_slug(slug) is None:
        return None

    valid_check_keys = {check.key for check in ADMIN_PUBLISHING_CHECKS}
    ADMIN_UNIT_REVIEWS[slug] = AdminUnitReviewState(
        review_notes=update.review_notes.strip(),
        reviewed_check_keys=[
            key for key in update.reviewed_check_keys if key in valid_check_keys
        ],
    )
    _persist_admin_content_state()
    return _get_admin_inventory_item_by_slug(slug)


def publish_admin_unit(slug: str) -> tuple[AdminUnitInventoryItem | None, list[str]]:
    current_unit = _get_admin_inventory_item_by_slug(slug)
    if current_unit is None:
        return None, []

    blockers = _get_publish_blockers(slug, ADMIN_UNIT_CONTENT_STATUSES.get(slug, "draft"))
    if blockers:
        return None, blockers

    ADMIN_UNIT_CONTENT_STATUSES[slug] = "published"
    _persist_admin_content_state()
    published_unit = _get_admin_inventory_item_by_slug(slug)
    return published_unit, []


def update_admin_prompt_template(
    template_id: str,
    update: AdminPromptTemplateUpdate,
) -> AdminPromptTemplate | None:
    for index, template in enumerate(ADMIN_PROMPT_TEMPLATES):
        if template.id != template_id:
            continue

        updated = template.model_copy(
            update={
                "status": update.status,
                "description": update.description,
                "applies_to_unit_slugs": list(update.applies_to_unit_slugs),
            }
        )
        ADMIN_PROMPT_TEMPLATES[index] = updated
        _persist_admin_content_state()
        return updated
    return None


def update_admin_publishing_check(
    key: str,
    update: AdminPublishingCheckUpdate,
) -> AdminPublishingCheck | None:
    for index, check in enumerate(ADMIN_PUBLISHING_CHECKS):
        if check.key != key:
            continue

        updated = check.model_copy(
            update={
                "enabled": update.enabled,
                "required": update.required,
            }
        )
        ADMIN_PUBLISHING_CHECKS[index] = updated
        _persist_admin_content_state()
        return updated
    return None


def save_progress(record: ProgressRecord) -> ProgressRecord:
    if get_user_by_id(record.user_id) is None:
        _promote_transient_user(record.user_id)
    PROGRESS_STORE[(record.user_id, record.unit_id)] = record
    _persist_learner_state()
    return record


def get_progress(user_id: str, unit_id: str) -> ProgressRecord | None:
    return PROGRESS_STORE.get((user_id, unit_id))


def list_progress_for_user(user_id: str) -> list[ProgressRecord]:
    return [record for (stored_user_id, _), record in PROGRESS_STORE.items() if stored_user_id == user_id]


def get_learning_pulse(user_id: str) -> LearningPulse:
    records = list_progress_for_user(user_id)
    return LearningPulse(
        user_id=user_id,
        completed_units=[record.unit_id for record in records if record.status == "completed"],
        streak_days=3,
        recent_activity=["打开课程", "运行示例", "保存进度"],
    )


def complete_progress(user_id: str, unit_id: str, completed_step_ids: Iterable[str]) -> ProgressRecord:
    if get_user_by_id(user_id) is None:
        _promote_transient_user(user_id)
    record = PROGRESS_STORE.get((user_id, unit_id))
    if record is None:
        record = ProgressRecord(user_id=user_id, unit_id=unit_id)
    updated = record.model_copy(
        update={
            "status": "completed",
            "completed_step_ids": list(completed_step_ids),
        }
    )
    PROGRESS_STORE[(user_id, unit_id)] = updated
    _persist_learner_state()
    return updated


def register_user(email: str, name: str, *, persist: bool = True) -> UserProfile:
    profile = UserProfile(
        user_id=f"user-{uuid4().hex[:8]}",
        name=name,
        email=email,
        plan="free",
    )
    USER_STORE[email] = profile
    if persist:
        _persist_learner_state()
    return profile


def get_user(email: str) -> UserProfile | None:
    return USER_STORE.get(email)


def get_user_by_id(user_id: str) -> UserProfile | None:
    for profile in USER_STORE.values():
        if profile.user_id == user_id:
            return profile
    return None


def _get_transient_user_by_id(user_id: str) -> UserProfile | None:
    return TRANSIENT_USER_STORE.get(user_id)


def _prune_transient_sessions(now: float | None = None) -> None:
    current_time = time.time() if now is None else now
    expired_tokens = [
        token
        for token, (_, expires_at) in TRANSIENT_SESSION_STORE.items()
        if expires_at <= current_time
    ]
    for token in expired_tokens:
        TRANSIENT_SESSION_STORE.pop(token, None)

    active_user_ids = {user_id for user_id, _ in TRANSIENT_SESSION_STORE.values()}
    for user_id in list(TRANSIENT_USER_STORE):
        if user_id not in active_user_ids:
            TRANSIENT_USER_STORE.pop(user_id, None)


def _evict_transient_sessions_if_needed() -> None:
    if len(TRANSIENT_SESSION_STORE) < MAX_TRANSIENT_GUEST_SESSIONS:
        return

    overflow = len(TRANSIENT_SESSION_STORE) - MAX_TRANSIENT_GUEST_SESSIONS + 1
    oldest_tokens = sorted(
        TRANSIENT_SESSION_STORE.items(),
        key=lambda item: item[1][1],
    )[:overflow]
    for token, _ in oldest_tokens:
        TRANSIENT_SESSION_STORE.pop(token, None)

    active_user_ids = {user_id for user_id, _ in TRANSIENT_SESSION_STORE.values()}
    for user_id in list(TRANSIENT_USER_STORE):
        if user_id not in active_user_ids:
            TRANSIENT_USER_STORE.pop(user_id, None)


def _promote_transient_user(user_id: str) -> None:
    transient_profile = _get_transient_user_by_id(user_id)
    if transient_profile is None:
        return

    USER_STORE[transient_profile.email] = transient_profile
    for token, (session_user_id, _) in list(TRANSIENT_SESSION_STORE.items()):
        if session_user_id != user_id:
            continue
        SESSION_STORE[token] = session_user_id
        TRANSIENT_SESSION_STORE.pop(token, None)
    TRANSIENT_USER_STORE.pop(user_id, None)


def issue_access_token(profile: UserProfile, *, persist: bool = True) -> str:
    access_token = secrets.token_urlsafe(32)
    if persist:
        SESSION_STORE[access_token] = profile.user_id
        _persist_learner_state()
        return access_token

    _prune_transient_sessions()
    _evict_transient_sessions_if_needed()
    TRANSIENT_USER_STORE[profile.user_id] = profile
    TRANSIENT_SESSION_STORE[access_token] = (
        profile.user_id,
        time.time() + TRANSIENT_SESSION_TTL_SECONDS,
    )
    return access_token


def resolve_user_from_access_token(access_token: str | None) -> UserProfile | None:
    if access_token is None:
        return None
    user_id = SESSION_STORE.get(access_token)
    if user_id is not None:
        return get_user_by_id(user_id)

    _prune_transient_sessions()
    transient_session = TRANSIENT_SESSION_STORE.get(access_token)
    if transient_session is None:
        return None
    transient_user_id, _ = transient_session
    return _get_transient_user_by_id(transient_user_id)


def resolve_user_from_authorization(authorization: str | None) -> UserProfile | None:
    if authorization is None:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return resolve_user_from_access_token(token)


def create_guest_user() -> UserProfile:
    guest_id = uuid4().hex[:10]
    return UserProfile(
        user_id=f"user-{uuid4().hex[:8]}",
        name="访客学习者",
        email=f"guest-{guest_id}@learning.local",
        plan="free",
    )


def reset_learner_state(*, remove_persisted: bool = False) -> None:
    _apply_learner_state(_build_initial_learner_state())
    if remove_persisted:
        state_path = get_learner_state_path()
        if state_path.exists():
            state_path.unlink()
