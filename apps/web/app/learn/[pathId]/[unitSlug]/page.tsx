import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../../components/code-block";
import {
  formatProgressStatusLabel,
  PathProgressChecklist,
  ProgressStatusBadge,
} from "../../../../components/learner-progress";
import { LearnerShell } from "../../../../components/learner-shell";
import { SectionCard } from "../../../../components/section-card";
import {
  getCurrentLearnerOverview,
  listLessonPaths,
} from "../../../../lib/learning-data";
import {
  formatAudienceLevelLabel,
  formatPracticeKindLabel,
  formatPracticeTaskCountLabel,
  formatStepCountLabel,
} from "../../../../lib/learning-copy";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{
    pathId: string;
    unitSlug: string;
  }>;
};

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { pathId, unitSlug } = await params;
  const paths = await listLessonPaths();
  const navigationPaths = paths.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
  }));
  const path = paths.find((candidate) => candidate.id === pathId);
  const unit = path?.units.find((candidate) => candidate.slug === unitSlug);

  if (!path || !unit || !path.featuredUnitSlugs.includes(unit.slug)) {
    notFound();
  }

  const learnerOverview = await getCurrentLearnerOverview(paths);
  const learnerSummary = learnerOverview?.summary ?? null;
  const progressSnapshot = learnerOverview?.progressSnapshot ?? null;
  const pathProgress = progressSnapshot?.pathSummaries.find((summary) => summary.pathId === path.id) ?? null;
  const unitProgress = pathProgress?.units.find((summary) => summary.unitSlug === unit.slug) ?? null;

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
            <p className="eyebrow">LESSON DETAIL</p>
            <h1>{unit.title}</h1>
            <p className="lede">{unit.learningGoal}</p>
            <div className="metric-row">
              <span className="metric-pill">{path.title}</span>
              <span className="metric-pill">
                {formatAudienceLevelLabel(unit.audienceLevel)}
              </span>
              <span className="metric-pill">
                {formatPracticeTaskCountLabel(unit.practiceTasks.length)}
              </span>
              {unitProgress ? (
                <>
                  <span className="metric-pill">
                    {formatStepCountLabel(
                      unitProgress.completedStepCount,
                      unitProgress.totalStepCount,
                    )}
                  </span>
                  <span className="metric-pill">
                    <span className="inline-status">
                      <ProgressStatusBadge status={unitProgress.status} />
                    </span>
                  </span>
                </>
              ) : null}
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

        {pathProgress && unitProgress ? (
          <SectionCard title="你的当前 lesson 进度" eyebrow="LEARNER STATE">
            <div className="detail-grid compact">
              <div className="info-block">
                <h3>当前 lesson</h3>
                <p className="progress-copy">
                  当前状态：{formatProgressStatusLabel(unitProgress.status)}，已经完成{" "}
                  {unitProgress.completedStepCount}/{unitProgress.totalStepCount} 个关键步骤。
                </p>
                <p className="progress-copy">
                  {unitProgress.status === "completed"
                    ? "这一课已经收尾，可以直接去 studio 复盘，或者回路径继续下一节。"
                    : unitProgress.status === "in_progress"
                      ? "这节已经开始，最适合直接进 studio 接着跑代码和完成练习。"
                      : "这节还没开始，先看完下面的概念和练习，再进入 studio。"}
                </p>
              </div>
              <div className="info-block">
                <h3>路径总览</h3>
                <p className="progress-copy">
                  这条路径已完成 {pathProgress.completedUnits}/{pathProgress.totalUnits} 节，
                  完成度 {pathProgress.completionPercent}%。
                </p>
                <p className="progress-copy">
                  下一节建议：{pathProgress.nextUnitTitle ?? "你已经完成整条路径"}
                </p>
              </div>
            </div>
            <PathProgressChecklist pathSummary={pathProgress} currentUnitSlug={unit.slug} />
          </SectionCard>
        ) : null}

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
                  <span className="path-pill">{formatPracticeKindLabel(task.kind)}</span>
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
    </LearnerShell>
  );
}
