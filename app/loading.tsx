export default function Loading() {
  return (
    <div className="page-flow">
      <section className="content-section">
        <div className="page-header">
          <div>
            <h1 className="page-title">Bitacora Ecosat</h1>
            <p className="muted">Cargando...</p>
          </div>
        </div>
        <div className="card" style={{ minHeight: 240 }}>
          <div className="skeleton-block" />
          <div className="skeleton-block" />
        </div>
      </section>
    </div>
  );
}

