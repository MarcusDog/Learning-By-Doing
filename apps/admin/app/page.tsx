import {
  seedContentAction,
  updatePromptTemplateAction,
  updatePublishingCheckAction,
  updateUnitStatusAction,
} from "./actions";
import { getAdminContentOpsData } from "../lib/admin-data";

export const dynamic = "force-dynamic";

const audienceLabels = {
  beginner_first: "新手优先",
  intermediate: "进阶",
  advanced: "高级",
} as const;

const statusLabels = {
  published: "已发布",
  draft: "草稿",
  review: "待审核",
  archived: "已归档",
  ready: "可用",
  placeholder: "占位",
} as const;

const visualizationLabels = {
  "variable-state": "变量状态",
  "control-flow": "控制流",
  "call-stack": "调用栈",
  "data-structure": "数据结构",
  "algorithm-flow": "算法流程",
  "tensor-shape": "张量形状",
} as const;

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function MetricCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "cool" | "warm" | "bright" | "neutral";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [rawSearchParams, data] = await Promise.all([
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
    getAdminContentOpsData(),
  ]);
  const seededParam = rawSearchParams.seeded;
  const messageParam = rawSearchParams.message;
  const seededCount = Array.isArray(seededParam) ? seededParam[0] : seededParam;
  const message = Array.isArray(messageParam) ? messageParam[0] : messageParam;

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="hero-copy">
          <p className="label">CONTENT OPS</p>
          <h1>内容工厂</h1>
          <p className="lead">
            用统一后台查看课程库存、补种示例内容，并把提示词模板和发布检查放在同一块工作台里。
          </p>
        </div>
        <aside className="status-card">
          <span>当前状态</span>
          <strong>
            {data.dashboard.pendingReviews > 0 ? "有待审核内容" : "可以继续扩充内容"}
          </strong>
          <p>
            当前共有 {data.dashboard.publishedUnits} 个已发布单元，草稿 {data.dashboard.draftUnits} 个。
          </p>
        </aside>
      </section>

      {seededCount ? (
        <section className="flash-card" aria-live="polite">
          已重新补种 {seededCount} 个示例内容单元，列表已刷新。
        </section>
      ) : null}

      {!seededCount && message ? (
        <section className="flash-card" aria-live="polite">
          {message}
        </section>
      ) : null}

      <section className="metric-grid">
        <MetricCard value={data.dashboard.publishedUnits} label="已发布单元" tone="cool" />
        <MetricCard value={data.dashboard.draftUnits} label="草稿单元" tone="warm" />
        <MetricCard value={data.dashboard.pendingReviews} label="待审核" tone="bright" />
        <MetricCard value={data.dashboard.aiPromptSets} label="提示词集合" tone="neutral" />
      </section>

      <section className="summary-strip">
        <span>覆盖 {data.dashboard.totalPaths} 条学习路径</span>
        <span>{data.dashboard.totalPracticeTasks} 个练习任务</span>
        <span>{data.dashboard.totalAcceptanceCriteria} 条验收标准</span>
      </section>

      <section className="admin-grid">
        <article className="panel-card">
          <div className="panel-head">
            <div>
              <p className="section-kicker">CONTENT INVENTORY</p>
              <h2>课程单元列表</h2>
            </div>
            <form action={seedContentAction}>
              <button type="submit" className="primary-button">
                补种示例内容
              </button>
            </form>
          </div>

          <div className="unit-list">
            {data.units.map((unit) => (
              <article key={unit.slug} className="unit-row">
                <div className="unit-main">
                  <div className="unit-heading">
                    <h3>{unit.title}</h3>
                    <span className={`badge badge-${unit.contentStatus}`}>
                      {statusLabels[unit.contentStatus]}
                    </span>
                  </div>
                  <p>{unit.learningGoal}</p>
                  <div className="tag-row">
                    <span>{audienceLabels[unit.audienceLevel]}</span>
                    <span>{visualizationLabels[unit.visualizationKind]}</span>
                    <span>{unit.practiceTaskCount} 个练习任务</span>
                    <span>{unit.acceptanceCriteriaCount} 条验收标准</span>
                  </div>
                  <form action={updateUnitStatusAction} className="edit-form inline-edit-form">
                    <input type="hidden" name="slug" value={unit.slug} />
                    <label>
                      <span>工作流状态</span>
                      <select name="contentStatus" defaultValue={unit.contentStatus}>
                        <option value="draft">草稿</option>
                        <option value="review">待审核</option>
                        <option value="published">已发布</option>
                        <option value="archived">已归档</option>
                      </select>
                    </label>
                    <button type="submit" className="secondary-button">
                      保存状态
                    </button>
                  </form>
                </div>
                <div className="unit-meta">
                  <span className="meta-label">Slug</span>
                  <strong>{unit.slug}</strong>
                  <span className="meta-label">所属路径</span>
                  <p>{unit.pathTitles.join(" / ")}</p>
                  <span className="meta-label">前置知识</span>
                  <p>{unit.prerequisiteCount} 项</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <div className="sidebar-stack">
          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">PROMPTS</p>
                <h2>提示词模板占位</h2>
              </div>
            </div>
            <div className="stack-list">
              {data.promptTemplates.map((template) => (
                <article key={template.id} className="stack-card">
                  <div className="unit-heading">
                    <h3>{template.title}</h3>
                    <span className={`badge badge-${template.status}`}>
                      {statusLabels[template.status]}
                    </span>
                  </div>
                  <p>{template.description}</p>
                  <div className="tag-row">
                    <span>{template.scope}</span>
                    <span>{template.appliesToUnitSlugs.length} 个关联单元</span>
                  </div>
                  <form action={updatePromptTemplateAction} className="edit-form stacked-edit-form">
                    <input type="hidden" name="templateId" value={template.id} />
                    <label>
                      <span>模板状态</span>
                      <select name="status" defaultValue={template.status}>
                        <option value="placeholder">占位</option>
                        <option value="ready">可用</option>
                      </select>
                    </label>
                    <label>
                      <span>模板说明</span>
                      <textarea name="description" rows={3} defaultValue={template.description} />
                    </label>
                    <label>
                      <span>关联单元 Slug</span>
                      <input
                        name="appliesToUnitSlugs"
                        defaultValue={template.appliesToUnitSlugs.join(", ")}
                      />
                    </label>
                    <button type="submit" className="secondary-button">
                      保存模板
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">CHECKS</p>
                <h2>发布配置占位</h2>
              </div>
            </div>
            <div className="stack-list">
              {data.publishingChecks.map((check) => (
                <article key={check.key} className="stack-card">
                  <h3>{check.label}</h3>
                  <p>{check.description}</p>
                  <div className="tag-row">
                    <span>{check.required ? "必检" : "可选"}</span>
                    <span>{check.enabled ? "已启用" : "未启用"}</span>
                  </div>
                  <form action={updatePublishingCheckAction} className="edit-form toggle-form">
                    <input type="hidden" name="checkKey" value={check.key} />
                    <label className="checkbox-field">
                      <input type="checkbox" name="required" defaultChecked={check.required} />
                      <span>必检</span>
                    </label>
                    <label className="checkbox-field">
                      <input type="checkbox" name="enabled" defaultChecked={check.enabled} />
                      <span>启用</span>
                    </label>
                    <button type="submit" className="secondary-button">
                      保存检查项
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
