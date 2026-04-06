export default function Loading() {
  return (
    <div className="page-flow">
      <section className="content-section">
        <div className="page-header">
          <div>
            <h1 className="page-title">Captura</h1>
            <p className="muted">Cargando flujo de captura...</p>
          </div>
        </div>
        <div className="card" style={{ minHeight: 360 }}>
          <div className="skeleton-block" />
          <div className="skeleton-block" />
          <div className="skeleton-block" />
        </div>
      </section>
    </div>
  );
}

