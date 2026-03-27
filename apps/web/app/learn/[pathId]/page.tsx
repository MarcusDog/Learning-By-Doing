import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../components/code-block";
import {
  PathProgressChecklist,
  ProgressStatusBadge,
} from "../../../components/learner-progress";
import { LearnerShell } from "../../../components/learner-shell";
import { SectionCard } from "../../../components/section-card";
import {
  getCurrentLearnerOverview,
  listLessonPaths,
} from "../../../lib/learning-data";
import {
  formatAudienceLevelLabel,
  formatPracticeTaskCountLabel,
  formatStepCountLabel,
} from "../../../lib/learning-copy";

export const dynamic = "force-dynamic";

type PathPageProps = {
  params: Promise<{
    pathId: string;
  }>;
};

export default async function LearningPathPage({ params }: PathPageProps) {
  const { pathId } = await params;
  const paths = await listLessonPaths();
  const navigationPaths = paths.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
  }));
  const path = paths.find((candidate) => candidate.id === pathId);

  if (!path) {
    notFound();
  }

  const learnerOverview = await getCurrentLearnerOverview(paths);
  const learnerSummary = learnerOverview?.summary ?? null;
  const progressSnapshot = learnerOverview?.progressSnapshot ?? null;
  const pathProgress = progressSnapshot?.pathSummaries.find((summary) => summary.pathId === path.id) ?? null;
  const resumeUnitSlug = pathProgress?.nextUnitSlug ?? path.featuredUnit.slug;
  const resumeUnitTitle = pathProgress?.nextUnitTitle ?? path.featuredUnit.title;

  return (
    <LearnerShell
      activeHref={`/learn/${path.id}`}
      navigationPaths={navigationPaths}
      learnerSummary={learnerSummary}
      progressSnapshot={progressSnapshot}
    >
      <main className="page-shell">
        <section className="detail-hero">
          <div className="detail-copy">
            <p className="eyebrow">LEARNING PATH</p>
            <h1>{path.title}</h1>
            <p className="lede">{path.description}</p>
            <div className="metric-row">
              <span className="metric-pill">
                {formatAudienceLevelLabel(path.featuredUnit.audienceLevel)}
              </span>
              <span className="metric-pill">
                {formatPracticeTaskCountLabel(path.featuredUnit.practiceTasks.length)}
              </span>
              <span className="metric-pill">
                {path.featuredUnit.visualization.frames.length} 帧可视化
              </span>
              {pathProgress ? (
                <>
                  <span className="metric-pill">
                    已完成 {pathProgress.completedUnits}/{pathProgress.totalUnits}
                  </span>
                  <span className="metric-pill">
                    进行中 {pathProgress.inProgressUnits} 节
                  </span>
                </>
              ) : null}
            </div>
            <div className="actions">
              <Link
                className="primary"
                href={`/learn/${path.id}/${resumeUnitSlug}` as Route}
              >
                {pathProgress?.nextUnitSlug ? `继续：${resumeUnitTitle}` : "进入 lesson"}
              </Link>
              <Link
                className="secondary"
                href={`/studio/${resumeUnitSlug}` as Route}
              >
                {pathProgress?.nextUnitSlug ? "继续做 studio" : "直接打开 studio"}
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

        {pathProgress ? (
          <SectionCard title="你在这条路径上的进度" eyebrow="PATH PROGRESS">
            <div className="metric-row compact-metrics">
              <span className="metric-pill">完成度 {pathProgress.completionPercent}%</span>
              <span className="metric-pill">未开始 {pathProgress.notStartedUnits} 节</span>
              <span className="metric-pill">
                下一节 {pathProgress.nextUnitTitle ?? "全部完成"}
              </span>
            </div>
            <PathProgressChecklist pathSummary={pathProgress} />
          </SectionCard>
        ) : null}

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

        <SectionCard title="路径课程一览" eyebrow="LESSON MAP">
          <div className="lesson-lineup">
            {path.units.map((unit, index) => (
              <article className="lesson-card" key={unit.slug}>
                <div className="lesson-card-header">
                  <span className="path-pill">Lesson {index + 1}</span>
                  <span className="path-meta">
                    {formatStepCountLabel(
                      pathProgress?.units[index]?.completedStepCount ?? 0,
                      pathProgress?.units[index]?.totalStepCount ?? (unit.practiceTasks.length + 1),
                    )}
                  </span>
                </div>
                <h3>{unit.title}</h3>
                <p>{unit.learningGoal}</p>
                <div className="tag-row">
                  <span>{formatAudienceLevelLabel(unit.audienceLevel)}</span>
                  <span>{unit.visualization.frames.length} 帧可视化</span>
                  {pathProgress ? (
                    <ProgressStatusBadge
                      status={pathProgress.units[index]?.status ?? "not_started"}
                    />
                  ) : null}
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
    </LearnerShell>
  );
}
