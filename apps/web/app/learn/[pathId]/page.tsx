import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../components/code-block";
import { SectionCard } from "../../../components/section-card";
import { getLessonPath } from "../../../lib/learning-data";

export const dynamic = "force-dynamic";

type PathPageProps = {
  params: Promise<{
    pathId: string;
  }>;
};

export default async function LearningPathPage({ params }: PathPageProps) {
  const { pathId } = await params;
  const path = await getLessonPath(pathId);

  if (!path) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="detail-hero">
        <div className="detail-copy">
          <p className="eyebrow">LEARNING PATH</p>
          <h1>{path.title}</h1>
          <p className="lede">{path.description}</p>
          <div className="metric-row">
            <span className="metric-pill">{path.featuredUnit.audienceLevel}</span>
            <span className="metric-pill">
              {path.featuredUnit.practiceTasks.length} 个练习任务
            </span>
            <span className="metric-pill">
              {path.featuredUnit.visualization.frames.length} 帧可视化
            </span>
          </div>
          <div className="actions">
            <Link
              className="primary"
              href={`/learn/${path.id}/${path.featuredUnit.slug}` as Route}
            >
              进入 lesson
            </Link>
            <Link
              className="secondary"
              href={`/studio/${path.featuredUnit.slug}` as Route}
            >
              直接打开 studio
            </Link>
          </div>
        </div>
        <CodeBlock label="路径中的第一个示例" code={path.featuredUnit.exampleCode} />
      </section>

      <div className="detail-grid">
        <SectionCard title="这一页会带你完成什么" eyebrow="FLOW">
          <ul className="stack-list">
            <li>先用一段很短的解释把核心概念讲清楚。</li>
            <li>再用真实示例代码把抽象词汇和运行结果对齐。</li>
            <li>最后用 studio 页面把运行、AI 解释和进度放在一起复盘。</li>
          </ul>
        </SectionCard>

        <SectionCard title={path.featuredUnit.title} eyebrow="FEATURED UNIT">
          <p>{path.featuredUnit.learningGoal}</p>
          <div className="subtle-divider" />
          <p>{path.featuredUnit.conceptExplanation}</p>
        </SectionCard>
      </div>

      <SectionCard title="先修要求与完成标准" eyebrow="READINESS">
        <div className="detail-grid compact">
          <div className="info-block">
            <h3>先修要求</h3>
            <ul className="stack-list">
              {path.featuredUnit.prerequisites.length > 0 ? (
                path.featuredUnit.prerequisites.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>零基础可直接开始</li>
              )}
            </ul>
          </div>
          <div className="info-block">
            <h3>完成标准</h3>
            <ul className="stack-list">
              {path.featuredUnit.acceptanceCriteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="路径 lesson lineup" eyebrow="LESSON MAP">
        <div className="lesson-lineup">
          {path.units.map((unit, index) => (
            <article className="lesson-card" key={unit.slug}>
              <div className="lesson-card-header">
                <span className="path-pill">Lesson {index + 1}</span>
                <span className="path-meta">{unit.practiceTasks.length} 个练习</span>
              </div>
              <h3>{unit.title}</h3>
              <p>{unit.learningGoal}</p>
              <div className="tag-row">
                <span>{unit.audienceLevel}</span>
                <span>{unit.visualization.frames.length} 帧可视化</span>
              </div>
              <div className="lesson-card-actions">
                <Link className="secondary" href={`/learn/${path.id}/${unit.slug}` as Route}>
                  打开 lesson
                </Link>
                <Link className="secondary" href={`/studio/${unit.slug}` as Route}>
                  打开 studio
                </Link>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </main>
  );
}
