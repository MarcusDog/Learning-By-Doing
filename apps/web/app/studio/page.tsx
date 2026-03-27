import { LearnerShell } from "../../components/learner-shell";
import { LearnerProgressOverview } from "../../components/learner-progress";
import { PathCard } from "../../components/path-card";
import {
  getCurrentLearnerOverview,
  getStudioSessionAccessToken,
  listLessonPaths,
} from "../../lib/learning-data";

export const dynamic = "force-dynamic";

export default async function StudioIndexPage() {
  const sessionAccessToken = await getStudioSessionAccessToken();
  const paths = await listLessonPaths();
  const navigationPaths = paths.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
  }));
  const learnerOverview = await getCurrentLearnerOverview(paths, { accessToken: sessionAccessToken });
  const learnerSummary = learnerOverview?.summary ?? null;
  const progressSnapshot = learnerOverview?.progressSnapshot ?? null;
  const progressByPathId = new Map(
    progressSnapshot?.pathSummaries.map((pathSummary) => [pathSummary.pathId, pathSummary] as const) ?? [],
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
            <p className="eyebrow">WORKBENCH</p>
            <h1>学习工作台</h1>
            <p className="lede">
              当前 Phase 1 先把每个 lesson 的代码、运行结果、AI 解释和进度视图连成一页。
              现在 studio 入口也会把每条路径做到哪一节、下一节是什么直接展示出来，不用先点进单个 unit 才知道自己断在哪里。
            </p>
            {progressSnapshot ? (
              <div className="metric-row">
                <span className="metric-pill">
                  已完成 {progressSnapshot.completedUnits}/{progressSnapshot.totalUnits}
                </span>
                <span className="metric-pill">进行中 {progressSnapshot.inProgressUnits} 节</span>
                <span className="metric-pill">完成度 {progressSnapshot.completionPercent}%</span>
              </div>
            ) : null}
          </div>
        </section>

        {progressSnapshot ? <LearnerProgressOverview snapshot={progressSnapshot} /> : null}

        <section className="path-grid">
          {paths.map((path) => {
            const progressSummary = progressByPathId.get(path.id);
            const studioTarget = progressSummary?.nextUnitSlug ?? path.featuredUnit.slug;

            return (
              <PathCard
                key={path.id}
                path={path}
                progressSummary={progressSummary}
                href={`/studio/${studioTarget}`}
              />
            );
          })}
        </section>
      </main>
    </LearnerShell>
  );
}
