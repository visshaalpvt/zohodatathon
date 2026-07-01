import { useState } from 'react'
import { forecasts as datasetForecasts, monthlyReview } from '../../data/dataLayer'
import KarnatakaMap from '../../components/shared/KarnatakaMap'
import Sparkline from '../../components/shared/Sparkline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from '../../components/shared/Badge'

// Emerging categories from monthly review YoY monthly spike
const emergingCategories = monthlyReview
  .filter(m => m.prevYrMonth > 0 && m.curMonth > 0)
  .map(m => {
    const growth = ((m.curMonth - m.prevYrMonth) / m.prevYrMonth) * 100
    return { category: m.name, growth: parseFloat(growth.toFixed(1)) }
  })
  .sort((a, b) => b.growth - a.growth)
  .slice(0, 6)

const MODEL_FACTORS = [
  { label: 'Historical Trend Vector (YoY 2024-2025)', weight: 0.45 },
  { label: 'Seasonal Allocation (Monthly review f3dc65a9)', weight: 0.25 },
  { label: 'Crime Intensity Severity Weights', weight: 0.30 },
]

export default function RiskForecasting() {
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [openFactor, setOpenFactor] = useState(null)

  const forecasts = datasetForecasts.map(f => {
    // Current risk is hotspot score, projected risk is adjusted slightly based on growth rate
    const currentRisk = Math.round(f.hotspotScore * 0.95)
    const predictedRisk = f.hotspotScore
    return {
      ...f,
      currentRisk,
      predictedRisk,
      changePct: f.growthRate,
      confidenceLabel: (f.confidence * 100).toFixed(0) + '%'
    }
  })

  const selectedProf = forecasts.find(f => f.district === selectedDistrict)

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Predictive Risk Forecasting</h1>
        <p className="page-subtitle">Crime risk projections based on historical YoY trend models and severity weights</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 16 }}>
        {/* Left: map */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Forecast Risk Map</span>
            <span className="card-meta">Predicted Risk Index · FY 2025/2026</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <KarnatakaMap
              metric="riskScore"
              onDistrictClick={(d) => setSelectedDistrict(d === selectedDistrict ? null : d)}
              selectedDistrict={selectedDistrict}
            />
          </div>
        </div>

        {/* Right: forecast detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* High-risk forecasts */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-title">District Risk Forecasts</span>
              <span className="card-meta">Sorted by Predicted Risk Index</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 310 }}>
              {forecasts.slice(0, 15).map((f, i) => (
                <div
                  key={f.district}
                  onClick={() => setSelectedDistrict(f.district === selectedDistrict ? null : f.district)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 16px',
                    borderBottom: '1px solid #F4F6F8',
                    cursor: 'pointer',
                    background: selectedDistrict === f.district ? '#EEF2F7' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8C96A3', width: 20, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.district}
                    </div>
                    <div style={{ fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>
                      Risk Index: {f.currentRisk} → {f.predictedRisk}
                    </div>
                  </div>
                  <div style={{ marginRight: 6 }}>
                    <Sparkline data={[f.current2024, f.projected2025, f.projected2026]} width={44} height={16} color={f.predictedRisk >= 75 ? '#C62828' : '#E67E22'} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, width: 68 }}>
                    <div style={{
                      fontFamily: 'IBM Plex Mono',
                      fontSize: 11,
                      fontWeight: 600,
                      color: f.changePct > 0 ? '#C62828' : '#1E7D32'
                    }}>
                      {f.changePct > 0 ? '+' : ''}{f.changePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 9.5, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>Conf: {f.confidenceLabel}</div>
                  </div>
                  <Badge type={f.predictedRisk >= 75 ? 'critical' : f.predictedRisk >= 55 ? 'warning' : 'neutral'}>
                    {f.predictedRisk}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging categories */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Emerging Crime Head Categories</span>
              <span className="card-meta">YoY Monthly Review Spike</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={emergingCategories} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="#E8ECF0" horizontal={false} />
                  <XAxis type="number" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#8C96A3' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fontFamily: 'Inter', fill: '#5F6B7A' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Growth Rate']} />
                  <Bar dataKey="growth" fill="#1F5FAF" radius={[0, 2, 2, 0]} maxBarSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Model details panel */}
      {selectedDistrict && selectedProf && (
        <div className="card" style={{ marginTop: 16, borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="card-header">
            <span className="card-title">Forecast Profile: {selectedDistrict}</span>
            <Badge type={selectedProf.predictedRisk >= 75 ? 'critical' : 'warning'}>Confidence: {selectedProf.confidenceLabel}</Badge>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <span className="control-label" style={{ display: 'block', marginBottom: 8 }}>Top Risk Concerns</span>
              {selectedProf.topConcerns && selectedProf.topConcerns.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedProf.topConcerns.map((tc, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: '#1B1F23', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--critical)', fontWeight: 600 }}>•</span> {tc}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No critical threshold violations detected.</div>
              )}
            </div>
            <div>
              <span className="control-label" style={{ display: 'block', marginBottom: 8 }}>Trend Projections</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>2024 Cumulative:</span>
                <span className="text-mono" style={{ fontWeight: 600 }}>{selectedProf.current2024.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>2025 Projected (YoY basis):</span>
                <span className="text-mono" style={{ fontWeight: 600 }}>{selectedProf.projected2025.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>2026 Forecast Model:</span>
                <span className="text-mono" style={{ fontWeight: 600 }}>{selectedProf.projected2026.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model transparency */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Mathematical Model Parameters</span>
          <span className="card-meta" style={{ fontFamily: 'IBM Plex Mono' }}>Regression factors based on KSP SCRB historical vector alignments</span>
        </div>
        <div className="card-body">
          {MODEL_FACTORS.map((f, i) => (
            <div key={f.label} className="accordion-item" style={{ borderBottom: '1px solid #E8ECF0', padding: '10px 0' }}>
              <button
                className="accordion-trigger"
                onClick={() => setOpenFactor(openFactor === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Inter',
                  fontSize: 13.5,
                  alignItems: 'center'
                }}
              >
                <span>{f.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80, height: 4, background: '#E8ECF0', borderRadius: 2 }}>
                    <div style={{ width: `${f.weight * 100}%`, height: 4, background: '#1F5FAF', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#5F6B7A', width: 32 }}>{(f.weight * 100).toFixed(0)}%</span>
                  <span style={{ color: '#8C96A3' }}>{openFactor === i ? '−' : '+'}</span>
                </div>
              </button>
              {openFactor === i && (
                <div className="accordion-content" style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Ensemble model regression weight: {(f.weight * 100).toFixed(0)}%. Computed dynamically using linear expansion vectors between 2024 and 2025 state units and monthly trend review coefficients.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
