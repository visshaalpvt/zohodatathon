import { useState, useMemo } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import Badge from '../../components/shared/Badge'

const CRIME_FIELDS = [
  { key: 'total',            label: 'Total Crimes' },
  { key: 'murder',           label: 'Murder' },
  { key: 'attemptToMurder',  label: 'Attempt to Murder' },
  { key: 'rape',             label: 'Rape' },
  { key: 'dacoity',          label: 'Dacoity' },
  { key: 'robbery',          label: 'Robbery' },
  { key: 'burglaryDay',      label: 'Burglary (Day)' },
  { key: 'burglaryNight',    label: 'Burglary (Night)' },
  { key: 'theft',            label: 'Theft' },
  { key: 'riots',            label: 'Riots' },
  { key: 'casesOfHurt',      label: 'Cases of Hurt' },
  { key: 'crueltyByHusband', label: 'Cruelty by Husband' },
  { key: 'dowryDeaths',      label: 'Dowry Deaths' },
  { key: 'fatalAccidents',   label: 'Fatal Accidents' },
  { key: 'molestation',      label: 'Molestation' },
  { key: 'scst',             label: 'SC/ST Crimes' },
  { key: 'cyberCrime',       label: 'Cyber Crime' },
  { key: 'pocso',            label: 'POCSO' },
  { key: 'pocsoRape',        label: 'POCSO Rape' },
]

export default function DistrictComparison() {
  const { districtStats, forecasts, hotspots } = useCrimeData()
  // Default to comparing the top 2 districts
  const [selected, setSelected] = useState(() => {
    return (districtStats || []).slice(0, 2).map(d => d.csvName)
  })

  const allDistricts = (districtStats || []).map(d => d.csvName)

  const handleAdd = (name) => {
    if (selected.length < 4 && !selected.includes(name)) {
      setSelected([...selected, name])
    }
  }

  const handleRemove = (name) => {
    setSelected(selected.filter(s => s !== name))
  }

  const handleChange = (idx, name) => {
    const newSel = [...selected]
    newSel[idx] = name
    setSelected(newSel)
  }

  // Get data for selected districts
  const compared = useMemo(() => {
    return selected.map(name => {
      const d = districtStats.find(ds => ds.csvName === name)
      const f = forecasts.find(fc => fc.district === name)
      const h = hotspots.find(hs => hs.csvName === name)
      return { ...d, forecast: f, hotspot: h }
    }).filter(Boolean)
  }, [selected])

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">District Comparison</h1>
        <p className="page-subtitle">Side-by-side analysis of up to 4 districts across all crime categories</p>
      </div>

      {/* District Selectors */}
      <div className="dc-selector-row">
        {selected.map((name, idx) => (
          <div key={idx} className="dc-selector">
            <select
              className="control-select dc-select"
              value={name}
              onChange={e => handleChange(idx, e.target.value)}
            >
              {allDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {selected.length > 2 && (
              <button className="dc-remove-btn" onClick={() => handleRemove(name)} title="Remove">×</button>
            )}
          </div>
        ))}
        {selected.length < 4 && (
          <button
            className="dc-add-btn"
            onClick={() => {
              const next = allDistricts.find(d => !selected.includes(d))
              if (next) handleAdd(next)
            }}
          >
            + Add District
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="dc-summary-row">
        {compared.map(d => (
          <div key={d.csvName} className="dc-summary-card">
            <div className="dc-summary-name">{d.csvName}</div>
            <div className="dc-summary-stat">
              <span className="dc-stat-value">{d.total?.toLocaleString('en-IN')}</span>
              <span className="dc-stat-label">Total Crimes</span>
            </div>
            <div className="dc-summary-badges">
              <Badge type={d.hotspot?.severityLevel === 'critical' ? 'critical' : d.hotspot?.severityLevel === 'high' ? 'warning' : 'success'}>
                {d.hotspot?.severityLevel?.toUpperCase() || 'N/A'}
              </Badge>
              {d.forecast && (
                <span className="dc-growth" style={{ color: d.forecast.growthRate > 0 ? 'var(--color-alert-high)' : 'var(--color-alert-low)' }}>
                  {d.forecast.growthRate > 0 ? '▲' : '▼'} {Math.abs(d.forecast.growthRate).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Crime Category Comparison</span>
          <span className="card-meta">Source: 2a1e057f — District-wise IPC 2024</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table dc-table">
            <thead>
              <tr>
                <th>CRIME CATEGORY</th>
                {compared.map(d => (
                  <th key={d.csvName}>{d.csvName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRIME_FIELDS.map(field => {
                const values = compared.map(d => d[field.key] || 0)
                const maxVal = Math.max(...values)
                return (
                  <tr key={field.key} className={field.key === 'total' ? 'dc-total-row' : ''}>
                    <td className="dc-field-label">{field.label}</td>
                    {compared.map((d, i) => {
                      const val = d[field.key] || 0
                      const isMax = val === maxVal && maxVal > 0
                      return (
                        <td key={d.csvName} className="table-mono" style={{
                          fontWeight: isMax ? 700 : 400,
                          color: isMax ? 'var(--color-alert-high)' : 'var(--color-text-primary)',
                          background: isMax ? 'rgba(220,38,38,0.06)' : 'transparent',
                        }}>
                          {val.toLocaleString('en-IN')}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast Comparison */}
      {compared.some(d => d.forecast) && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Forecast & Risk Comparison</span>
            <span className="card-meta">Projected 2025-2026 estimates</span>
          </div>
          <table className="data-table dc-table">
            <thead>
              <tr>
                <th>METRIC</th>
                {compared.map(d => (
                  <th key={d.csvName}>{d.csvName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Current 2024', key: d => d.forecast?.current2024 },
                { label: 'Projected 2025', key: d => d.forecast?.projected2025 },
                { label: 'Projected 2026', key: d => d.forecast?.projected2026 },
                { label: 'Growth Rate', key: d => d.forecast ? `${d.forecast.growthRate}%` : 'N/A' },
                { label: 'Hotspot Score', key: d => d.hotspot?.hotspotScore },
                { label: 'Confidence', key: d => d.forecast ? `${(d.forecast.confidence * 100).toFixed(0)}%` : 'N/A' },
              ].map(row => (
                <tr key={row.label}>
                  <td className="dc-field-label">{row.label}</td>
                  {compared.map(d => (
                    <td key={d.csvName} className="table-mono">
                      {typeof row.key(d) === 'number' ? row.key(d).toLocaleString('en-IN') : row.key(d) || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
