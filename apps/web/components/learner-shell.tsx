import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import type {
  LearnerProgressSnapshot,
  LearnerSummary,
  LessonPathNavigationItem,
} from "../lib/learning-data";

type LearnerShellProps = {
  activeHref: string;
  navigationPaths: LessonPathNavigationItem[];
  learnerSummary: LearnerSummary | null;
  progressSnapshot?: LearnerProgressSnapshot | null;
  chromeMode?: "full" | "compact";
  children: ReactNode;
};

function isActiveLink(activeHref: string, href: string) {
  if (href === "/") {
    return activeHref === "/";
  }
  return activeHref === href || activeHref.startsWith(`${href}/`);
}

function formatPlan(plan: LearnerSummary["plan"]) {
  return plan === "pro" ? "Pro 计划" : "免费计划";
}

function formatLearnerLabel(learnerSummary: LearnerSummary) {
  if (learnerSummary.email.startsWith("guest-")) {
    return "访客学习者";
  }
  return learnerSummary.email;
}

export function LearnerShell({
  activeHref,
  navigationPaths,
  learnerSummary,
  progressSnapshot,
  chromeMode = "full",
  children,
}: LearnerShellProps) {
  return (
    <>
      <header className="page-shell shell-chrome">
        <div className="shell-topbar">
          <Link className="brand-link" href={"/" as Route}>
            <span className="brand-mark">边做边学</span>
            <span className="brand-copy">从 lesson 到 studio 的连续学习流</span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link
              className={isActiveLink(activeHref, "/") ? "site-nav-link active" : "site-nav-link"}
              href={"/" as Route}
            >
              首页
            </Link>
            {navigationPaths.map((path) => {
              const href = `/learn/${path.id}`;
              return (
                <Link
                  className={isActiveLink(activeHref, href) ? "site-nav-link active" : "site-nav-link"}
                  href={href as Route}
                  key={path.id}
                >
                  {path.title}
                </Link>
              );
            })}
            <Link
              className={isActiveLink(activeHref, "/studio") ? "site-nav-link active" : "site-nav-link"}
              href={"/studio" as Route}
            >
              学习工作台
            </Link>
          </nav>
        </div>

        {chromeMode === "compact" ? (
          <section className="session-card session-card-compact">
            <div className="session-copy compact-session-copy">
              {learnerSummary ? (
                <>
                  <div>
                    <p className="eyebrow">CURRENT LEARNER</p>
                    <h2>{learnerSummary.name}</h2>
                    <p className="session-lede">
                      {formatLearnerLabel(learnerSummary)} · {formatPlan(learnerSummary.plan)}
                    </p>
                  </div>
                  <div className="metric-row">
                    <span className="metric-pill">
                      已完成 {learnerSummary.completedUnitCount} 节
                    </span>
                    <span className="metric-pill">
                      连续学习 {learnerSummary.streakDays} 天
                    </span>
                    {progressSnapshot ? (
                      <span className="metric-pill">
                        进行中 {progressSnapshot.inProgressUnits} 节
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="eyebrow">CURRENT LEARNER</p>
                    <h2>访客学习会话</h2>
                    <p className="session-lede">刷新页面会重新建立 studio 会话。</p>
                  </div>
                  <div className="actions compact-actions">
                    <Link className="primary" href={"/studio" as Route}>
                      进入工作台
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="session-card">
            <div className="session-copy">
              <p className="eyebrow">CURRENT LEARNER</p>
              {learnerSummary ? (
                <>
                  <h2>{learnerSummary.name}</h2>
                  <p className="session-lede">
                    {formatLearnerLabel(learnerSummary)} · {formatPlan(learnerSummary.plan)}
                  </p>
                  <div className="metric-row">
                    <span className="metric-pill">
                      已完成 {learnerSummary.completedUnitCount} 节 lesson
                    </span>
                    <span className="metric-pill">
                      连续学习 {learnerSummary.streakDays} 天
                    </span>
                    {progressSnapshot ? (
                      <>
                        <span className="metric-pill">
                          进行中 {progressSnapshot.inProgressUnits} 节
                        </span>
                        <span className="metric-pill">
                          待开始 {progressSnapshot.notStartedUnits} 节
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="session-recent">
                    最近动作：{learnerSummary.recentActivity.join(" · ") || "刚创建学习会话"}
                  </p>
                  {progressSnapshot ? (
                    <div className="session-path-strip">
                      {progressSnapshot.pathSummaries.map((pathSummary) => (
                        <Link
                          className="session-path-pill"
                          href={`/learn/${pathSummary.pathId}` as Route}
                          key={pathSummary.pathId}
                        >
                          <strong>{pathSummary.pathTitle}</strong>
                          <span>{pathSummary.completedUnits}/{pathSummary.totalUnits} 完成</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <h2>还没有保存中的学习身份</h2>
                  <p className="session-lede">
                    第一次进入 studio 会自动创建一个访客学习会话，之后你的当前用户和学习进度会在所有 learner 页面里显示出来。
                  </p>
                  <div className="actions">
                    <Link className="primary" href={"/studio" as Route}>
                      进入学习工作台
                    </Link>
                    <Link className="secondary" href={"/learn/python-foundations" as Route}>
                      从 Python 路径开始
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </header>

      {children}
    </>
  );
}
