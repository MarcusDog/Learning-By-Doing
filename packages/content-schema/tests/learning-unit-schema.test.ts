import { describe, expect, it } from "vitest";
import { learningUnitSchema, sampleLearningUnit } from "../src";

describe("learningUnitSchema", () => {
  it("accepts the canonical sample learning unit", () => {
    const result = learningUnitSchema.safeParse(sampleLearningUnit);

    expect(result.success).toBe(true);
  });

  it("rejects practice tasks without any transfer challenge", () => {
    const result = learningUnitSchema.safeParse({
      ...sampleLearningUnit,
      practiceTasks: [
        {
          id: "practice-1",
          title: "Rename the variable",
          difficulty: "easy",
          prompt: "Rename total to count.",
          expectedOutcome: "The code still runs.",
          hints: ["Use one replacement only."],
          kind: "guided"
        }
      ]
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("expected validation failure");
    }
    expect(result.error.issues[0]?.message).toContain("transfer");
  });
});
