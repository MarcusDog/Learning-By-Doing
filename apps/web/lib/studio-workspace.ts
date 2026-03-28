type StudioTemplateInput = {
  title: string;
  exampleCode: string;
  practiceTasks: Array<{
    id: string;
    title: string;
    prompt: string;
    expectedOutcome: string;
  }>;
};

type VisualizationFrameInput = {
  step: number;
  lineNumber: number;
  focus: string;
  variables: Record<string, string>;
};

type RuntimeStateInput = {
  step: number;
  lineNumber: number;
  variables: Record<string, string>;
};

export type StudioTemplate = {
  id: string;
  title: string;
  description: string;
  code: string;
};

export type WorkspaceVisualizationFrame = {
  step: number;
  lineNumber: number;
  focus: string;
  variables: Record<string, string>;
  source: "runtime" | "lesson";
};

export function buildStudioTemplates(input: StudioTemplateInput): StudioTemplate[] {
  const scratchTemplate: StudioTemplate = {
    id: "blank-scratch",
    title: "从 0 开始",
    description: `不带答案，直接围绕《${input.title}》自己写。`,
    code: [
      "# 从零开始练习",
      `# 主题：${input.title}`,
      "# 在这里自己写 Python 代码，然后点击“运行代码”。",
      "",
    ].join("\n"),
  };

  const exampleTemplate: StudioTemplate = {
    id: "lesson-example",
    title: "课程示例",
    description: "载入当前课程示例代码，方便你先运行再改写。",
    code: input.exampleCode,
  };

  const taskTemplates = input.practiceTasks.map((task) => ({
    id: `task-${task.id}`,
    title: `练习：${task.title}`,
    description: task.prompt,
    code: [
      `# 练习：${task.title}`,
      `# 目标：${task.expectedOutcome}`,
      `# 要求：${task.prompt}`,
      "",
    ].join("\n"),
  }));

  return [scratchTemplate, exampleTemplate, ...taskTemplates];
}

export function buildAiCoachQuestion({
  selectedText,
  question,
  unitTitle,
}: {
  selectedText: string;
  question: string;
  unitTitle: string;
}) {
  const trimmedSelection = selectedText.trim();
  if (trimmedSelection) {
    return `请解释我选中的这段 Python 代码，它在《${unitTitle}》这一课里具体做了什么：\n\n${trimmedSelection}`;
  }

  const trimmedQuestion = question.trim();
  if (trimmedQuestion) {
    return trimmedQuestion;
  }

  return `请作为 Python 学习教练，结合《${unitTitle}》告诉我下一步该怎么练。`;
}

export function getVisualizationFramesForWorkspace({
  runtimeStates,
  lessonFrames,
}: {
  runtimeStates: RuntimeStateInput[];
  lessonFrames: VisualizationFrameInput[];
}): WorkspaceVisualizationFrame[] {
  if (runtimeStates.length > 0) {
    return runtimeStates.map((state) => ({
      step: state.step,
      lineNumber: state.lineNumber,
      focus: `运行到第 ${state.lineNumber} 行`,
      variables: state.variables,
      source: "runtime",
    }));
  }

  return lessonFrames.map((frame) => ({
    ...frame,
    source: "lesson",
  }));
}

export function toggleCompletedStep(
  currentSteps: string[],
  stepId: string,
  checked: boolean,
) {
  if (checked) {
    return currentSteps.includes(stepId) ? currentSteps : [...currentSteps, stepId];
  }

  return currentSteps.filter((item) => item !== stepId);
}
