import { useState, useEffect } from 'react'
import { buildApiUrl } from '../../api.js'
import Badge from '../../components/shared/Badge'

const DEMO_ALERTS = [
  {
    id: 'demo-1',
    type: 'Crime Spike',
    title: 'Localized property crime spike in Bengaluru Urban',
    category: 'Bengaluru Urban',
    severity: 'CRITICAL',
    source: 'Anomaly Detection Engine',
    timestamp: new Date().toISOString(),
    read: false,
    zScore: 4.2,
    changePercent: 28
  },
  {
    id: 'demo-2',
    type: 'Crime Increase',
    title: 'Traffic enforcement advisory for Mysuru district',
    category: 'Mysuru',
    severity: 'HIGH',
    source: 'System',
    timestamp: new Date().toISOString(),
    read: true,
    zScore: 2.1,
    changePercent: 14
  }
]

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, CRITICAL, HIGH, NOTICE

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch(buildApiUrl('/alerts'))
        const json = await res.json()
        if (res.status === 401) {
          console.warn('[Alerts] /alerts returned 401; using demo alerts fallback.')
          setAlerts(DEMO_ALERTS)
        } else if (json.success) {
          // Normalize alerts
          const parsed = json.data.map(a => ({
            id: a.id || a.ROWID,
            type: a.severity === 'critical' ? 'Crime Spike' : 'Crime Increase',
            title: a.message,
            category: a.district || 'State',
            severity: a.severity?.toUpperCase() || 'HIGH',
            source: a.id?.startsWith('sys-') ? 'Anomaly Detection Engine' : 'System',
            timestamp: a.timestamp,
            read: a.resolved || false,
            zScore: a.zScore,
            changePercent: a.changePercent
          }))
          setAlerts(parsed)
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAlerts()
  }, [])

  const markAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })))
  }

  const markRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const filtered = alerts.filter(a => {
    if (filter === 'ALL') return true
    return a.severity === filter
  })

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">Active Alerts</h1>
            {unreadCount > 0 && (
              <span style={{ background: '#C62828', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="page-subtitle">Real-time intelligence notifications and system alerts</p>
        </div>
        <button onClick={markAllRead} style={{ height: 32, padding: '0 12px', border: '1px solid #C8D0DA', borderRadius: 4, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#5F6B7A' }}>
          Mark all as read
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {['ALL', 'CRITICAL', 'HIGH', 'NOTICE'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? '#EEF2F7' : 'transparent',
              border: filter === f ? '1px solid #C8D0DA' : '1px solid transparent',
              color: filter === f ? '#1F5FAF' : '#5F6B7A',
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: filter === f ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8C96A3', fontSize: 13 }}>Loading intelligence alerts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8C96A3', fontSize: 13 }}>No active alerts in this category.</div>
        ) : (
          filtered.map(alert => (
            <div
              key={alert.id}
              onClick={() => markRead(alert.id)}
              className="card"
              style={{
                display: 'flex',
                padding: 16,
                gap: 16,
                borderLeft: !alert.read ? `3px solid ${alert.severity === 'CRITICAL' ? '#C62828' : '#F57C00'}` : '3px solid transparent',
                cursor: 'pointer',
                opacity: alert.read ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {alert.severity === 'CRITICAL' ? (
                      <Badge type="critical">CRITICAL</Badge>
                    ) : alert.severity === 'HIGH' ? (
                      <Badge type="warning">HIGH</Badge>
                    ) : (
                      <Badge type="neutral">NOTICE</Badge>
                    )}
                    <span style={{ fontSize: 12, color: '#5F6B7A', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                      {alert.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>

                <div style={{ fontSize: 15, fontWeight: 500, color: '#1B1F23', marginTop: 4 }}>
                  {alert.title}
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: '#5F6B7A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 11A5 5 0 106 1a5 5 0 000 10z" stroke="#8C96A3"/><path d="M6 3v3l2 2" stroke="#8C96A3"/></svg>
                    {alert.source}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 5h10M1 8h10M2 1v10M10 1v10" stroke="#8C96A3"/></svg>
                    {alert.category}
                  </div>
                </div>
              </div>
              
              {alert.zScore && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 16, borderLeft: '1px solid #E8ECF0', minWidth: 100 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1B1F23', fontFamily: 'IBM Plex Mono' }}>
                    {alert.zScore > 0 ? '+' : ''}{alert.zScore}σ
                  </div>
                  <div style={{ fontSize: 11, color: '#8C96A3' }}>Z-Score</div>
                </div>
              )}
              
              {alert.changePercent && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 16, borderLeft: '1px solid #E8ECF0', minWidth: 100 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1B1F23', fontFamily: 'IBM Plex Mono' }}>
                    {alert.changePercent > 0 ? '+' : ''}{alert.changePercent}%
                  </div>
                  <div style={{ fontSize: 11, color: '#8C96A3' }}>YoY Change</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
