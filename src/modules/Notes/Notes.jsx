export default function Notes() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Officer Notes</h1>
        <p className="page-subtitle">Your private tactical notes and field observations.</p>
      </div>
      <div className="card">
        <div className="card-body">
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Notes will be integrated with Catalyst Data Store in Phase 3.
          </div>
        </div>
      </div>
    </div>
  )
}
