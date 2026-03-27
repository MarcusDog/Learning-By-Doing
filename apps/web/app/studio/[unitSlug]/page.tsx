import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../components/code-block";
import {
  formatProgressStatusLabel,
  PathProgressChecklist,
} from "../../../components/learner-progress";
import { LearnerShell } from "../../../components/learner-shell";
import { SectionCard } from "../../../components/section-card";
import {
  getCurrentLearnerOverview,
  getStudioLesson,
  getStudioSessionAccessToken,
  listLessonPaths,
} from "../../../lib/learning-data";
import {
  formatStepCountLabel,
  getCompletedStepsEmptyState,
  getRecentActivityEmptyState,
} from "../../../lib/learning-copy";

export const dynamic = "force-dynamic";

type StudioPageProps = {
  params: Promise<{
    unitSlug: string;
  }>;
};

export default async function StudioLessonPage({ params }: StudioPageProps) {
  const { unitSlug } = await params;
  const sessionAccessToken = await getStudioSessionAccessToken();
  const [paths, lesson] = await Promise.all([
    listLessonPaths(),
    sessionAccessToken
      ? getStudioLesson(unitSlug, { accessToken: sessionAccessToken })
      : Promise.resolve(undefined),
  ]);
  const navigationPaths = paths.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
  }));
  const learnerOverview = await getCurrentLearnerOverview(paths, { accessToken: sessionAccessToken });
  const learnerSummary = learnerOverview?.summary ?? null;
  const progressSnapshot = learnerOverview?.progressSnapshot ?? null;
  const studioPathProgress = lesson
    ? progressSnapshot?.pathSummaries.find((summary) => summary.pathId === lesson.pathId) ?? null
    : null;

  if (!lesson) {
    if (!sessionAccessToken || !learnerSummary) {
      return (
        <LearnerShell
          activeHref="/studio"
          navigationPaths={navigationPaths}
          learnerSummary={learnerSummary}
          progressSnapshot={progressSnapshot}
        >
          <main className="page-shell">
            <SectionCard title="学习会话暂时不可用" eyebrow="STUDIO STATUS">
              <p>
                当前这次请求没能拿到访客学习会话，所以还不能加载这个 unit 的
                studio 数据。请返回工作台重试，或者刷新页面重新建立会话。
              </p>
            </SectionCard>
          </main>
        </LearnerShell>
      );
    }
    notFound();
  }

  const completedRatio = formatStepCountLabel(
    lesson.progress.completedStepIds.length,
    lesson.unit.practiceTasks.length + 1,
  );

  return (
    <LearnerShell
      activeHref="/studio"
      navigationPaths={navigationPaths}
      learnerSummary={learnerSummary}
      progressSnapshot={progressSnapshot}
    >
      <main className="page-shell">
        <section className="detail-hero">
          <div className="detail-copy">
            <p className="eyebrow">UNIT STUDIO</p>
            <h1>{lesson.unit.title}</h1>
            <p className="lede">
              这一页把 code draft、runner 回显、AI 解释和学习进度固定在一起，
              当前初始内容已经通过 live API 在服务端拼装完成。
            </p>
            <div className="metric-row">
              <span className="metric-pill">{formatProgressStatusLabel(lesson.progress.status)}</span>
              <span className="metric-pill">完成度 {completedRatio}</span>
              <span className="metric-pill">连续学习 {lesson.learningPulse.streakDays} 天</span>
              {studioPathProgress ? (
                <span className="metric-pill">
                  路径完成 {studioPathProgress.completedUnits}/{studioPathProgress.totalUnits}
                </span>
              ) : null}
            </div>
            <div className="actions">
              <Link className="primary" href={`/learn/${lesson.pathId}/${lesson.unit.slug}` as Route}>
                返回 lesson 详情
              </Link>
              <Link className="secondary" href={"/studio" as Route}>
                切换其他 studio
              </Link>
            </div>
          </div>
          <CodeBlock label="当前 code draft" code={lesson.progress.codeDraft ?? lesson.unit.exampleCode} />
        </section>

        <div className="studio-grid">
          <SectionCard title="运行结果" eyebrow="RUNNER">
            <div className="terminal-card">
              <div className="terminal-meta">
                <span>{lesson.runResult.job_id}</span>
                <span>{lesson.runResult.exit_status}</span>
                <span>{lesson.runResult.duration_ms}ms</span>
              </div>
              <pre>{lesson.runResult.stdout || "(no stdout)"}</pre>
              {lesson.runResult.stderr ? <pre className="terminal-error">{lesson.runResult.stderr}</pre> : null}
            </div>
          </SectionCard>

          <SectionCard title="AI 陪练视图" eyebrow="AI">
            <div className="coach-card">
              <div className="coach-meta">
                <span>{lesson.aiResponse.mode}</span>
                <span>{lesson.aiResponse.selectedText ?? "未选中文本"}</span>
              </div>
              <p>{lesson.aiResponse.explanation}</p>
            </div>
          </SectionCard>
        </div>

        <div className="studio-grid">
          <SectionCard title="学习进度" eyebrow="PROGRESS">
            <div className="detail-grid compact">
              <div className="info-block">
                <h3>已完成步骤</h3>
                {lesson.progress.completedStepIds.length > 0 ? (
                  <ul className="stack-list">
                    {lesson.progress.completedStepIds.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="progress-copy">{getCompletedStepsEmptyState()}</p>
                )}
              </div>
              <div className="info-block">
                <h3>最近活动</h3>
                {lesson.learningPulse.recentActivity.length > 0 ? (
                  <ul className="stack-list">
                    {lesson.learningPulse.recentActivity.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="progress-copy">{getRecentActivityEmptyState()}</p>
                )}
              </div>
            </div>
            {lesson.progress.notes ? (
              <div className="note-card">学习笔记：{lesson.progress.notes}</div>
            ) : null}
          </SectionCard>

          <SectionCard title="路径进度地图" eyebrow="PATH MAP">
            {studioPathProgress ? (
              <PathProgressChecklist
                pathSummary={studioPathProgress}
                currentUnitSlug={lesson.unit.slug}
              />
            ) : (
              <p>当前还没有可展示的路径进度。</p>
            )}
          </SectionCard>
        </div>

        <SectionCard title="可视化锚点" eyebrow="VISUALIZATION">
          <div className="frame-grid">
            {lesson.unit.visualization.frames.map((frame) => (
              <article className="frame-card" key={`${lesson.unit.slug}-studio-${frame.step}`}>
                <span className="frame-step">STEP {frame.step}</span>
                <strong>Line {frame.lineNumber}</strong>
                <p>{frame.focus}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </main>
    </LearnerShell>
  );
}
