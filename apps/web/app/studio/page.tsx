import Link from "next/link";
import type { Route } from "next";

import { listLessonPaths } from "../../lib/learning-data";

export const dynamic = "force-dynamic";

export default async function StudioIndexPage() {
  const paths = await listLessonPaths();

  return (
    <main className="page-shell">
      <section className="detail-hero">
        <div className="detail-copy">
          <p className="eyebrow">WORKBENCH</p>
          <h1>学习工作台</h1>
          <p className="lede">
            当前 Phase 1 先把每个 lesson 的代码、运行结果、AI 解释和进度视图连成一页。
            当前 studio 索引直接读取 live API，不再依赖本地 fixture。
          </p>
        </div>
      </section>

      <section className="path-grid">
        {paths.map((path) => (
          <Link
            key={path.id}
            className="path-card"
            href={`/studio/${path.featuredUnit.slug}` as Route}
          >
            <div className="path-card-header">
              <span className="path-pill">{path.title}</span>
              <span className="path-meta">进入对应 studio</span>
            </div>
            <p>{path.featuredUnit.learningGoal}</p>
            <div className="path-feature">
              <div className="path-feature-label">当前 lesson</div>
              <strong>{path.featuredUnit.title}</strong>
              <span>代码、AI、运行结果、进度同屏查看</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
