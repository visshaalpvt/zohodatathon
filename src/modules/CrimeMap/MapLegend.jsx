const METRIC_LABELS = {
  crimeCount: 'Crime Volume',
  crimeRate: 'Crime Rate /100k',
  riskScore: 'Risk Score',
  change: 'YoY Growth %',
}

export default function MapLegend({ metric }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 4,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-card)',
      minWidth: 200,
      zIndex: 5,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {METRIC_LABELS[metric] || 'Crime Volume'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>Low</span>
        <div style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: 'linear-gradient(to right, var(--color-alert-low), var(--color-alert-medium), var(--color-alert-high))',
        }} />
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>High</span>
      </div>
    </div>
  )
}
