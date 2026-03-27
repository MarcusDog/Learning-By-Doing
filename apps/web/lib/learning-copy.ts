import type {
  AudienceLevel,
  PracticeTaskKind,
} from "@learning-by-doing/shared-types";

export function formatAudienceLevelLabel(level: AudienceLevel) {
  switch (level) {
    case "intermediate":
      return "进阶";
    case "advanced":
      return "高级";
    default:
      return "新手优先";
  }
}

export function formatPracticeKindLabel(kind: PracticeTaskKind) {
  switch (kind) {
    case "transfer":
      return "迁移练习";
    default:
      return "跟做练习";
  }
}

export function formatPracticeTaskCountLabel(count: number) {
  return `${count} 个练习任务`;
}

export function formatStepCountLabel(completed: number, total: number) {
  return `${completed}/${total} 步`;
}

export function getCompletedStepsEmptyState() {
  return "还没有完成步骤，先运行示例或完成第一个练习。";
}

export function getRecentActivityEmptyState() {
  return "最近还没有学习动作，先打开课程或运行示例。";
}
