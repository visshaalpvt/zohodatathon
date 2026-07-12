import { useState } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import KarnatakaMap from '../../components/shared/KarnatakaMap'
import Sparkline from '../../components/shared/Sparkline'
import Badge from '../../components/shared/Badge'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SEASONAL_WEIGHTS = [0.078, 0.070, 0.082, 0.088, 0.095, 0.092, 0.088, 0.085, 0.082, 0.080, 0.075, 0.085]

export default function Hotspots() {
  const { hotspots: datasetHotspots = [], forecasts = [] } = useCrimeData()
  const [selected, setSelected] = useState(null)

  // Map to uniform structures
  const hotspots = (datasetHotspots || []).map(h => {
    const fore = (forecasts || []).find(f => f.district === h.csvName)
    const yoyChange = fore ? fore.growthRate : 0.0
    
    // Simulate seasonal monthly breakdown based on district total crime volume
    const trend = MONTHS.map((m, idx) => ({
      month: m,
      incidents: Math.round(h.total * SEASONAL_WEIGHTS[idx])
    }))

    return {
      id: h.csvName,
      location: h.csvName,
      district: h.geoName,
      incidents: h.total,
      severity: h.severityLevel === 'critical' ? 3 : h.severityLevel === 'high' ? 2 : 1,
      severityLevel: h.severityLevel,
      yoyChange,
      trend
    }
  })

  const criticalCount = hotspots.filter(h => h.severityLevel === 'critical').length
  const selectedHotspot = hotspots.find(h => h.id === selected)

  // Format data for the map component
  const mapHotspots = hotspots.map(h => ({
    id: h.id,
    district: h.district,
    incidents: h.incidents,
    severity: h.severity
  }))

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Hotspot Intelligence</h1>
        <p className="page-subtitle">Spatial concentration of crime risks based on cumulative volume, severity index, and YoY growth</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 16 }}>
        {/* Left: Map with hotspot overlays */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Statewide Risk Mapping</span>
            <span className="card-meta">Geographic overlay of calculated risk locations</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <KarnatakaMap
              metric="riskScore"
              hotspots={mapHotspots}
              showHotspots={true}
              selectedDistrict={selectedHotspot?.district}
            />
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid #E8ECF0' }}>
              {[
                { color: '#C62828', label: 'Critical Risk (Score ≥ 80)' },
                { color: '#E67E22', label: 'High Risk (Score 60-79)' },
                { color: '#1E7D32', label: 'Moderate Risk (Score 40-59)' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5F6B7A' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: 0.7 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Rankings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Alert banner */}
          {criticalCount > 0 && (
            <div className="alert-banner" style={{ marginBottom: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L15 13.5H1L8 1Z" stroke="#C62828" strokeWidth="1.3"/>
                <path d="M8 6V9" stroke="#C62828" strokeWidth="1.5"/>
                <circle cx="8" cy="11.5" r="0.8" fill="#C62828"/>
              </svg>
              <div>
                <span className="alert-banner-text">{criticalCount} critical districts identified</span>
                <span className="alert-banner-detail"> — operational patrol and vigilance recommended</span>
              </div>
            </div>
          )}

          {/* Hotspot rankings */}
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Operational Risk Rankings</span>
              <span className="card-meta">All districts sorted by Hotspot Index</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
              {hotspots.map((hs, i) => (
                <div
                  key={hs.id}
                  onClick={() => setSelected(selected === hs.id ? null : hs.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 16px',
                    borderBottom: '1px solid #F4F6F8',
                    cursor: 'pointer',
                    background: selected === hs.id ? '#EEF2F7' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8C96A3', width: 24, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1B1F23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hs.location}
                    </div>
                    <div style={{ fontSize: 10, color: '#8C96A3' }}>Geo Group: {hs.district}</div>
                  </div>
                  <div style={{ marginRight: 6 }}>
                    <Sparkline data={hs.trend.map(t => t.incidents)} width={48} height={18} color={hs.severity === 3 ? '#C62828' : hs.severity === 2 ? '#E67E22' : '#1E7D32'} />
                  </div>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#1B1F23', width: 44, textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
                    {hs.incidents.toLocaleString('en-IN')}
                  </span>
                  <span style={{ flexShrink: 0, width: 64, textAlign: 'center' }}>
                    <Badge type={hs.severity === 3 ? 'critical' : hs.severity === 2 ? 'warning' : 'success'}>
                      {hs.severityLevel.toUpperCase()}
                    </Badge>
                  </span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: hs.yoyChange > 0 ? '#C62828' : '#1E7D32', flexShrink: 0, width: 42, textAlign: 'right' }}>
                    {hs.yoyChange > 0 ? '+' : ''}{hs.yoyChange.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
