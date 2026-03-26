import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../components/code-block";
import { SectionCard } from "../../../components/section-card";
import { getStudioLesson } from "../../../lib/learning-data";

export const dynamic = "force-dynamic";

type StudioPageProps = {
  params: Promise<{
    unitSlug: string;
  }>;
};

export default async function StudioLessonPage({ params }: StudioPageProps) {
  const { unitSlug } = await params;
  const lesson = await getStudioLesson(unitSlug);

  if (!lesson) {
    notFound();
  }

  const completedRatio = `${lesson.progress.completedStepIds.length}/${lesson.unit.practiceTasks.length + 1}`;

  return (
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
            <span className="metric-pill">{lesson.progress.status}</span>
            <span className="metric-pill">完成度 {completedRatio}</span>
            <span className="metric-pill">连续学习 {lesson.learningPulse.streakDays} 天</span>
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
              <ul className="stack-list">
                {lesson.progress.completedStepIds.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="info-block">
              <h3>最近活动</h3>
              <ul className="stack-list">
                {lesson.learningPulse.recentActivity.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          {lesson.progress.notes ? (
            <div className="note-card">学习笔记：{lesson.progress.notes}</div>
          ) : null}
        </SectionCard>

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
      </div>
    </main>
  );
}
