import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { LearnerShell } from "../../../components/learner-shell";
import { SectionCard } from "../../../components/section-card";
import { StudioWorkspace } from "../../../components/studio-workspace";
import {
  getCurrentLearnerOverview,
  getStudioLesson,
  getStudioSessionAccessToken,
  listLessonPaths,
} from "../../../lib/learning-data";

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

  return (
    <LearnerShell
      activeHref="/studio"
      chromeMode="compact"
      navigationPaths={navigationPaths}
      learnerSummary={learnerSummary}
      progressSnapshot={progressSnapshot}
    >
      <div className="page-shell studio-top-actions">
        <Link className="secondary" href={`/learn/${lesson.pathId}/${lesson.unit.slug}` as Route}>
          返回 lesson 详情
        </Link>
        <Link className="secondary" href={"/studio" as Route}>
          切换其他 studio
        </Link>
      </div>
      <StudioWorkspace lesson={lesson} studioPathProgress={studioPathProgress ?? null} />
    </LearnerShell>
  );
}
