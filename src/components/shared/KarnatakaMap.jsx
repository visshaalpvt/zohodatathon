import { useRef, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import karnatakaGeoJSON from '../../data/karnatakaGeoJSON'
import { geoStats, forecasts, district2025Data } from '../../data/dataLayer'

const OVERLAYS = [
  { id: 'riskScore', label: 'Risk Map', metric: 'riskScore', color: '#D97706' },
  { id: 'crimeCount', label: 'Crime Heatmap', metric: 'crimeCount', color: '#2563EB' },
  { id: 'change', label: 'Forecast Map', metric: 'change', color: '#8B5CF6' },
  { id: 'womenSafety', label: 'Women Safety Map', metric: 'womenSafety', color: '#DC2626' },
]

const CATEGORY_LABELS = {
  murder: 'Murder', attemptToMurder: 'Attempt Murder', rape: 'Rape',
  dacoity: 'Dacoity', robbery: 'Robbery', burglaryDay: 'Burglary (Day)',
  burglaryNight: 'Burglary (Night)', theft: 'Theft', riots: 'Riots',
  casesOfHurt: 'Grievous Hurt', crueltyByHusband: 'Domestic Cruelty',
  dowryDeaths: 'Dowry Deaths', fatalAccidents: 'Fatal Accidents',
  nonFatalAccidents: 'Non-Fatal Accidents', molestation: 'Molestation',
  scst: 'SC/ST Crimes', gambling: 'Gambling', dpAct: 'DP Act Cases',
  cyberCrime: 'Cyber Crime', pocso: 'POCSO', pocsoRape: 'POCSO Rape'
}

function getTopCrimeCategory(districtName) {
  const stats = geoStats[districtName]
  if (!stats) return 'N/A'
  let maxVal = -1
  let maxCat = 'N/A'
  Object.keys(CATEGORY_LABELS).forEach(k => {
    if (stats[k] > maxVal) {
      maxVal = stats[k]
      maxCat = CATEGORY_LABELS[k]
    }
  })
  return maxCat
}

// Sophisticated dark-palette color scale using CSS variable equivalent colors
function getOverlayColor(value, min, max, metric) {
  if (value === undefined || value === null) return '#1C2333'
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)))
  
  if (metric === 'change') {
    // Forecast growth: purple scale
    return d3.interpolateRgb('#1E1B4B', '#8B5CF6')(t)
  }
  if (metric === 'womenSafety') {
    // Women Safety: red/pink scale
    return d3.interpolateRgb('#2D0B12', '#DC2626')(t)
  }
  if (metric === 'crimeCount') {
    // Crime volume: blue scale
    return d3.interpolateRgb('#0B132B', '#2563EB')(t)
  }
  // Risk Score: low (green) -> mid (amber) -> high (red) using design system tokens
  if (t < 0.5) {
    return d3.interpolateRgb('#16A34A', '#D97706')(t * 2)
  }
  return d3.interpolateRgb('#D97706', '#DC2626')((t - 0.5) * 2)
}

export default function KarnatakaMap({
  year = 2024,
  onDistrictClick,
  onDistrictHover,
  selectedDistrict,
  hotspots = [],
  showHotspots = false,
  highlightDistricts = null,
  width: propWidth,
  height: propHeight,
}) {
  const navigate = useNavigate()
  const [activeOverlay, setActiveOverlay] = useState('riskScore')

  const profiles = useMemo(() => {
    const rawProfs = Object.keys(geoStats).map(geoName => {
      const stats = geoStats[geoName]
      const fore = forecasts.find(f => f.geoName === geoName)
      
      let total = stats.total
      if (year === 2025 && district2025Data) {
        const nk = geoName.toLowerCase().replace(/[^a-z]/g,'').substring(0, 10)
        const d25 = district2025Data.districts.find(d => 
          d.name.toLowerCase().replace(/[^a-z]/g,'').substring(0, 10) === nk
        )
        if (d25) total = d25.total
      }

      // Aggregate women safety metrics
      const womenSafety = (stats.rape || 0) + (stats.molestation || 0) + (stats.crueltyByHusband || 0) + (stats.dowryDeaths || 0) + (stats.pocso || 0) + (stats.pocsoRape || 0)
      
      return {
        district: geoName,
        crimeCount: total,
        change: fore ? fore.growthRate : 1.2,
        riskScore: fore ? fore.hotspotScore : 50,
        womenSafety,
      }
    })
    
    const maxVal = Math.max(...rawProfs.map(p => p.crimeCount))
    return rawProfs.map(p => ({
      ...p,
      crimeRate: maxVal > 0 ? +(p.crimeCount / maxVal * 100).toFixed(1) : 0
    }))
  }, [year])

  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [dims, setDims] = useState({ width: 600, height: 480 })

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      if (!entries[0]) return
      const { width } = entries[0].contentRect
      setDims({ width, height: Math.round(width * 0.78) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current) return

    const { width, height } = dims
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const metric = activeOverlay
    const values = profiles.map(p => p[metric]).filter(v => v != null)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)

    const projection = d3.geoMercator().fitSize([width - 20, height - 20], karnatakaGeoJSON)
    const path = d3.geoPath().projection(projection)

    const g = svg.append('g').attr('transform', 'translate(10,10)')

    // Draw districts
    g.selectAll('path.district')
      .data(karnatakaGeoJSON.features)
      .join('path')
      .attr('class', d => {
        const prof = profiles.find(p => p.district === d.properties.district)
        const isHighRisk = prof && prof.riskScore >= 70
        return `district${isHighRisk ? ' district-high-risk' : ''}`
      })
      .attr('d', path)
      .attr('fill', d => {
        const prof = profiles.find(p => p.district === d.properties.district)
        if (!prof) return '#1C2333'
        if (highlightDistricts && !highlightDistricts.includes(d.properties.district)) return '#111827'
        return getOverlayColor(prof[metric], minVal, maxVal, metric)
      })
      .attr('stroke', d => selectedDistrict === d.properties.district ? '#2563EB' : '#2D3748')
      .attr('stroke-width', d => selectedDistrict === d.properties.district ? 2.5 : 0.8)
      .attr('cursor', 'pointer')
      .style('transition', 'fill 300ms ease, stroke 150ms ease')
      .on('mouseenter', function(event, d) {
        const prof = profiles.find(p => p.district === d.properties.district)
        d3.select(this).attr('stroke', '#2563EB').attr('stroke-width', 2)
        const [mx, my] = d3.pointer(event, svgRef.current)
        const topCat = getTopCrimeCategory(d.properties.district)
        setTooltip({ x: mx, y: my, district: d.properties.district, prof, topCat })
        onDistrictHover && onDistrictHover(d.properties.district, prof)
      })
      .on('mousemove', function(event) {
        const [mx, my] = d3.pointer(event, svgRef.current)
        setTooltip(t => t ? { ...t, x: mx, y: my } : null)
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('stroke', selectedDistrict === d.properties.district ? '#2563EB' : '#2D3748')
          .attr('stroke-width', selectedDistrict === d.properties.district ? 2.5 : 0.8)
        setTooltip(null)
        onDistrictHover && onDistrictHover(null, null)
      })
      .on('click', (event, d) => {
        const prof = profiles.find(p => p.district === d.properties.district)
        if (onDistrictClick) {
          onDistrictClick(d.properties.district, prof)
        } else {
          navigate(`/district/${encodeURIComponent(d.properties.district)}`)
        }
      })

    // District labels (abbreviations)
    g.selectAll('text.label')
      .data(karnatakaGeoJSON.features)
      .join('text')
      .attr('class', 'label')
      .attr('transform', d => `translate(${path.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-data)')
      .attr('fill', '#94A3B8')
      .attr('pointer-events', 'none')
      .attr('opacity', 0.8)
      .text(d => d.properties.id)

    // Hotspot circles
    if (showHotspots && hotspots.length) {
      const maxInc = Math.max(...hotspots.map(h => h.incidents))
      hotspots.forEach(hs => {
        const r = 4 + (hs.incidents / maxInc) * 14
        const color = hs.severity === 3 ? '#DC2626' : hs.severity === 2 ? '#D97706' : '#16A34A'
        const feat = karnatakaGeoJSON.features.find(f => f.properties.district === hs.district)
        if (!feat) return
        const [cx, cy] = path.centroid(feat)
        g.append('circle')
          .attr('cx', cx + seededOffset(hs.id, 0))
          .attr('cy', cy + seededOffset(hs.id, 1))
          .attr('r', r)
          .attr('fill', color)
          .attr('opacity', 0.6)
          .attr('stroke', color)
          .attr('stroke-width', 1)
          .attr('pointer-events', 'none')
      })
    }
  }, [dims, activeOverlay, selectedDistrict, highlightDistricts, hotspots, showHotspots, profiles])

  function seededOffset(id, axis) {
    let h = 0
    for (let c of id) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
    const v = Math.abs(Math.sin(h + axis * 100)) * 12 - 6
    return v
  }

  // Generate dynamic legend values
  const legendInfo = useMemo(() => {
    const metric = activeOverlay
    const values = profiles.map(p => p[metric]).filter(v => v != null)
    if (!values.length) return null
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const midVal = (minVal + maxVal) / 2
    return {
      min: minVal,
      max: maxVal,
      mid: midVal,
      minColor: getOverlayColor(minVal, minVal, maxVal, metric),
      midColor: getOverlayColor(midVal, minVal, maxVal, metric),
      maxColor: getOverlayColor(maxVal, minVal, maxVal, metric),
    }
  }, [profiles, activeOverlay])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: '#0A0E1A' }}>
      {/* Overlay Toggles */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
        borderRadius: 4, padding: 4, zIndex: 10, display: 'flex', gap: 4,
      }}>
        {OVERLAYS.map(o => (
          <button
            key={o.id}
            onClick={() => setActiveOverlay(o.id)}
            style={{
              padding: '4px 10px', background: activeOverlay === o.id ? 'var(--color-bg-primary)' : 'transparent',
              border: 'none', borderRadius: 3, color: activeOverlay === o.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 150ms ease',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.color }} />
            {o.label}
          </button>
        ))}
      </div>

      {/* D3 Map Canvas */}
      <svg
        ref={svgRef}
        width={dims.width}
        height={dims.height}
        style={{ display: 'block', margin: '0 auto' }}
      />

      {/* Dynamic Legend */}
      {legendInfo && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
          borderRadius: 4, padding: '10px 14px', zIndex: 10, minWidth: 160,
        }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            {OVERLAYS.find(o => o.id === activeOverlay)?.label} Legend
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{
              flex: 1, height: 8, borderRadius: 2,
              background: `linear-gradient(to right, ${legendInfo.minColor}, ${legendInfo.midColor}, ${legendInfo.maxColor})`,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--color-text-secondary)' }}>
            <span>{activeOverlay === 'change' ? `${legendInfo.min.toFixed(1)}%` : Math.round(legendInfo.min).toLocaleString('en-IN')}</span>
            <span>{activeOverlay === 'change' ? `${legendInfo.max.toFixed(1)}%` : Math.round(legendInfo.max).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Sophisticated Hover Tooltip */}
      {tooltip && tooltip.prof && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 16, dims.width - 220),
            top: Math.min(tooltip.y - 12, dims.height - 150),
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '12px 14px',
            pointerEvents: 'none',
            zIndex: 100,
            minWidth: 200,
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--color-text-primary)' }}>
            {tooltip.district}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Crime Index:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{tooltip.prof.riskScore}/100</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Risk Level:</span>
              <span className={`status-dot ${tooltip.prof.riskScore >= 70 ? 'critical' : tooltip.prof.riskScore >= 50 ? 'medium' : 'low'}`} style={{ fontWeight: 600 }}>
                {tooltip.prof.riskScore >= 70 ? 'CRITICAL' : tooltip.prof.riskScore >= 50 ? 'HIGH' : 'MODERATE'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Crimes:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{tooltip.prof.crimeCount?.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Trend YoY:</span>
              <span className={tooltip.prof.change > 0 ? 'trend-up' : 'trend-down'} style={{ fontWeight: 600 }}>
                {tooltip.prof.change > 0 ? '▲' : '▼'} {tooltip.prof.change > 0 ? '+' : ''}{tooltip.prof.change}%
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 6, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Top Category</span>
              <strong style={{ color: 'var(--color-accent-alt)', fontSize: 10 }}>{tooltip.topCat}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
