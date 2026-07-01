export default function MapControlPanel({ controls, onChange }) {
  const update = (key, val) => onChange(prev => ({ ...prev, [key]: val }))

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 260,
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 4,
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      zIndex: 5,
    }}>
      <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--color-border)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
        Map Controls
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Year */}
        <div className="control-group">
          <div className="control-label">Year</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[2024, 2025].map(y => (
              <button
                key={y}
                onClick={() => update('year', y)}
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid',
                  borderColor: controls.year === y ? 'var(--color-accent-alt)' : 'var(--color-border)',
                  borderRadius: 3,
                  background: controls.year === y ? 'var(--color-accent-alt)' : 'var(--color-bg-primary)',
                  color: controls.year === y ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >{y}</button>
            ))}
          </div>
        </div>

        {/* Crime category */}
        <div className="control-group">
          <div className="control-label">Crime Category</div>
          <select className="control-select" value={controls.category} onChange={e => update('category', e.target.value)} style={{ width: '100%' }}>
            <option value="all">All Categories</option>
            <option value="ipc">IPC Offences</option>
            <option value="theft">Theft & Burglary</option>
            <option value="violent">Assault & Grievous Hurt</option>
            <option value="cyber">Cybercrime</option>
            <option value="drug">Drug-Related Offences</option>
          </select>
        </div>

        {/* Metric */}
        <div className="control-group">
          <div className="control-label">Display Metric</div>
          <select className="control-select" value={controls.metric} onChange={e => update('metric', e.target.value)} style={{ width: '100%' }}>
            <option value="crimeCount">Crime Volume</option>
            <option value="crimeRate">Crime Rate (per 100k)</option>
            <option value="riskScore">Risk Score</option>
            <option value="change">YoY Growth %</option>
          </select>
        </div>

        {/* Layer toggles */}
        <div className="control-group">
          <div className="control-label">Layers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'showStations', label: 'Police Stations' },
              { key: 'showHotspots', label: 'Hotspot Markers' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={controls[key]}
                  onChange={e => update(key, e.target.checked)}
                  style={{ accentColor: 'var(--color-accent-alt)' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
