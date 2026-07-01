import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { districtStats, hotspots, forecasts, geoStats, ipcCategories, sllCategories } from '../../data/dataLayer'
import { generateRecommendations, generateExplainableAI } from '../../data/recommendationEngine'
import ExplainableAI from '../../components/shared/ExplainableAI'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const WOMEN_FIELDS = ['rape', 'molestation', 'crueltyByHusband', 'dowryDeaths', 'pocso', 'pocsoRape']
const CHILD_FIELDS = ['pocso', 'pocsoRape']

const CATEGORY_KEYS = [
  { key: 'murder', label: 'Murder' },
  { key: 'attemptToMurder', label: 'Attempt to Murder' },
  { key: 'rape', label: 'Rape' },
  { key: 'robbery', label: 'Robbery' },
  { key: 'theft', label: 'Theft' },
  { key: 'cyberCrime', label: 'Cyber Crime' },
  { key: 'pocso', label: 'POCSO' },
  { key: 'scst', label: 'SC/ST' },
  { key: 'molestation', label: 'Molestation' },
  { key: 'crueltyByHusband', label: 'Cruelty by Husband' },
  { key: 'dowryDeaths', label: 'Dowry Deaths' },
  { key: 'riots', label: 'Riots' },
  { key: 'casesOfHurt', label: 'Cases of Hurt' },
  { key: 'burglaryDay', label: 'Burglary (Day)' },
  { key: 'burglaryNight', label: 'Burglary (Night)' },
  { key: 'fatalAccidents', label: 'Fatal Accidents' },
  { key: 'gambling', label: 'Gambling' },
]

function fmt(n) { return typeof n === 'number' ? n.toLocaleString('en-IN') : String(n) }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 14px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: p.color || 'var(--color-text-secondary)' }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function DistrictProfile() {
  const { districtName } = useParams()
  const navigate = useNavigate()
  const decoded = decodeURIComponent(districtName || '')

  const district = useMemo(() => {
    return districtStats.find(d =>
      d.csvName.toLowerCase() === decoded.toLowerCase() ||
      d.geoName.toLowerCase() === decoded.toLowerCase()
    )
  }, [decoded])

  if (!district) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-state-title">District not found: {decoded}</div>
          <button className="dp-back-btn" onClick={() => navigate('/')} style={{ marginTop: 16 }}>← Back to Command Center</button>
        </div>
      </div>
    )
  }

  const rank = districtStats.findIndex(d => d.csvName === district.csvName) + 1
  const hot = hotspots.find(h => h.csvName === district.csvName)
  const fore = forecasts.find(f => f.district === district.csvName)
  const recs = generateRecommendations(district)
  const xaiData = generateExplainableAI('DISTRICT_PROFILE', ['District-wise IPC Crimes Karnataka 2024'], [district.csvName])

  const womenTotal = WOMEN_FIELDS.reduce((s, f) => s + (district[f] || 0), 0)
  const childTotal = CHILD_FIELDS.reduce((s, f) => s + (district[f] || 0), 0)

  const barData = CATEGORY_KEYS.map(c => ({ name: c.label, value: district[c.key] || 0 })).sort((a, b) => b.value - a.value)

  // Find related districts (similar hotspot score ±15)
  const related = hotspots
    .filter(h => h.csvName !== district.csvName && hot && Math.abs(h.hotspotScore - hot.hotspotScore) <= 15)
    .slice(0, 5)

  return (
    <div className="district-profile">
      {/* Header */}
      <div className="dp-header">
        <div>
          <button className="dp-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="page-title" style={{ marginTop: 12 }}>{district.csvName}</h1>
          <p className="page-subtitle">District Intelligence Profile — Karnataka State Police</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge badge-${hot?.severityLevel === 'critical' ? 'critical' : hot?.severityLevel === 'high' ? 'warning' : 'success'}`}>
            {hot?.severityLevel?.toUpperCase() || 'MODERATE'}
          </span>
          <span className="badge badge-neutral">Rank #{rank} of {districtStats.length}</span>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="dp-overview-grid">
        {[
          { label: 'Total Crimes', value: fmt(district.total) },
          { label: 'Crime Index', value: `${hot?.hotspotScore || 'N/A'}/100` },
          { label: 'Risk Level', value: hot?.riskLabel || 'MODERATE' },
          { label: 'Growth Rate', value: fore ? `${fore.growthRate > 0 ? '+' : ''}${fore.growthRate}%` : 'N/A' },
        ].map((m, i) => (
          <div key={i} className="dp-metric-card">
            <div className="dp-metric-label">{m.label}</div>
            <div className="dp-metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Crime Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Crime Breakdown</span>
            <span className="card-meta">Category-wise · 2024</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData.slice(0, 12)} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={95} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="var(--color-accent-alt)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensitive Categories */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sensitive Categories</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Crimes Against Women', value: fmt(womenTotal), color: 'var(--color-alert-high)' },
                { label: 'Crimes Against Children', value: fmt(childTotal), color: 'var(--color-alert-medium)' },
                { label: 'SC/ST Crimes', value: fmt(district.scst), color: 'var(--color-accent-alt)' },
                { label: 'Cyber Crime', value: fmt(district.cyberCrime), color: '#8B5CF6' },
                { label: 'Rape', value: fmt(district.rape), color: 'var(--color-alert-high)' },
                { label: 'Molestation', value: fmt(district.molestation), color: 'var(--color-alert-medium)' },
                { label: 'POCSO', value: fmt(district.pocso), color: 'var(--color-alert-high)' },
                { label: 'Dowry Deaths', value: fmt(district.dowryDeaths), color: 'var(--color-alert-medium)' },
              ].map((item, i) => (
                <div key={i} className="dp-metric-card" style={{ padding: 12 }}>
                  <div className="dp-metric-label" style={{ fontSize: 10 }}>{item.label}</div>
                  <div className="dp-metric-value" style={{ fontSize: 20, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast + Risk Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Forecast */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Forecast</span>
            <span className="card-meta">Projected growth based on 2024→2025 trends</span>
          </div>
          <div className="card-body">
            {fore ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div className="dp-metric-card" style={{ padding: 12 }}>
                    <div className="dp-metric-label" style={{ fontSize: 10 }}>2024 Actual</div>
                    <div className="dp-metric-value" style={{ fontSize: 18 }}>{fmt(fore.current2024)}</div>
                  </div>
                  <div className="dp-metric-card" style={{ padding: 12 }}>
                    <div className="dp-metric-label" style={{ fontSize: 10 }}>2025 Projected</div>
                    <div className="dp-metric-value" style={{ fontSize: 18 }}>{fmt(fore.projected2025)}</div>
                  </div>
                  <div className="dp-metric-card" style={{ padding: 12 }}>
                    <div className="dp-metric-label" style={{ fontSize: 10 }}>2026 Projected</div>
                    <div className="dp-metric-value" style={{ fontSize: 18 }}>{fmt(fore.projected2026)}</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={[
                    { year: '2024', value: fore.current2024 },
                    { year: '2025', value: fore.projected2025 },
                    { year: '2026', value: fore.projected2026 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="year" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="var(--color-accent-alt)" strokeWidth={2} dot={{ fill: 'var(--color-accent-alt)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, fontFamily: 'var(--font-data)' }}>
                  Confidence: {Math.round(fore.confidence * 100)}%
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ border: 'none', padding: 24 }}>
                <div className="empty-state-title">Insufficient Data</div>
              </div>
            )}
          </div>
        </div>

        {/* Risk Score Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Risk Score Breakdown</span>
            <span className="card-meta">Explainable AI</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Composite Risk Score</span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {hot?.hotspotScore || 'N/A'}/100
                </span>
              </div>
              <div className="risk-bar-track" style={{ width: '100%', height: 8 }}>
                <div className="risk-bar-fill" style={{
                  width: `${hot?.hotspotScore || 0}%`,
                  background: (hot?.hotspotScore || 0) >= 80 ? 'var(--color-alert-high)' : (hot?.hotspotScore || 0) >= 60 ? 'var(--color-alert-medium)' : 'var(--color-alert-low)',
                }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <div><strong>Volume Factor (40%):</strong> Total crimes weighted against state distribution</div>
              <div><strong>Severity Factor (60%):</strong> Weighted by crime severity (Murder ×10, Rape ×8, POCSO ×8, etc.)</div>
              <div><strong>Method:</strong> Composite Z-score analysis</div>
              <div><strong>Severity Weight:</strong> {fmt(district.severityWeight)}</div>
            </div>
            <ExplainableAI data={xaiData} />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Officer Recommendations</span>
          <span className="card-meta">Auto-generated from risk + trend data</span>
        </div>
        <div className="card-body">
          {recs.map((rec, i) => (
            <div key={i} style={{
              padding: '12px 16px', marginBottom: 8,
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)', borderRadius: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 13 }}>{rec.action}</span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span className={`badge badge-${rec.priority === 'High' ? 'critical' : rec.priority === 'Medium' ? 'warning' : 'success'}`} style={{ fontSize: 9 }}>
                    {rec.priority}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: 9, fontFamily: 'var(--font-data)' }}>
                    {rec.confidence}%
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-data)' }}>
                BASIS: {rec.basis}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                IMPACT: {rec.impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Districts */}
      {related.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Related Districts</span>
            <span className="card-meta">Similar risk profile (±15 score)</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {related.map(r => (
                <button key={r.csvName} className="cc-action-btn" style={{ padding: '8px 14px' }}
                  onClick={() => navigate(`/district/${encodeURIComponent(r.csvName)}`)}>
                  <span className={`status-dot ${r.severityLevel}`} />
                  {r.csvName}
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {r.hotspotScore}/100
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
