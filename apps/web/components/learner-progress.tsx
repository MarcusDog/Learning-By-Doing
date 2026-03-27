import Link from "next/link";
import type { Route } from "next";

import type {
  LearnerPathProgressSummary,
  LearnerProgressSnapshot,
  LearnerUnitProgressSummary,
} from "../lib/learning-data";
import { formatStepCountLabel } from "../lib/learning-copy";

export function formatProgressStatusLabel(status: LearnerUnitProgressSummary["status"]) {
  switch (status) {
    case "completed":
      return "已完成";
    case "in_progress":
      return "进行中";
    default:
      return "未开始";
  }
}

export function ProgressStatusBadge({
  status,
}: {
  status: LearnerUnitProgressSummary["status"];
}) {
  return (
    <span className={`progress-status progress-status-${status}`}>
      {formatProgressStatusLabel(status)}
    </span>
  );
}

export function LearnerProgressOverview({
  snapshot,
}: {
  snapshot: LearnerProgressSnapshot;
}) {
  return (
    <section className="section-card">
      <p className="eyebrow">LEARNER PROGRESS</p>
      <h2>你的学习进度一眼可见</h2>
      <div className="progress-stat-grid">
        <article className="progress-stat-card">
          <strong>{snapshot.completedUnits}</strong>
          <span>已完成课程</span>
        </article>
        <article className="progress-stat-card">
          <strong>{snapshot.inProgressUnits}</strong>
          <span>进行中课程</span>
        </article>
        <article className="progress-stat-card">
          <strong>{snapshot.notStartedUnits}</strong>
          <span>待开始课程</span>
        </article>
        <article className="progress-stat-card">
          <strong>{snapshot.completionPercent}%</strong>
          <span>整体完成度</span>
        </article>
      </div>
      <div className="path-progress-grid">
        {snapshot.pathSummaries.map((pathSummary) => (
          <article className="path-progress-card" key={pathSummary.pathId}>
            <div className="path-card-header">
              <span className="path-pill">{pathSummary.pathTitle}</span>
              <span className="path-meta">
                {pathSummary.completedUnits}/{pathSummary.totalUnits} 已完成
              </span>
            </div>
            <p>
              {pathSummary.inProgressUnits > 0
                ? `当前有 ${pathSummary.inProgressUnits} 节正在推进。`
                : "当前没有正在推进的课程。"}
            </p>
            <div className="metric-row compact-metrics">
              <span className="metric-pill">完成度 {pathSummary.completionPercent}%</span>
              <span className="metric-pill">待开始 {pathSummary.notStartedUnits}</span>
            </div>
            {pathSummary.nextUnitSlug ? (
              <div className="path-progress-next">
                <span className="path-feature-label">下一节建议</span>
                <strong>{pathSummary.nextUnitTitle}</strong>
                <div className="lesson-card-actions">
                  <Link
                    className="secondary"
                    href={`/learn/${pathSummary.pathId}/${pathSummary.nextUnitSlug}` as Route}
                  >
                    打开 lesson
                  </Link>
                  <Link
                    className="secondary"
                    href={`/studio/${pathSummary.nextUnitSlug}` as Route}
                  >
                    打开 studio
                  </Link>
                </div>
              </div>
            ) : (
              <div className="path-progress-next">
                <span className="path-feature-label">路径状态</span>
                <strong>这条路径已经全部完成</strong>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function PathProgressChecklist({
  pathSummary,
  currentUnitSlug,
}: {
  pathSummary: LearnerPathProgressSummary;
  currentUnitSlug?: string;
}) {
  return (
    <div className="path-progress-list">
      {pathSummary.units.map((unit) => {
        const isCurrent = currentUnitSlug === unit.unitSlug;
        return (
          <article
            className={isCurrent ? "unit-progress-card current" : "unit-progress-card"}
            key={`${pathSummary.pathId}-${unit.unitSlug}`}
          >
            <div className="unit-progress-topline">
              <ProgressStatusBadge status={unit.status} />
              <span className="path-meta">
                {formatStepCountLabel(unit.completedStepCount, unit.totalStepCount)}
              </span>
              {isCurrent ? <span className="path-pill">当前课程</span> : null}
            </div>
            <h3>{unit.unitTitle}</h3>
            <p>
              {unit.status === "completed"
                ? "这节课已完成，可以直接复盘或跳到下一节。"
                : unit.status === "in_progress"
                  ? "这节课已经开始，继续进入 studio 接着做。"
                  : "这节课还没开始，适合作为下一步。"}
            </p>
            <div className="lesson-card-actions">
              <Link className="secondary" href={unit.lessonHref as Route}>
                打开 lesson
              </Link>
              <Link className="secondary" href={unit.studioHref as Route}>
                打开 studio
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
