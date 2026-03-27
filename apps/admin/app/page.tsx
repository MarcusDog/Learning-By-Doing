import {
  archiveUnitAction,
  createUnitAction,
  moveUnitBackToDraftAction,
  publishUnitAction,
  queueUnitForReviewAction,
  saveUnitReviewAction,
  seedContentAction,
  updatePromptTemplateAction,
  updatePublishingCheckAction,
} from "./actions";
import { getAdminContentOpsData } from "../lib/admin-data";
import { getCustomDraftUnits, getOriginBadgeLabel } from "../lib/admin-presentation";

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

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [rawSearchParams, data] = await Promise.all([
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
    getAdminContentOpsData(),
  ]);

  const seededCount = getQueryValue(rawSearchParams, "seeded");
  const message = getQueryValue(rawSearchParams, "message");
  const flashStatus = getQueryValue(rawSearchParams, "status") === "error" ? "error" : "success";

  const reviewQueue = data.units.filter((unit) => unit.contentStatus === "review");
  const customDraftUnits = getCustomDraftUnits(data.units);
  const requiredReviewChecks = data.publishingChecks.filter(
    (check) => check.enabled && check.required,
  );
  const inventory = [...data.units].sort((left, right) => {
    if (left.contentStatus === right.contentStatus) {
      return left.title.localeCompare(right.title, "zh-Hans-CN");
    }
    if (left.contentStatus === "review") return -1;
    if (right.contentStatus === "review") return 1;
    return left.title.localeCompare(right.title, "zh-Hans-CN");
  });

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="hero-copy">
          <p className="label">CONTENT OPS</p>
          <h1>内容工厂</h1>
          <p className="lead">
            先创建一个单元壳子，再把它送进审核队列。审核通过后才能发布，所有阻塞项都会直接展示在工作台里。
          </p>
        </div>
        <aside className="status-card">
          <span>当前状态</span>
          <strong>
            {reviewQueue.length > 0 ? `有 ${reviewQueue.length} 个单元待审核` : "审核队列已清空"}
          </strong>
          <p>
            自建草稿 {customDraftUnits.length} 个，已发布 {data.dashboard.publishedUnits} 个，下一步应优先清掉审核队列。
          </p>
        </aside>
      </section>

      {seededCount ? (
        <section className="flash-card flash-success" aria-live="polite">
          已重新补种 {seededCount} 个示例内容单元，列表已刷新。
        </section>
      ) : null}

      {!seededCount && message ? (
        <section className={`flash-card ${flashStatus === "error" ? "flash-error" : "flash-success"}`} aria-live="polite">
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

      <section className="admin-workbench">
        <div className="workbench-main">
          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">REVIEW QUEUE</p>
                <h2>审核队列</h2>
              </div>
              <form action={seedContentAction}>
                <button type="submit" className="secondary-button">
                  补种示例内容
                </button>
              </form>
            </div>

            {reviewQueue.length === 0 ? (
              <EmptyState
                title="暂时没有待审核单元"
                description="先在右侧创建一个草稿，或把库存里的草稿送进审核队列。"
              />
            ) : (
              <div className="review-queue">
                {reviewQueue.map((unit) => (
                  <article key={unit.slug} className="review-card">
                    <div className="review-card-head">
                      <div>
                        <div className="unit-heading">
                          <h3>{unit.title}</h3>
                          <span className={`badge badge-${unit.contentStatus}`}>
                            {statusLabels[unit.contentStatus]}
                          </span>
                          <span className={`badge badge-${unit.origin}`}>
                            {getOriginBadgeLabel(unit.origin)}
                          </span>
                        </div>
                        <p>{unit.learningGoal}</p>
                      </div>
                      <div className="tag-row">
                        <span>{unit.pathTitles.join(" / ")}</span>
                        <span>{audienceLabels[unit.audienceLevel]}</span>
                        <span>{visualizationLabels[unit.visualizationKind]}</span>
                      </div>
                    </div>

                    <div className="review-grid">
                      <form action={saveUnitReviewAction} className="stacked-edit-form">
                        <input type="hidden" name="slug" value={unit.slug} />
                        <label>
                          <span>审核说明</span>
                          <textarea
                            name="reviewNotes"
                            rows={4}
                            defaultValue={unit.reviewNotes ?? ""}
                            placeholder="写下这个单元已经完成了什么、还有什么风险。"
                          />
                        </label>
                        <div className="checklist-grid">
                          {requiredReviewChecks.map((check) => (
                            <label key={`${unit.slug}-${check.key}`} className="checkbox-field">
                              <input
                                type="checkbox"
                                name="reviewedCheckKeys"
                                value={check.key}
                                defaultChecked={unit.reviewedCheckKeys.includes(check.key)}
                              />
                              <span>{check.label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="action-row">
                          <button type="submit" className="secondary-button">
                            保存审核
                          </button>
                          <button
                            type="submit"
                            formAction={publishUnitAction}
                            className="primary-button"
                            disabled={!unit.readyToPublish}
                          >
                            发布单元
                          </button>
                          <button
                            type="submit"
                            formAction={moveUnitBackToDraftAction}
                            className="ghost-button"
                          >
                            退回草稿
                          </button>
                        </div>
                      </form>

                      <aside className="review-sidecard">
                        <h4>发布阻塞项</h4>
                        {unit.publishBlockers.length === 0 ? (
                          <p className="ready-copy">所有必检项都已完成，可以直接发布。</p>
                        ) : (
                          <ul className="blocker-list">
                            {unit.publishBlockers.map((blocker) => (
                              <li key={blocker}>{blocker}</li>
                            ))}
                          </ul>
                        )}
                      </aside>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">UNIT INVENTORY</p>
                <h2>课程单元库存</h2>
              </div>
            </div>

            {inventory.length === 0 ? (
              <EmptyState title="当前没有可管理单元" description="先补种示例内容，或创建第一个自建草稿。" />
            ) : (
              <div className="unit-list">
                {inventory.map((unit) => (
                  <article key={unit.slug} className="unit-row">
                    <div className="unit-main">
                      <div className="unit-heading">
                        <h3>{unit.title}</h3>
                        <span className={`badge badge-${unit.contentStatus}`}>
                          {statusLabels[unit.contentStatus]}
                        </span>
                        <span className={`badge badge-${unit.origin}`}>
                          {getOriginBadgeLabel(unit.origin)}
                        </span>
                      </div>
                      <p>{unit.learningGoal}</p>
                      <div className="tag-row">
                        <span>{audienceLabels[unit.audienceLevel]}</span>
                        <span>{visualizationLabels[unit.visualizationKind]}</span>
                        <span>{unit.pathTitles.join(" / ")}</span>
                        <span>{unit.practiceTaskCount} 个练习任务</span>
                        <span>{unit.acceptanceCriteriaCount} 条验收标准</span>
                      </div>
                      <div className="inventory-actions">
                        {unit.contentStatus === "draft" ? (
                          <form action={queueUnitForReviewAction}>
                            <input type="hidden" name="slug" value={unit.slug} />
                            <button type="submit" className="secondary-button">
                              送入审核
                            </button>
                          </form>
                        ) : null}
                        {unit.contentStatus === "published" ? (
                          <form action={archiveUnitAction}>
                            <input type="hidden" name="slug" value={unit.slug} />
                            <button type="submit" className="ghost-button">
                              归档
                            </button>
                          </form>
                        ) : null}
                        {unit.contentStatus === "archived" ? (
                          <form action={moveUnitBackToDraftAction}>
                            <input type="hidden" name="slug" value={unit.slug} />
                            <button type="submit" className="ghost-button">
                              回到草稿
                            </button>
                          </form>
                        ) : null}
                        {unit.contentStatus === "review" ? (
                          <span className="queue-note">请在上方审核队列中完成审核和发布。</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="unit-meta">
                      <span className="meta-label">Slug</span>
                      <strong>{unit.slug}</strong>
                      <span className="meta-label">审核情况</span>
                      <p>{unit.readyToPublish ? "可以发布" : `${unit.publishBlockers.length} 个阻塞项`}</p>
                      <span className="meta-label">审核说明</span>
                      <p>{unit.reviewNotes ?? "还没有留下审核说明。"}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>

        <aside className="sidebar-stack">
          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">CREATE</p>
                <h2>创建新草稿</h2>
              </div>
            </div>
            <form action={createUnitAction} className="stacked-edit-form">
              <label>
                <span>单元标题</span>
                <input name="title" placeholder="例如：从零理解数据包" />
              </label>
              <label>
                <span>Slug</span>
                <input name="slug" placeholder="network-packets-intro" />
              </label>
              <label>
                <span>所属路径</span>
                <select name="pathId" defaultValue={data.paths[0]?.id}>
                  {data.paths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>受众难度</span>
                <select name="audienceLevel" defaultValue="beginner_first">
                  <option value="beginner_first">新手优先</option>
                  <option value="intermediate">进阶</option>
                  <option value="advanced">高级</option>
                </select>
              </label>
              <label>
                <span>可视化类型</span>
                <select name="visualizationKind" defaultValue="control-flow">
                  {Object.entries(visualizationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>学习目标</span>
                <textarea
                  name="learningGoal"
                  rows={4}
                  placeholder="用一句话说明这个单元要让学习者真正学会什么。"
                />
              </label>
              <button type="submit" className="primary-button">
                创建草稿
              </button>
            </form>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">CUSTOM DRAFTS</p>
                <h2>自建草稿列表</h2>
              </div>
            </div>
            {customDraftUnits.length === 0 ? (
              <EmptyState
                title="还没有自建草稿"
                description="创建后会先留在草稿区，送审后才会进入审核队列。"
              />
            ) : (
              <div className="stack-list">
                {customDraftUnits.map((unit) => (
                  <article key={unit.slug} className="stack-card">
                    <div className="unit-heading">
                      <h3>{unit.title}</h3>
                      <span className={`badge badge-${unit.contentStatus}`}>
                        {statusLabels[unit.contentStatus]}
                      </span>
                    </div>
                    <p>{unit.learningGoal}</p>
                    <div className="tag-row">
                      <span>{unit.pathTitles.join(" / ")}</span>
                      <span>{unit.readyToPublish ? "可以发布" : "待补审核"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">PROMPTS</p>
                <h2>提示词模板</h2>
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
                  <form action={updatePromptTemplateAction} className="stacked-edit-form">
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
                <h2>发布检查</h2>
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
                  <form action={updatePublishingCheckAction} className="toggle-form">
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
        </aside>
      </section>
    </main>
  );
}
