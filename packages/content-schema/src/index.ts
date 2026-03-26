import { z } from "zod";

export const AI_EXPLANATION_MODES = ["explain", "code-map", "exercise-coach", "paper-tutor"] as const;
export const RUN_JOB_STATUSES = ["queued", "running", "completed", "failed", "timed_out"] as const;
export const VISUALIZATION_KINDS = [
  "variable-state",
  "control-flow",
  "call-stack",
  "data-structure",
  "algorithm-flow",
  "tensor-shape"
] as const;

export const practiceTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  prompt: z.string().min(1),
  expectedOutcome: z.string().min(1),
  hints: z.array(z.string()),
  kind: z.enum(["guided", "transfer"])
});

export const learningUnitSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    audienceLevel: z.enum(["beginner_first", "intermediate", "advanced"]),
    learningGoal: z.string().min(1),
    prerequisites: z.array(z.string()),
    conceptExplanation: z.string().min(1),
    exampleCode: z.string().min(1),
    visualizationSpec: z.string().min(1),
    practiceTasks: z.array(practiceTaskSchema).min(1),
    aiExplanationContext: z.string().min(1),
    acceptanceCriteria: z.array(z.string()).min(1)
  })
  .refine(
    (unit) => unit.practiceTasks.some((task) => task.kind === "transfer"),
    { message: "Each learning unit needs at least one transfer challenge." }
  );

export const sampleLearningUnit = {
  slug: "python-variables",
  title: "第一段 Python",
  audienceLevel: "beginner_first",
  learningGoal: "理解变量和打印输出",
  prerequisites: [],
  conceptExplanation: "变量像贴了标签的盒子，print 会把盒子里的内容显示出来。",
  exampleCode: "message = 'hello'\nprint(message)",
  visualizationSpec: "Show variable message flowing into print.",
  practiceTasks: [
    {
      id: "practice-1",
      title: "Check the message",
      difficulty: "easy",
      prompt: "Run the snippet and explain what appears on screen.",
      expectedOutcome: "Learner sees the value of message printed.",
      hints: ["Look at the print line."],
      kind: "guided"
    },
    {
      id: "practice-2",
      title: "Transfer the idea",
      difficulty: "easy",
      prompt: "Change message to your own name and print it.",
      expectedOutcome: "Learner can modify the example independently.",
      hints: ["Only change one value."],
      kind: "transfer"
    }
  ],
  aiExplanationContext: "Explain message and print in beginner-friendly language.",
  acceptanceCriteria: ["代码可运行", "新手能看懂变量的作用"]
} as const;

export type LearningUnit = z.infer<typeof learningUnitSchema>;
export type PracticeTask = z.infer<typeof practiceTaskSchema>;
