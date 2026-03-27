"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="admin-shell">
      <section className="panel-card route-error-card">
        <p className="section-kicker">LOAD ERROR</p>
        <h1>后台工作台暂时不可用</h1>
        <p className="lead">
          {error.message || "内容运营数据加载失败，请稍后重试。"}
        </p>
        <button type="button" className="primary-button" onClick={() => reset()}>
          重新加载
        </button>
      </section>
    </main>
  );
}
