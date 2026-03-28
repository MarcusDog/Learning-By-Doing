import { describe, expect, it } from "vitest";

import {
  buildAiCoachQuestion,
  buildStudioTemplates,
  getVisualizationFramesForWorkspace,
  toggleCompletedStep,
} from "./studio-workspace";

describe("buildStudioTemplates", () => {
  it("includes a blank scratch template before lesson templates", () => {
    const templates = buildStudioTemplates({
      title: "Python 变量",
      exampleCode: "value = 2\nprint(value)\n",
      practiceTasks: [
        {
          id: "predict-output",
          title: "预测输出",
          prompt: "自己定义一个变量并打印它。",
          expectedOutcome: "能输出你定义的值",
        },
      ],
    });

    expect(templates[0]).toMatchObject({
      id: "blank-scratch",
      title: "从 0 开始",
      code: expect.stringContaining("# 从零开始练习"),
    });
    expect(templates[1]).toMatchObject({
      id: "lesson-example",
      title: "课程示例",
      code: "value = 2\nprint(value)\n",
    });
    expect(templates[2]).toMatchObject({
      id: "task-predict-output",
      title: "练习：预测输出",
      code: expect.stringContaining("# 目标：能输出你定义的值"),
    });
  });
});

describe("buildAiCoachQuestion", () => {
  it("prioritizes selected code when user asks from a selection", () => {
    expect(
      buildAiCoachQuestion({
        selectedText: "for i in range(3):\n    print(i)",
        question: "",
        unitTitle: "循环入门",
      }),
    ).toContain("请解释我选中的这段 Python 代码");
  });

  it("falls back to the typed question when no code is selected", () => {
    expect(
      buildAiCoachQuestion({
        selectedText: "",
        question: "为什么这里要先定义变量？",
        unitTitle: "变量入门",
      }),
    ).toBe("为什么这里要先定义变量？");
  });
});

describe("getVisualizationFramesForWorkspace", () => {
  it("uses runtime variable states before static lesson frames", () => {
    const frames = getVisualizationFramesForWorkspace({
      runtimeStates: [
        {
          step: 1,
          lineNumber: 2,
          variables: { total: "3" },
        },
      ],
      lessonFrames: [
        {
          step: 1,
          lineNumber: 1,
          focus: "静态讲解",
          variables: { total: "0" },
        },
      ],
    });

    expect(frames).toEqual([
      {
        step: 1,
        lineNumber: 2,
        focus: "运行到第 2 行",
        variables: { total: "3" },
        source: "runtime",
      },
    ]);
  });

  it("falls back to lesson frames when there is no runtime state", () => {
    const frames = getVisualizationFramesForWorkspace({
      runtimeStates: [],
      lessonFrames: [
        {
          step: 2,
          lineNumber: 5,
          focus: "变量已更新",
          variables: { total: "8" },
        },
      ],
    });

    expect(frames[0]).toMatchObject({
      step: 2,
      lineNumber: 5,
      focus: "变量已更新",
      source: "lesson",
    });
  });
});

describe("toggleCompletedStep", () => {
  it("adds and removes checklist steps without duplicates", () => {
    expect(toggleCompletedStep([], "read-example", true)).toEqual(["read-example"]);
    expect(toggleCompletedStep(["read-example"], "read-example", true)).toEqual(["read-example"]);
    expect(toggleCompletedStep(["read-example"], "read-example", false)).toEqual([]);
  });
});
