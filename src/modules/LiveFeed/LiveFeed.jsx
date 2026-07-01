import { useState, useEffect, useRef } from 'react'
import { hotspots, anomalies, forecasts, districtStats } from '../../data/dataLayer'

const WOMEN_FIELDS = ['rape', 'molestation', 'crueltyByHusband', 'dowryDeaths', 'pocso']

/**
 * Generate intelligence events from dataset analytics
 * All data derived from existing analytics engine output
 */
function generateEvents() {
  const events = []
  const now = new Date()

  // Risk level alerts for critical/high districts
  hotspots.filter(h => h.severityLevel === 'critical' || h.severityLevel === 'high').slice(0, 6).forEach((h, i) => {
    events.push({
      id: `risk-${i}`,
      time: new Date(now.getTime() - (i * 180000 + 60000)),
      type: h.severityLevel === 'critical' ? 'alert' : 'risk',
      typeLabel: h.severityLevel === 'critical' ? 'CRITICAL' : 'HIGH RISK',
      district: h.csvName,
      description: `${h.severityLevel.toUpperCase()} severity — Hotspot score ${h.hotspotScore}/100, total crimes ${h.total.toLocaleString('en-IN')}`,
    })
  })

  // Anomaly detection results
  anomalies.slice(0, 5).forEach((a, i) => {
    events.push({
      id: `anomaly-${i}`,
      time: new Date(now.getTime() - (i * 240000 + 120000)),
      type: 'anomaly',
      typeLabel: 'ANOMALY',
      district: a.category,
      description: `${a.direction === 'surge' ? '↑' : '↓'} ${a.description}`,
    })
  })

  // Trend changes from forecasts
  forecasts.filter(f => Math.abs(f.growthRate) > 10).slice(0, 4).forEach((f, i) => {
    events.push({
      id: `trend-${i}`,
      time: new Date(now.getTime() - (i * 300000 + 180000)),
      type: 'trend',
      typeLabel: f.growthRate > 0 ? 'TREND ↑' : 'TREND ↓',
      district: f.district,
      description: `Crime ${f.growthRate > 0 ? 'increasing' : 'decreasing'} trend: ${f.growthRate > 0 ? '+' : ''}${f.growthRate}% projected growth`,
    })
  })

  // Forecast updates
  forecasts.slice(0, 3).forEach((f, i) => {
    events.push({
      id: `forecast-${i}`,
      time: new Date(now.getTime() - (i * 360000 + 300000)),
      type: 'forecast',
      typeLabel: 'FORECAST',
      district: f.district,
      description: `2025 projection: ${f.projected2025?.toLocaleString('en-IN')} cases (confidence: ${Math.round(f.confidence * 100)}%)`,
    })
  })

  // Women safety alerts
  const womenSorted = [...districtStats].sort((a, b) => {
    const wa = WOMEN_FIELDS.reduce((s, f) => s + (a[f] || 0), 0)
    const wb = WOMEN_FIELDS.reduce((s, f) => s + (b[f] || 0), 0)
    return wb - wa
  })
  womenSorted.slice(0, 2).forEach((d, i) => {
    const wTotal = WOMEN_FIELDS.reduce((s, f) => s + (d[f] || 0), 0)
    events.push({
      id: `women-${i}`,
      time: new Date(now.getTime() - (i * 420000 + 600000)),
      type: 'alert',
      typeLabel: 'WOMEN SAFETY',
      district: d.csvName,
      description: `${wTotal.toLocaleString('en-IN')} crimes against women — Rape: ${d.rape}, Molestation: ${d.molestation}, POCSO: ${d.pocso}`,
    })
  })

  return events.sort((a, b) => b.time - a.time)
}

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function LiveFeed({ maxItems = 20, compact = false }) {
  const [events] = useState(() => generateEvents())
  const [visibleCount, setVisibleCount] = useState(0)
  const timerRef = useRef(null)

  // Staggered display: one item every 200ms on first load
  useEffect(() => {
    if (visibleCount < Math.min(events.length, maxItems)) {
      timerRef.current = setTimeout(() => {
        setVisibleCount(prev => prev + 1)
      }, 200)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visibleCount, events.length, maxItems])

  const visibleEvents = events.slice(0, visibleCount)

  return (
    <div className="live-feed" style={compact ? { maxHeight: '100%' } : {}}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-alert-high)',
            boxShadow: '0 0 6px var(--color-alert-high)',
            animation: 'district-pulse 2s ease-in-out infinite',
          }} />
          Live Intelligence Feed
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--color-text-muted)' }}>
          {visibleCount}/{events.length}
        </span>
      </div>

      {visibleEvents.map(ev => (
        <div key={ev.id} className="feed-item" style={{
          opacity: 1,
          transition: 'opacity 300ms ease',
        }}>
          <span className="feed-time">{formatTime(ev.time)}</span>
          <span className={`feed-type ${ev.type}`}>{ev.typeLabel}</span>
          <span className="feed-text">
            <span className="feed-district">{ev.district}</span>
            {' — '}
            {ev.description}
          </span>
        </div>
      ))}

      {visibleCount < Math.min(events.length, maxItems) && (
        <div style={{ padding: 12, textAlign: 'center' }}>
          <div className="intel-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
        </div>
      )}
    </div>
  )
}
