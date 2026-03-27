import { describe, expect, it } from "vitest";

import {
  formatAudienceLevelLabel,
  formatPracticeKindLabel,
  formatStepCountLabel,
  getCompletedStepsEmptyState,
  getRecentActivityEmptyState,
} from "./learning-copy";

describe("learning copy helpers", () => {
  it("maps internal audience levels to learner-facing labels", () => {
    expect(formatAudienceLevelLabel("beginner_first")).toBe("新手优先");
    expect(formatAudienceLevelLabel("intermediate")).toBe("进阶");
    expect(formatAudienceLevelLabel("advanced")).toBe("高级");
  });

  it("maps practice kinds to learner-facing labels", () => {
    expect(formatPracticeKindLabel("guided")).toBe("跟做练习");
    expect(formatPracticeKindLabel("transfer")).toBe("迁移练习");
  });

  it("formats step counts without leaking english taxonomy", () => {
    expect(formatStepCountLabel(0, 3)).toBe("0/3 步");
    expect(formatStepCountLabel(2, 5)).toBe("2/5 步");
  });

  it("provides explicit empty-state copy for untouched studio progress", () => {
    expect(getCompletedStepsEmptyState()).toBe("还没有完成步骤，先运行示例或完成第一个练习。");
    expect(getRecentActivityEmptyState()).toBe("最近还没有学习动作，先打开课程或运行示例。");
  });
});
