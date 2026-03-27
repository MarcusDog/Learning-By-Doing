import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
  ApiLearningPathSummary,
  ApiLearningUnit,
  ApiStudioBootstrapResponse,
} from "../../../packages/shared-types/src";
import { cookies } from "next/headers";

import {
  getRecommendedPathUnit,
  getCurrentLearnerOverview,
  getCurrentLearnerSummary,
  getLessonPath,
  getLessonUnit,
  getStudioSessionAccessToken,
  getStudioLesson,
  listLessonPaths,
} from "./learning-data";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const API_BASE_URL = "http://learning-api.test";

const unitFixtures: ApiLearningUnit[] = [
  {
    slug: "python-variables",
    title: "第一段 Python",
    audience_level: "beginner_first",
    learning_goal: "理解变量、表达式和输出是如何连起来工作的。",
    prerequisites: [],
    concept_explanation: "变量像贴了标签的盒子。",
    example_code: "value = 2\nresult = value + 3\nprint(result)\n",
    visualization_spec: {
      kind: "variable-state",
      frames: [
        {
          step: 1,
          line_number: 1,
          focus: "value 被赋值",
          variables: { value: "2" },
        },
      ],
    },
    practice_tasks: [
      {
        id: "guided-rename",
        title: "改一个变量名",
        kind: "guided",
        prompt: "把 value 改成 count，再运行一次。",
        expected_outcome: "程序仍然输出 5。",
        hints: ["赋值和使用位置都要一起改。"],
      },
    ],
    ai_explanation_context: "Use beginner-friendly language.",
    acceptance_criteria: ["Learner can explain what a variable stores."],
  },
  {
    slug: "python-functions-intro",
    title: "第一个函数",
    audience_level: "beginner_first",
    learning_goal: "理解函数如何把一段重复动作打包起来，并学会调用它。",
    prerequisites: ["变量"],
    concept_explanation: "函数像一个可重复使用的小工具。定义以后，可以反复调用。",
    example_code:
      'def greet(name):\n    print("你好，" + name)\n\ngreet("小明")\ngreet("小红")\n',
    visualization_spec: {
      kind: "call-stack",
      frames: [
        {
          step: 1,
          line_number: 2,
          focus: "第一次调用 greet 时，name 接住了传入的名字",
          variables: { name: "小明" },
        },
      ],
    },
    practice_tasks: [
      {
        id: "guided-rename-function",
        title: "改一个函数名",
        kind: "guided",
        prompt: "把 greet 改成 say_hi，并把两次调用一起改掉。",
        expected_outcome: "函数换名后程序仍然能运行，并输出两次问候。",
        hints: ["定义处和调用处要一起改。"],
      },
    ],
    ai_explanation_context: "Explain `def` as defining a reusable action and the call as running it.",
    acceptance_criteria: ["Learner can explain the difference between defining and calling a function."],
  },
  {
    slug: "ai-prompt-basics",
    title: "提示词第一步",
    audience_level: "beginner_first",
    learning_goal: "理解提示词如何影响模型输出。",
    prerequisites: [],
    concept_explanation: "提示词像给 AI 的任务说明书。",
    example_code:
      'task = "请用三句话解释什么是变量，并举一个生活里的例子。"\nprint(task)\n',
    visualization_spec: {
      kind: "control-flow",
      frames: [
        {
          step: 1,
          line_number: 1,
          focus: "task 保存了提示词",
          variables: { task: "请用三句话解释什么是变量，并举一个生活里的例子。" },
        },
      ],
    },
    practice_tasks: [
      {
        id: "guided-add-format",
        title: "补上输出格式",
        kind: "guided",
        prompt: "在提示词里补一句“请用项目符号回答”。",
        expected_outcome: "你会看到格式要求会改变回答结构。",
        hints: ["想想你希望 AI 用什么排版返回结果。"],
      },
      {
        id: "transfer-make-it-clear",
        title: "把模糊问题改清楚",
        kind: "transfer",
        prompt: "把“讲讲 Python”改成一个更容易回答的提示词。",
        expected_outcome: "新的提示词至少要包含目标、范围和输出形式。",
        hints: ["试着限制长度、主题或读者对象。"],
      },
    ],
    ai_explanation_context: "Tie each improvement back to the prompt text.",
    acceptance_criteria: ["Learner can explain why vague prompts lead to vague answers."],
  },
  {
    slug: "ai-answer-checking",
    title: "AI 回答先检查",
    audience_level: "beginner_first",
    learning_goal: "理解 AI 的输入、输出和简单核对方法。",
    prerequisites: ["提示词"],
    concept_explanation: "先分清问题和回答，再用一个小清单检查 AI 有没有答题和跑题。",
    example_code:
      'question = "请用一句话解释什么是变量。"\nanswer = "变量像贴标签的盒子。"\n\nprint("问题:", question)\nprint("回答:", answer)\nprint("检查1: 有没有回答问题？")\nprint("检查2: 有没有跑题？")\n',
    visualization_spec: {
      kind: "control-flow",
      frames: [
        {
          step: 1,
          line_number: 1,
          focus: "先保存 AI 要回答的问题",
          variables: { question: "请用一句话解释什么是变量。" },
        },
      ],
    },
    practice_tasks: [
      {
        id: "guided-add-check",
        title: "再加一条检查",
        kind: "guided",
        prompt: "再补一句“有没有用太难的词？”。",
        expected_outcome: "你会看到检查清单可以一条一条增加。",
        hints: ["检查句子可以像清单一样排下去。"],
      },
    ],
    ai_explanation_context: "Explain AI input as the question and output as the answer.",
    acceptance_criteria: ["Learner can explain input vs output and name one check."],
  },
];

const pathFixtures: ApiLearningPathSummary[] = [
  {
    id: "python-foundations",
    title: "Python 入门",
    description: "从变量、表达式到基础练习。",
    featured_unit_slugs: ["python-variables", "python-functions-intro"],
  },
  {
    id: "ai-basics",
    title: "AI 基础",
    description: "理解提示词、模型输入输出和 AI 工具的基本用法。",
    featured_unit_slugs: ["ai-prompt-basics", "ai-answer-checking"],
  },
];

const currentLearnerFixture = {
  user_id: "user-123",
  name: "Session Learner",
  email: "session@example.com",
  plan: "free",
} as const;

const currentPulseFixture = {
  user_id: "user-123",
  completed_units: ["python-variables", "ai-prompt-basics"],
  streak_days: 3,
  recent_activity: ["打开课程", "运行示例", "保存进度"],
} as const;

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
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "session-token" }),
  } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.LEARNING_API_BASE_URL;
});

describe("learning data", () => {
  it("loads lesson paths from the live API and attaches featured units", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/content/paths`]: () => jsonResponse(pathFixtures),
      [`GET ${API_BASE_URL}/content/units`]: () => jsonResponse(unitFixtures),
    });

    const paths = await listLessonPaths();

    expect(paths).toHaveLength(2);
    expect(paths[0]).toMatchObject({
      id: "python-foundations",
      featuredUnitSlugs: ["python-variables", "python-functions-intro"],
      featuredUnit: {
        slug: "python-variables",
        exampleCode: "value = 2\nresult = value + 3\nprint(result)\n",
      },
      units: [
        {
          slug: "python-variables",
        },
        {
          slug: "python-functions-intro",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("loads the full lesson lineup for an individual path", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/content/paths`]: () => jsonResponse(pathFixtures),
      [`GET ${API_BASE_URL}/content/units`]: () => jsonResponse(unitFixtures),
    });

    const path = await getLessonPath("python-foundations");

    expect(path).toMatchObject({
      id: "python-foundations",
      featuredUnitSlugs: ["python-variables", "python-functions-intro"],
      units: [
        {
          slug: "python-variables",
          title: "第一段 Python",
        },
        {
          slug: "python-functions-intro",
          title: "第一个函数",
        },
      ],
    });
  });

  it("loads and normalizes a lesson unit from the API", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/content/units/python-variables`]: () => jsonResponse(unitFixtures[0]),
    });

    const unit = await getLessonUnit("python-variables");

    expect(unit).toMatchObject({
      slug: "python-variables",
      audienceLevel: "beginner_first",
      visualization: {
        frames: [
          {
            step: 1,
            lineNumber: 1,
            focus: "value 被赋值",
          },
        ],
      },
    });
  });

  it("builds the studio lesson from the studio bootstrap endpoint", async () => {
    const studioFixture: ApiStudioBootstrapResponse = {
      user_id: "demo-user",
      path_id: "ai-basics",
      path_title: "AI 基础",
      unit: unitFixtures[2],
      progress: {
        user_id: "demo-user",
        unit_id: "ai-prompt-basics",
        status: "in_progress",
        completed_step_ids: ["spot-vague-prompt"],
        code_draft:
          'task = "请用项目符号解释变量，并给一个点奶茶的例子。"\nprint(task)\n',
        notes: "正在练习把问题说得更具体。",
      },
      run_result: {
        job_id: "run-ai-prompt-basics",
        stdout: "请用项目符号解释变量，并给一个点奶茶的例子。\n",
        stderr: "",
        exit_status: "completed",
        exit_code: 0,
        timed_out: false,
        trace_frames: [
          {
            step: 1,
            line_number: 1,
            function_name: "<module>",
            variables: {
              task: "请用项目符号解释变量，并给一个点奶茶的例子。",
            },
          },
        ],
        variable_states: [
          {
            step: 1,
            line_number: 1,
            variables: {
              task: "请用项目符号解释变量，并给一个点奶茶的例子。",
            },
          },
        ],
        duration_ms: 21,
      },
      ai_response: {
        mode: "explain",
        explanation: "这段提示词已经说清了主题和输出形式。",
        selected_text: 'task = "请用三句话解释什么是变量，并举一个生活里的例子。"',
      },
      learning_pulse: {
        user_id: "demo-user",
        completed_units: ["python-variables"],
        streak_days: 3,
        recent_activity: ["打开课程", "运行示例", "保存进度"],
      },
    };

    installFetchHandlers({
      [`GET ${API_BASE_URL}/studio/me/ai-prompt-basics`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse(studioFixture);
      },
    });

    const lesson = await getStudioLesson("ai-prompt-basics");

    expect(lesson).toBeDefined();

    if (!lesson) {
      throw new Error("Expected studio bootstrap to return a lesson");
    }

    const studioLesson = lesson;

    expect(studioLesson).toMatchObject({
      pathId: "ai-basics",
      pathTitle: "AI 基础",
      progress: {
        status: "in_progress",
        completedStepIds: ["spot-vague-prompt"],
      },
      runResult: {
        exit_status: "completed",
        stdout: "请用项目符号解释变量，并给一个点奶茶的例子。\n",
        trace_frames: [
          {
            function_name: "<module>",
          },
        ],
        variable_states: [
          {
            line_number: 1,
          },
        ],
      },
      aiResponse: {
        mode: "explain",
        explanation: "这段提示词已经说清了主题和输出形式。",
      },
      learningPulse: {
        streakDays: 3,
        recentActivity: ["打开课程", "运行示例", "保存进度"],
      },
    });

    expectTypeOf(studioLesson.runResult).toMatchTypeOf<{
      trace_frames: Array<{
        line_number: number;
        function_name: string;
      }>;
      variable_states: Array<{
        line_number: number;
        variables: Record<string, string>;
      }>;
    }>();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when the API reports that a unit does not exist", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/content/units/does-not-exist`]: () => jsonResponse({ detail: "missing" }, 404),
      [`GET ${API_BASE_URL}/content/paths`]: () => jsonResponse(pathFixtures),
      [`GET ${API_BASE_URL}/content/units`]: () => jsonResponse(unitFixtures),
    });

    await expect(getLessonUnit("does-not-exist")).resolves.toBeUndefined();
    await expect(getLessonPath("does-not-exist")).resolves.toBeUndefined();
  });

  it("loads the current learner summary from auth and progress endpoints", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/auth/me`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse(currentLearnerFixture);
      },
      [`GET ${API_BASE_URL}/progress/me`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse(currentPulseFixture);
      },
    });

    const summary = await getCurrentLearnerSummary();

    expect(summary).toMatchObject({
      userId: "user-123",
      name: "Session Learner",
      email: "session@example.com",
      plan: "free",
      completedUnitCount: 2,
      streakDays: 3,
      recentActivity: ["打开课程", "运行示例", "保存进度"],
    });
  });

  it("builds a cross-route learner progress snapshot from current-user records", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/content/paths`]: () => jsonResponse(pathFixtures),
      [`GET ${API_BASE_URL}/content/units`]: () => jsonResponse(unitFixtures),
      [`GET ${API_BASE_URL}/auth/me`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse(currentLearnerFixture);
      },
      [`GET ${API_BASE_URL}/progress/me`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse(currentPulseFixture);
      },
      [`GET ${API_BASE_URL}/progress/me/records`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse([
          {
            user_id: "user-123",
            unit_id: "python-variables",
            status: "completed",
            completed_step_ids: ["read-example", "run-example"],
            code_draft: null,
            notes: "完成变量入门。",
          },
          {
            user_id: "user-123",
            unit_id: "python-functions-intro",
            status: "in_progress",
            completed_step_ids: ["rename-function"],
            code_draft: null,
            notes: "函数改名练习做到一半。",
          },
        ]);
      },
    });

    const paths = await listLessonPaths();
    const overview = await getCurrentLearnerOverview(paths);

    expect(overview).toMatchObject({
      summary: {
        userId: "user-123",
        completedUnitCount: 2,
      },
      progressSnapshot: {
        totalUnits: 4,
        completedUnits: 2,
        inProgressUnits: 1,
        notStartedUnits: 1,
        completionPercent: 50,
        pathSummaries: [
          {
            pathId: "python-foundations",
            completedUnits: 1,
            inProgressUnits: 1,
            nextUnitSlug: "python-functions-intro",
            units: [
              {
                unitSlug: "python-variables",
                status: "completed",
                completedStepCount: 2,
                totalStepCount: 2,
              },
              {
                unitSlug: "python-functions-intro",
                status: "in_progress",
                completedStepCount: 1,
                totalStepCount: 2,
              },
            ],
          },
          {
            pathId: "ai-basics",
            completedUnits: 1,
            inProgressUnits: 0,
            nextUnitSlug: "ai-answer-checking",
            units: [
              {
                unitSlug: "ai-prompt-basics",
                status: "completed",
                completedStepCount: 3,
                totalStepCount: 3,
              },
              {
                unitSlug: "ai-answer-checking",
                status: "not_started",
                completedStepCount: 0,
                totalStepCount: 2,
              },
            ],
          },
        ],
      },
    });

    if (!overview) {
      throw new Error("Expected learner overview to be available");
    }

    expect(
      getRecommendedPathUnit(paths[0], overview.progressSnapshot.pathSummaries[0]).slug,
    ).toBe("python-functions-intro");
  });

  it("keeps the learner summary visible when progress records fail open", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/content/paths`]: () => jsonResponse(pathFixtures),
      [`GET ${API_BASE_URL}/content/units`]: () => jsonResponse(unitFixtures),
      [`GET ${API_BASE_URL}/auth/me`]: () => jsonResponse(currentLearnerFixture),
      [`GET ${API_BASE_URL}/progress/me`]: () => jsonResponse(currentPulseFixture),
      [`GET ${API_BASE_URL}/progress/me/records`]: () =>
        jsonResponse({ detail: "temporary failure" }, 503),
    });

    const paths = await listLessonPaths();
    const overview = await getCurrentLearnerOverview(paths);

    expect(overview).toMatchObject({
      summary: {
        userId: "user-123",
        email: "session@example.com",
        completedUnitCount: 2,
      },
      progressSnapshot: {
        completedUnits: 2,
        inProgressUnits: 0,
        notStartedUnits: 2,
      },
    });
  });

  it("returns null without calling the API when there is no session cookie", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    await expect(getCurrentLearnerSummary()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the current-user session is no longer valid", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/auth/me`]: () =>
        jsonResponse({ detail: "Authentication required" }, 401),
    });

    await expect(getCurrentLearnerSummary()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails open when the current-user summary endpoints return a server error", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/auth/me`]: () =>
        jsonResponse({ detail: "temporary failure" }, 503),
    });

    await expect(getCurrentLearnerSummary()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails open when loading the current-user summary throws before a response exists", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/auth/me`]: () => {
        throw new Error("socket hang up");
      },
    });

    await expect(getCurrentLearnerSummary()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bootstraps a guest session for the first studio request when no cookie exists yet", async () => {
    const studioFixture: ApiStudioBootstrapResponse = {
      user_id: "guest-user",
      path_id: "ai-basics",
      path_title: "AI 基础",
      unit: unitFixtures[2],
      progress: {
        user_id: "guest-user",
        unit_id: "ai-prompt-basics",
        status: "not_started",
        completed_step_ids: [],
        code_draft: null,
        notes: null,
      },
      run_result: {
        job_id: "run-guest-bootstrap",
        stdout: "",
        stderr: "",
        exit_status: "completed",
        exit_code: 0,
        timed_out: false,
        trace_frames: [],
        variable_states: [],
        duration_ms: 18,
      },
      ai_response: {
        mode: "explain",
        explanation: "欢迎开始第一节课。",
        selected_text: null,
      },
      learning_pulse: {
        user_id: "guest-user",
        completed_units: [],
        streak_days: 0,
        recent_activity: ["创建访客会话"],
      },
    };

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    installFetchHandlers({
      [`POST ${API_BASE_URL}/auth/guest`]: () =>
        jsonResponse({ access_token: "guest-session-token" }),
      [`GET ${API_BASE_URL}/studio/me/ai-prompt-basics`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer guest-session-token");
        return jsonResponse(studioFixture);
      },
    });

    const lesson = await getStudioLesson("ai-prompt-basics");

    expect(lesson).toMatchObject({
      pathId: "ai-basics",
      progress: {
        userId: "guest-user",
        status: "not_started",
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns undefined for studio bootstrap when an existing session token is rejected", async () => {
    installFetchHandlers({
      [`GET ${API_BASE_URL}/studio/me/ai-prompt-basics`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer session-token");
        return jsonResponse({ detail: "Authentication required" }, 401);
      },
    });

    await expect(getStudioLesson("ai-prompt-basics")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses one bootstrapped guest session across studio and learner-summary loading", async () => {
    let guestSessionBootstraps = 0;

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    installFetchHandlers({
      [`POST ${API_BASE_URL}/auth/guest`]: () => {
        guestSessionBootstraps += 1;
        return jsonResponse({ access_token: "guest-session-token" });
      },
      [`GET ${API_BASE_URL}/auth/me`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer guest-session-token");
        return jsonResponse({
          user_id: "guest-user",
          name: "访客学习者",
          email: "guest-123@learning.local",
          plan: "free",
        });
      },
      [`GET ${API_BASE_URL}/progress/me`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer guest-session-token");
        return jsonResponse({
          user_id: "guest-user",
          completed_units: [],
          streak_days: 0,
          recent_activity: ["创建访客会话"],
        });
      },
      [`GET ${API_BASE_URL}/studio/me/ai-prompt-basics`]: (init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer guest-session-token");
        return jsonResponse({
          user_id: "guest-user",
          path_id: "ai-basics",
          path_title: "AI 基础",
          unit: unitFixtures[2],
          progress: {
            user_id: "guest-user",
            unit_id: "ai-prompt-basics",
            status: "not_started",
            completed_step_ids: [],
            code_draft: null,
            notes: null,
          },
          run_result: {
            job_id: "run-guest-reused",
            stdout: "",
            stderr: "",
            exit_status: "completed",
            exit_code: 0,
            timed_out: false,
            trace_frames: [],
            variable_states: [],
            duration_ms: 18,
          },
          ai_response: {
            mode: "explain",
            explanation: "欢迎开始第一节课。",
            selected_text: null,
          },
          learning_pulse: {
            user_id: "guest-user",
            completed_units: [],
            streak_days: 0,
            recent_activity: ["创建访客会话"],
          },
        });
      },
    });

    const accessToken = await getStudioSessionAccessToken();
    expect(accessToken).toBe("guest-session-token");

    const [lesson, summary] = await Promise.all([
      getStudioLesson("ai-prompt-basics", { accessToken }),
      getCurrentLearnerSummary({ accessToken }),
    ]);

    expect(lesson).toMatchObject({
      progress: {
        userId: "guest-user",
      },
    });
    expect(summary).toMatchObject({
      userId: "guest-user",
      email: "guest-123@learning.local",
    });
    expect(guestSessionBootstraps).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("returns null when guest-session bootstrap throws before a response exists", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    installFetchHandlers({
      [`POST ${API_BASE_URL}/auth/guest`]: () => {
        throw new Error("guest bootstrap unavailable");
      },
    });

    await expect(getStudioSessionAccessToken()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
