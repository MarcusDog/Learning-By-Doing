import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../../components/code-block";
import { SectionCard } from "../../../../components/section-card";
import { getLessonPath, getLessonUnit } from "../../../../lib/learning-data";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{
    pathId: string;
    unitSlug: string;
  }>;
};

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { pathId, unitSlug } = await params;
  const [path, unit] = await Promise.all([
    getLessonPath(pathId),
    getLessonUnit(unitSlug),
  ]);

  if (!path || !unit || !path.featuredUnitSlugs.includes(unit.slug)) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="detail-hero">
        <div className="detail-copy">
          <p className="eyebrow">LESSON DETAIL</p>
          <h1>{unit.title}</h1>
          <p className="lede">{unit.learningGoal}</p>
          <div className="metric-row">
            <span className="metric-pill">{path.title}</span>
            <span className="metric-pill">{unit.audienceLevel}</span>
            <span className="metric-pill">
              {unit.practiceTasks.length} 个 practice 任务
            </span>
          </div>
          <div className="actions">
            <Link className="primary" href={`/studio/${unit.slug}` as Route}>
              去 studio 运行和复盘
            </Link>
            <Link className="secondary" href={`/learn/${path.id}` as Route}>
              返回路径页
            </Link>
          </div>
        </div>
        <CodeBlock label="本课示例代码" code={unit.exampleCode} />
      </section>

      <div className="detail-grid">
        <SectionCard title="概念解释" eyebrow="CONCEPT">
          <p>{unit.conceptExplanation}</p>
        </SectionCard>

        <SectionCard title="AI 解释策略" eyebrow="COACHING">
          <p>{unit.aiExplanationContext}</p>
        </SectionCard>
      </div>

      <SectionCard title="可视化步骤" eyebrow="VISUALIZATION">
        <div className="frame-grid">
          {unit.visualization.frames.map((frame) => (
            <article className="frame-card" key={`${unit.slug}-${frame.step}`}>
              <span className="frame-step">STEP {frame.step}</span>
              <strong>Line {frame.lineNumber}</strong>
              <p>{frame.focus}</p>
              <code>{Object.entries(frame.variables).map(([key, value]) => `${key}=${value}`).join(" | ")}</code>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="练习任务" eyebrow="PRACTICE">
        <div className="practice-grid">
          {unit.practiceTasks.map((task) => (
            <article className="practice-card" key={task.id}>
              <div className="practice-card-header">
                <span className="path-pill">{task.kind}</span>
                <strong>{task.title}</strong>
              </div>
              <p>{task.prompt}</p>
              <div className="practice-outcome">预期结果：{task.expectedOutcome}</div>
              <ul className="stack-list">
                {task.hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionCard>
    </main>
  );
}
