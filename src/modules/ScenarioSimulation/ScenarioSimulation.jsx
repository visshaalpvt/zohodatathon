import { useState, useMemo } from 'react'
import { districtStats, hotspots, forecasts } from '../../data/dataLayer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CRIME_KEYS = [
  { key: 'murder', label: 'Murder' },
  { key: 'rape', label: 'Rape' },
  { key: 'theft', label: 'Theft' },
  { key: 'cyberCrime', label: 'Cyber Crime' },
  { key: 'robbery', label: 'Robbery' },
  { key: 'pocso', label: 'POCSO' },
  { key: 'scst', label: 'SC/ST' },
  { key: 'molestation', label: 'Molestation' },
  { key: 'riots', label: 'Riots' },
  { key: 'burglaryNight', label: 'Burglary' },
]

function fmt(n) { return typeof n === 'number' ? n.toLocaleString('en-IN') : String(n) }

function _mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function _std(arr) {
  const m = _mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1))
}

function computeSimulation(baseStats, multipliers) {
  // Apply multipliers to create simulated district data
  const simulated = baseStats.map(d => {
    const sim = { ...d }
    for (const { key } of CRIME_KEYS) {
      const mult = multipliers[key] || 0
      sim[key] = Math.max(0, Math.round(d[key] * (1 + mult / 100)))
    }
    // Recompute total
    sim.total = CRIME_KEYS.reduce((s, { key }) => s + (sim[key] || 0), 0) +
      (sim.attemptToMurder || 0) + (sim.dacoity || 0) + (sim.burglaryDay || 0) +
      (sim.casesOfHurt || 0) + (sim.crueltyByHusband || 0) + (sim.dowryDeaths || 0) +
      (sim.fatalAccidents || 0) + (sim.nonFatalAccidents || 0) + (sim.gambling || 0) + (sim.dpAct || 0) + (sim.pocsoRape || 0)

    // Recompute severity
    sim.severityWeight = sim.murder * 10 + sim.rape * 8 + sim.pocso * 8 + (sim.dowryDeaths || 0) * 7 +
      (sim.dacoity || 0) * 6 + sim.scst * 5 + sim.robbery * 4 + sim.molestation * 4 +
      (sim.crueltyByHusband || 0) * 3 + ((sim.burglaryDay || 0) + (sim.burglaryNight || 0)) * 2 +
      sim.cyberCrime * 2 + sim.theft + sim.riots * 3

    return sim
  })

  // Compute simulated hotspot scores
  const tots = simulated.map(d => d.total)
  const sevs = simulated.map(d => d.severityWeight)
  const mt = _mean(tots), st = _std(tots)
  const ms = _mean(sevs), ss = _std(sevs)

  return simulated.map(d => {
    const zt = st > 0 ? (d.total - mt) / st : 0
    const zs = ss > 0 ? (d.severityWeight - ms) / ss : 0
    const raw = zt * 0.4 + zs * 0.6
    const score = Math.round(Math.max(0, Math.min(100, ((raw + 3) / 6) * 100)))
    return {
      ...d,
      hotspotScore: score,
      severityLevel: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'moderate' : 'low',
    }
  }).sort((a, b) => b.hotspotScore - a.hotspotScore)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '8px 12px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: p.color }}>{p.name}: {fmt(p.value)}</div>
      ))}
    </div>
  )
}

export default function ScenarioSimulation() {
  const [multipliers, setMultipliers] = useState(() => {
    const init = {}
    CRIME_KEYS.forEach(({ key }) => { init[key] = 0 })
    return init
  })

  const baseStats = districtStats
  const simulated = useMemo(() => computeSimulation(baseStats, multipliers), [baseStats, multipliers])

  const updateMultiplier = (key, value) => {
    setMultipliers(prev => ({ ...prev, [key]: value }))
  }

  const resetAll = () => {
    const init = {}
    CRIME_KEYS.forEach(({ key }) => { init[key] = 0 })
    setMultipliers(init)
  }

  // Compute deltas
  const baseTotal = baseStats.reduce((s, d) => s + d.total, 0)
  const simTotal = simulated.reduce((s, d) => s + d.total, 0)
  const totalDelta = simTotal - baseTotal
  const baseCritical = hotspots.filter(h => h.severityLevel === 'critical').length
  const simCritical = simulated.filter(s => s.severityLevel === 'critical').length

  // Top 10 comparison
  const top10 = simulated.slice(0, 10).map(s => {
    const base = hotspots.find(h => h.csvName === s.csvName)
    return {
      name: s.csvName,
      baseline: base?.hotspotScore || 0,
      simulated: s.hotspotScore,
    }
  })

  return (
    <div className="page-content" style={{ height: 'calc(100vh - var(--topbar-height))', overflow: 'auto' }}>
      <div className="page-header">
        <h1 className="page-title">Scenario Simulation</h1>
        <p className="page-subtitle">Adjust crime category parameters to project impact on risk scores and resource deployment</p>
      </div>

      <div className="sim-warning">
        ⚠ Simulated Projection — Not Real Data. For planning purposes only.
      </div>

      <div className="sim-container" style={{ marginTop: 16 }}>
        {/* Left: Sliders */}
        <div className="card" style={{ overflow: 'auto' }}>
          <div className="card-header">
            <span className="card-title">Parameter Adjustments</span>
            <button className="dp-back-btn" onClick={resetAll} style={{ fontSize: 11 }}>Reset All</button>
          </div>
          <div className="card-body">
            {CRIME_KEYS.map(({ key, label }) => (
              <div key={key} className="sim-slider-group">
                <div className="sim-slider-label">
                  <span>{label}</span>
                  <span style={{
                    fontFamily: 'var(--font-data)', fontWeight: 600,
                    color: multipliers[key] > 0 ? 'var(--color-alert-high)' : multipliers[key] < 0 ? 'var(--color-alert-low)' : 'var(--color-text-muted)',
                  }}>
                    {multipliers[key] > 0 ? '+' : ''}{multipliers[key]}%
                  </span>
                </div>
                <input type="range" className="sim-slider" min={-50} max={50} step={5}
                  value={multipliers[key]} onChange={e => updateMultiplier(key, parseInt(e.target.value))} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
          {/* Impact Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="dp-metric-card">
              <div className="dp-metric-label">Total Crime Delta</div>
              <div className={`dp-metric-value ${totalDelta > 0 ? 'sim-delta-positive' : totalDelta < 0 ? 'sim-delta-negative' : ''}`} style={{ fontSize: 22 }}>
                {totalDelta > 0 ? '+' : ''}{fmt(totalDelta)}
              </div>
            </div>
            <div className="dp-metric-card">
              <div className="dp-metric-label">Critical Districts</div>
              <div className="dp-metric-value" style={{ fontSize: 22, color: simCritical > baseCritical ? 'var(--color-alert-high)' : 'var(--color-alert-low)' }}>
                {baseCritical} → {simCritical}
              </div>
            </div>
            <div className="dp-metric-card">
              <div className="dp-metric-label">Simulated Total</div>
              <div className="dp-metric-value" style={{ fontSize: 22 }}>{fmt(simTotal)}</div>
            </div>
          </div>

          {/* Top 10 Chart */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Top 10 Districts — Risk Score Comparison</span>
              <span className="card-meta">Baseline vs Simulated</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={95} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="baseline" fill="var(--color-text-muted)" name="Baseline" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="simulated" fill="var(--color-accent-alt)" name="Simulated" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simulated Rankings */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Simulated District Rankings</span>
            </div>
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>DISTRICT</th>
                    <th>SCORE</th>
                    <th>SEVERITY</th>
                    <th>DELTA</th>
                  </tr>
                </thead>
                <tbody>
                  {simulated.slice(0, 15).map((s, i) => {
                    const base = hotspots.find(h => h.csvName === s.csvName)
                    const delta = s.hotspotScore - (base?.hotspotScore || 0)
                    return (
                      <tr key={s.csvName}>
                        <td className="table-mono" style={{ fontWeight: 700 }}>#{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{s.csvName}</td>
                        <td className="table-mono">{s.hotspotScore}/100</td>
                        <td><span className={`status-dot ${s.severityLevel}`}>{s.severityLevel.toUpperCase()}</span></td>
                        <td className={`table-mono ${delta > 0 ? 'sim-delta-positive' : delta < 0 ? 'sim-delta-negative' : ''}`}>
                          {delta > 0 ? '+' : ''}{delta}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
