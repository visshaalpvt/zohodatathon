import { useMemo, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { districtStats, hotspots, forecasts } from '../../data/dataLayer'

const CRIME_CATEGORIES = ['murder', 'rape', 'theft', 'cyberCrime', 'pocso', 'scst', 'molestation', 'robbery', 'riots']
const CRIME_LABELS = { murder: 'Murder', rape: 'Rape', theft: 'Theft', cyberCrime: 'Cyber Crime', pocso: 'POCSO', scst: 'SC/ST', molestation: 'Molestation', robbery: 'Robbery', riots: 'Riots' }
const RISK_COLORS = { critical: '#DC2626', high: '#D97706', moderate: '#2563EB', low: '#16A34A' }

export default function NetworkGraph() {
  const graphRef = useRef()

  const graphData = useMemo(() => {
    const nodes = []
    const links = []

    // District nodes
    const top20 = districtStats.slice(0, 20)
    top20.forEach(d => {
      const hot = hotspots.find(h => h.csvName === d.csvName)
      nodes.push({
        id: `d-${d.csvName}`, label: d.csvName, type: 'district',
        val: Math.max(4, d.total / 500),
        color: RISK_COLORS[hot?.severityLevel || 'moderate'],
        severity: hot?.severityLevel || 'moderate',
        total: d.total,
      })
    })

    // Crime category nodes
    CRIME_CATEGORIES.forEach(cat => {
      const total = top20.reduce((s, d) => s + (d[cat] || 0), 0)
      nodes.push({
        id: `c-${cat}`, label: CRIME_LABELS[cat], type: 'category',
        val: Math.max(3, total / 1000),
        color: '#8B5CF6', total,
      })
    })

    // Risk level nodes
    ['critical', 'high', 'moderate', 'low'].forEach(risk => {
      const count = top20.filter(d => (hotspots.find(h => h.csvName === d.csvName)?.severityLevel || 'moderate') === risk).length
      if (count > 0) {
        nodes.push({
          id: `r-${risk}`, label: risk.toUpperCase(), type: 'risk',
          val: Math.max(2, count), color: RISK_COLORS[risk], count,
        })
      }
    })

    // Forecast direction nodes
    const forecasted = top20.map(d => forecasts.find(f => f.district === d.csvName)).filter(Boolean)
    ;['Increasing', 'Stable', 'Decreasing'].forEach(dir => {
      const count = forecasted.filter(f => {
        if (dir === 'Increasing') return f.growthRate > 5
        if (dir === 'Decreasing') return f.growthRate < -5
        return f.growthRate >= -5 && f.growthRate <= 5
      }).length
      if (count > 0) {
        nodes.push({
          id: `f-${dir}`, label: dir, type: 'forecast',
          val: Math.max(2, count),
          color: dir === 'Increasing' ? '#DC2626' : dir === 'Decreasing' ? '#16A34A' : '#D97706',
          count,
        })
      }
    })

    // Links: District → Category (weighted by volume)
    top20.forEach(d => {
      CRIME_CATEGORIES.forEach(cat => {
        const val = d[cat] || 0
        if (val > 50) {
          links.push({
            source: `d-${d.csvName}`, target: `c-${cat}`,
            value: Math.max(0.5, val / 500),
          })
        }
      })
    })

    // Links: District → Risk Level
    top20.forEach(d => {
      const hot = hotspots.find(h => h.csvName === d.csvName)
      const risk = hot?.severityLevel || 'moderate'
      if (nodes.find(n => n.id === `r-${risk}`)) {
        links.push({ source: `d-${d.csvName}`, target: `r-${risk}`, value: 0.3 })
      }
    })

    // Links: District → Forecast Direction
    top20.forEach(d => {
      const fore = forecasts.find(f => f.district === d.csvName)
      if (fore) {
        const dir = fore.growthRate > 5 ? 'Increasing' : fore.growthRate < -5 ? 'Decreasing' : 'Stable'
        if (nodes.find(n => n.id === `f-${dir}`)) {
          links.push({ source: `d-${d.csvName}`, target: `f-${dir}`, value: 0.3 })
        }
      }
    })

    return { nodes, links }
  }, [])

  const paintNode = useCallback((node, ctx) => {
    const r = Math.sqrt(node.val) * 3
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = node.color || '#2563EB'
    ctx.fill()

    if (node.type === 'district') {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.font = `${node.type === 'district' ? '10' : '9'}px Inter`
    ctx.fillStyle = '#F8FAFC'
    ctx.textAlign = 'center'
    ctx.fillText(node.label, node.x, node.y + r + 10)
  }, [])

  return (
    <div className="page-content" style={{ height: 'calc(100vh - var(--topbar-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h1 className="page-title">District Intelligence Network</h1>
        <p className="page-subtitle">Interactive graph — districts, crime categories, risk levels, and forecast directions</p>
      </div>

      <div className="network-container" style={{ flex: 1 }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const r = Math.sqrt(node.val) * 3
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI)
            ctx.fillStyle = color
            ctx.fill()
          }}
          linkColor={() => 'rgba(148,163,184,0.15)'}
          linkWidth={link => link.value || 0.5}
          backgroundColor="#0A0E1A"
          nodeLabel={node => {
            if (node.type === 'district') return `${node.label}\nTotal: ${node.total?.toLocaleString('en-IN')}\nRisk: ${node.severity?.toUpperCase()}`
            if (node.type === 'category') return `${node.label}\nTotal: ${node.total?.toLocaleString('en-IN')}`
            return `${node.label}\nCount: ${node.count}`
          }}
        />

        <div className="network-legend">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>LEGEND</div>
          {[
            { color: '#DC2626', label: 'Critical / Increasing' },
            { color: '#D97706', label: 'High / Stable' },
            { color: '#2563EB', label: 'District (Moderate)' },
            { color: '#16A34A', label: 'Low / Decreasing' },
            { color: '#8B5CF6', label: 'Crime Category' },
          ].map((item, i) => (
            <div key={i} className="network-legend-item">
              <span className="network-legend-dot" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
