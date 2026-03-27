import Link from "next/link";
import type { Route } from "next";

import {
  getRecommendedPathUnit,
  type LearnerPathProgressSummary,
  type LessonPath,
} from "../lib/learning-data";
import { ProgressStatusBadge } from "./learner-progress";

type PathCardProps = {
  path: LessonPath;
  progressSummary?: LearnerPathProgressSummary;
  href?: string;
};

export function PathCard({ path, progressSummary, href }: PathCardProps) {
  const highlightedUnit = getRecommendedPathUnit(path, progressSummary);

  return (
    <Link className="path-card" href={(href ?? `/learn/${path.id}`) as Route}>
      <div className="path-card-header">
        <span className="path-pill">{path.title}</span>
        <span className="path-meta">{path.units.length} 个主线 lesson</span>
      </div>
      <p>{path.description}</p>
      {progressSummary ? (
        <div className="path-card-progress">
          <div className="metric-row compact-metrics">
            <span className="metric-pill">
              已完成 {progressSummary.completedUnits}/{progressSummary.totalUnits}
            </span>
            <span className="metric-pill">
              进行中 {progressSummary.inProgressUnits}
            </span>
          </div>
          {progressSummary.nextUnitSlug ? (
            <div className="path-progress-inline">
              <ProgressStatusBadge
                status={progressSummary.units.find((unit) => unit.unitSlug === progressSummary.nextUnitSlug)?.status ?? "not_started"}
              />
              <span>下一节：{progressSummary.nextUnitTitle}</span>
            </div>
          ) : (
            <div className="path-progress-inline">
              <ProgressStatusBadge status="completed" />
              <span>这条路径已经全部完成</span>
            </div>
          )}
        </div>
      ) : null}
      <div className="path-feature">
        <div className="path-feature-label">
          {progressSummary?.nextUnitSlug ? "下一节建议" : "本路径先学"}
        </div>
        <strong>{highlightedUnit.title}</strong>
        <span>{highlightedUnit.learningGoal}</span>
      </div>
    </Link>
  );
}
