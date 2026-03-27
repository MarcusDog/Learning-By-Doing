function LoadingCard({ className = "" }: { className?: string }) {
  return <div className={`loading-card ${className}`.trim()} aria-hidden="true" />;
}

export default function Loading() {
  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <LoadingCard className="hero-copy loading-tall" />
        <LoadingCard className="status-card loading-short" />
      </section>

      <section className="metric-grid">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </section>

      <section className="admin-workbench">
        <div className="workbench-main">
          <LoadingCard className="panel-card loading-panel" />
          <LoadingCard className="panel-card loading-panel" />
        </div>
        <aside className="sidebar-stack">
          <LoadingCard className="panel-card loading-panel" />
          <LoadingCard className="panel-card loading-panel" />
          <LoadingCard className="panel-card loading-panel" />
        </aside>
      </section>
    </main>
  );
}
