import Link from "next/link";
import type { Route } from "next";

import { PathCard } from "../components/path-card";
import { CodeBlock } from "../components/code-block";
import { listLessonPaths } from "../lib/learning-data";

export const dynamic = "force-dynamic";

const steps = [
  "看懂一段示例",
  "运行一段代码",
  "选中片段问 AI",
  "完成一个练习"
];

export default async function HomePage() {
  const paths = await listLessonPaths();
  const totalPracticeTasks = paths.reduce(
    (total, path) => total + path.units.reduce((pathTotal, unit) => pathTotal + unit.practiceTasks.length, 0),
    0,
  );

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">LEARN BY DOING</p>
          <h1>边做边学</h1>
          <p className="lede">
            面向零基础小白的交互式学习平台，把代码、可视化、练习和
            AI 解释放在同一条学习路径里。
          </p>
          <div className="hero-stat-grid">
            <div className="hero-stat">
              <strong>{paths.length}</strong>
              <span>当前学习路径</span>
            </div>
            <div className="hero-stat">
              <strong>{totalPracticeTasks}</strong>
              <span>可立即上手练习</span>
            </div>
            <div className="hero-stat">
              <strong>1</strong>
              <span>个 unit 对应一页 studio</span>
            </div>
          </div>
          <div className="actions">
            <Link className="primary" href={"/learn/python-foundations" as Route}>
              开始 Python 学习
            </Link>
            <Link className="secondary" href={"/studio" as Route}>
              进入学习工作台
            </Link>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="panel-header">今日学习路径</div>
          <ol className="step-list">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <CodeBlock
            label="当前默认示例"
            code={paths[0]?.featuredUnit.exampleCode ?? ""}
          />
        </aside>
      </section>

      <section className="section-intro">
        <p className="eyebrow">PHASE 1 WEB FLOW</p>
        <h2>一条路径，四个连续动作</h2>
          <p>
          首页先选路径，然后进入 lesson 页面理解目标和示例，再去 studio
          看运行结果、进度记录和 AI 解释。当前页面直接读取 live API，
          前端只保留视图模型归一化这一层。
          </p>
      </section>

      <section className="path-grid">
        {paths.map((path) => (
          <PathCard key={path.id} path={path} />
        ))}
      </section>
    </main>
  );
}
