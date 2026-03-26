import Link from "next/link";
import type { Route } from "next";

import type { LessonPath } from "../lib/learning-data";

type PathCardProps = {
  path: LessonPath;
};

export function PathCard({ path }: PathCardProps) {
  return (
    <Link className="path-card" href={`/learn/${path.id}` as Route}>
      <div className="path-card-header">
        <span className="path-pill">{path.title}</span>
        <span className="path-meta">{path.units.length} 个主线 lesson</span>
      </div>
      <p>{path.description}</p>
      <div className="path-feature">
        <div className="path-feature-label">本路径先学</div>
        <strong>{path.featuredUnit.title}</strong>
        <span>{path.featuredUnit.learningGoal}</span>
      </div>
    </Link>
  );
}
