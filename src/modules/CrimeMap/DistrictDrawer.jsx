import { useNavigate } from 'react-router-dom'
import { geoStats, forecasts } from '../../data/dataLayer'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import Badge from '../../components/shared/Badge'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SEASONAL = [0.078,0.070,0.082,0.088,0.095,0.092,0.088,0.085,0.082,0.080,0.075,0.085]

const CATEGORIES = [
  { key: 'murder', label: 'Murder' },
  { key: 'attemptToMurder', label: 'Attempt to Murder' },
  { key: 'rape', label: 'Rape' },
  { key: 'dacoity', label: 'Dacoity' },
  { key: 'robbery', label: 'Robbery' },
  { key: 'burglaryDay', label: 'Burglary (Day)' },
  { key: 'burglaryNight', label: 'Burglary (Night)' },
  { key: 'theft', label: 'Theft' },
  { key: 'riots', label: 'Riots' },
  { key: 'casesOfHurt', label: 'Grievous Hurt' },
  { key: 'crueltyByHusband', label: 'Domestic Cruelty' },
  { key: 'dowryDeaths', label: 'Dowry Deaths' },
  { key: 'fatalAccidents', label: 'Fatal Accidents' },
  { key: 'nonFatalAccidents', label: 'Non-Fatal Accidents' },
  { key: 'molestation', label: 'Molestation' },
  { key: 'scst', label: 'SC/ST Crimes' },
  { key: 'gambling', label: 'Gambling' },
  { key: 'dpAct', label: 'DP Act Cases' },
  { key: 'cyberCrime', label: 'Cyber Crime' },
  { key: 'pocso', label: 'POCSO' },
  { key: 'pocsoRape', label: 'POCSO Rape' }
]

function getRiskBadge(score) {
  if (score >= 75) return <Badge type="critical">Critical</Badge>
  if (score >= 55) return <Badge type="warning">High</Badge>
  if (score >= 35) return <Badge type="neutral">Medium</Badge>
  return <Badge type="success">Low</Badge>
}

export default function DistrictDrawer({ district, prof, onClose }) {
  const navigate = useNavigate()
  if (!prof) return null

  const dStats = geoStats[district] || {}
  const fore = forecasts.find(f => f.geoName === district) || {}

  const cats = CATEGORIES.map(c => ({
    cat: c.label,
    count: dStats[c.key] || 0,
  })).sort((a, b) => b.count - a.count)

  const trendData = MONTHS.map((m, i) => ({
    month: m,
    crimes: Math.round(prof.crimeCount * SEASONAL[i])
  }))

  const handleOpenProfile = () => {
    navigate(`/district/${encodeURIComponent(district)}`)
    onClose()
  }

  return (
    <div className="drawer" style={{ width: 360, background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)' }}>
      <div className="drawer-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div className="drawer-title" style={{ color: 'var(--color-text-primary)' }}>{district}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
            District Intelligence Brief · FY 2024
          </div>
        </div>
        <button className="drawer-close" onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
      </div>
      <div className="drawer-body">
        {/* Summary metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Crimes', value: prof.crimeCount?.toLocaleString('en-IN') },
            { label: 'Crime Rate/100k', value: prof.crimeRate?.toLocaleString() },
            { label: 'YoY Growth', value: `${prof.change > 0 ? '+' : ''}${prof.change}%`, color: prof.change > 0 ? 'var(--color-alert-high)' : 'var(--color-alert-low)' },
            { label: 'Risk Score', value: prof.riskScore },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-sans)', color: m.color || 'var(--color-text-primary)' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Risk badge */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Risk classification:</span>
          {getRiskBadge(prof.riskScore)}
        </div>

        {/* Action Link to Full Profile */}
        <button
          className="cc-action-btn"
          onClick={handleOpenProfile}
          style={{ width: '100%', marginBottom: 20, justifyContent: 'center', background: 'rgba(37,99,235,0.1)', borderColor: 'var(--color-accent-alt)', color: 'var(--color-text-primary)' }}
        >
          Open Full Intelligence Profile →
        </button>

        {/* 12-month trend */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Monthly Crime Volume (2024 Trend)</div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Line type="monotone" dataKey="crimes" stroke="var(--color-accent-alt)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crime categories */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Crime Breakdown by Category</div>
          {cats.slice(0, 6).map(({ cat, count }) => {
            const maxCount = cats[0].count
            const pct = maxCount ? (count / maxCount) * 100 : 0
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{cat}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{count.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--color-bg-primary)', borderRadius: 2, height: 4 }}>
                  <div style={{ width: `${pct}%`, background: 'var(--color-accent-alt)', height: 4, borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Operational profiles */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Operational Profiles</div>
          {[
            { label: 'Severity Index (Weighted)', value: dStats.severityWeight?.toLocaleString('en-IN') },
            { label: 'Projected 2025 Crimes', value: fore.projected2025?.toLocaleString('en-IN') },
            { label: 'Projected 2026 Crimes', value: fore.projected2026?.toLocaleString('en-IN') },
            { label: 'Constituent Units', value: dStats.csvNames?.join(', ') || district },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--color-border)', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
