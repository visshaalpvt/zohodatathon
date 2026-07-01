import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hotspots, anomalies, forecasts, kpis, districtStats } from '../../data/dataLayer'
import { generateRecommendations } from '../../data/recommendationEngine'
import LiveFeed from '../LiveFeed/LiveFeed'

const WOMEN_FIELDS = ['rape', 'molestation', 'crueltyByHusband', 'dowryDeaths', 'pocso']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function getOperationalStatus() {
  const critical = hotspots.filter(h => h.severityLevel === 'critical').length
  const high = hotspots.filter(h => h.severityLevel === 'high').length
  const total = critical + high
  if (total > 5) return { label: 'ELEVATED', color: 'red', detail: `${critical} critical, ${high} high-risk districts` }
  if (total >= 3) return { label: 'AMBER', color: 'amber', detail: `${total} high-risk districts active` }
  return { label: 'NORMAL', color: 'green', detail: 'All districts within normal parameters' }
}

function generateIntelSummary() {
  const items = []

  // Critical hotspots
  const critical = hotspots.filter(h => h.severityLevel === 'critical')
  if (critical.length > 0) {
    items.push({
      severity: 'critical',
      text: `${critical.length} districts in CRITICAL status: ${critical.map(h => h.csvName).join(', ')}`,
    })
  }

  // Anomalies
  const surges = anomalies.filter(a => a.direction === 'surge')
  if (surges.length > 0) {
    const top = surges[0]
    items.push({
      severity: 'high',
      text: `Anomaly detected: ${top.category} surged ${top.changePercent > 0 ? '+' : ''}${top.changePercent}% (Z-score: ${top.zScore})`,
    })
  }

  // Growth trends
  const increasing = forecasts.filter(f => f.growthRate > 10)
  if (increasing.length > 0) {
    items.push({
      severity: 'medium',
      text: `${increasing.length} districts show >10% crime growth trend — highest: ${increasing[0].district} (+${increasing[0].growthRate}%)`,
    })
  }

  // Cyber crime
  const topCyber = [...districtStats].sort((a, b) => b.cyberCrime - a.cyberCrime)[0]
  if (topCyber) {
    items.push({
      severity: 'medium',
      text: `Cyber crime lead: ${topCyber.csvName} with ${topCyber.cyberCrime.toLocaleString('en-IN')} cases — state total: ${districtStats.reduce((s, d) => s + d.cyberCrime, 0).toLocaleString('en-IN')}`,
    })
  }

  // Women safety
  const stateWomen = districtStats.reduce((s, d) => s + WOMEN_FIELDS.reduce((ss, f) => ss + (d[f] || 0), 0), 0)
  items.push({
    severity: 'low',
    text: `Crimes against women state total: ${stateWomen.toLocaleString('en-IN')} across ${districtStats.length} districts`,
  })

  return items.slice(0, 5)
}

export default function CommandCenter() {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const status = getOperationalStatus()
  const intelSummary = generateIntelSummary()
  const topRecs = generateRecommendations(districtStats[0])

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="command-center">
      {/* Header */}
      <div>
        <h1 className="cc-greeting">{getGreeting()}, Officer</h1>
        <div className="cc-meta">
          <span>{dateStr}</span>
          <span style={{ fontFamily: 'var(--font-data)', color: 'var(--color-text-secondary)' }}>{timeStr}</span>
          <span className={`cc-status-badge ${status.color}`}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: status.color === 'red' ? 'var(--color-alert-high)' : status.color === 'amber' ? 'var(--color-alert-medium)' : 'var(--color-alert-low)',
            }} />
            {status.label}
          </span>
          <span style={{ fontSize: 12 }}>{status.detail}</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Total IPC 2024', value: kpis.totalIPC2024.toLocaleString('en-IN'), trend: null },
          { label: 'Total SLL 2024', value: kpis.totalSLL2024.toLocaleString('en-IN'), trend: null },
          { label: 'IPC Growth', value: `${kpis.growthRateIPC > 0 ? '+' : ''}${kpis.growthRateIPC}%`, trend: kpis.growthRateIPC > 0 ? 'up' : 'down' },
          { label: 'Critical Hotspots', value: String(kpis.criticalHotspots), trend: kpis.criticalHotspots > 3 ? 'up' : 'down' },
          { label: 'Anomalies Detected', value: String(kpis.totalAnomalies), trend: null },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ fontSize: 28 }}>{kpi.value}</div>
            {kpi.trend && (
              <div className={`kpi-trend ${kpi.trend}`}>
                {kpi.trend === 'up' ? '▲' : '▼'} {kpi.trend === 'up' ? 'Increasing' : 'Decreasing'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Intelligence Summary + Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left: Intel Summary + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Intelligence Summary */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-accent-alt)" strokeWidth="1.5">
                  <path d="M8 1L15 13.5H1L8 1Z"/>
                  <path d="M8 6V9.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11.5" r="0.6" fill="var(--color-accent-alt)"/>
                </svg>
                Today's Intelligence Summary
              </span>
              <span className="card-meta">Auto-generated from datasets</span>
            </div>
            <div className="card-body" style={{ flex: 1, overflowY: 'auto' }}>
              <ul className="cc-intel-summary">
                {intelSummary.map((item, i) => (
                  <li key={i} className="cc-intel-item">
                    <span className={`status-dot ${item.severity}`} style={{ marginTop: 2 }} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>

              {/* Top Recommendations */}
              {topRecs.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                    color: 'var(--color-text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.5px', marginBottom: 8,
                  }}>
                    Priority Recommendations
                  </div>
                  {topRecs.slice(0, 3).map((rec, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', marginBottom: 6,
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4, fontSize: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{rec.action}</span>
                        <span className={`badge badge-${rec.priority === 'High' ? 'critical' : rec.priority === 'Medium' ? 'warning' : 'success'}`}
                          style={{ fontSize: 9 }}>{rec.priority}</span>
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-data)', fontSize: 10 }}>
                        {rec.basis}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header" style={{ padding: '10px 20px' }}>
              <span className="card-title" style={{ fontSize: 12 }}>Quick Actions</span>
            </div>
            <div className="card-body" style={{ padding: 12 }}>
              <div className="cc-quick-actions">
                {[
                  { label: 'Generate Daily Brief', icon: '📋', route: '/briefings' },
                  { label: 'Compare Districts', icon: '⚖️', route: '/copilot' },
                  { label: 'Women Safety Analysis', icon: '🛡️', route: '/copilot' },
                  { label: 'Cyber Intelligence', icon: '💻', route: '/copilot' },
                  { label: 'View Network Graph', icon: '🔗', route: '/network' },
                  { label: 'Scenario Simulation', icon: '📊', route: '/simulation' },
                ].map((action, i) => (
                  <button key={i} className="cc-action-btn" onClick={() => navigate(action.route)}>
                    <span style={{ fontSize: 16 }}>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Feed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <LiveFeed maxItems={15} compact />
        </div>
      </div>
    </div>
  )
}
