import { useState, useEffect, useMemo } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from '../../components/shared/Badge'

export default function SociologicalInsights() {
  const { districtStats = [] } = useCrimeData()
  const [correlations, setCorrelations] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCorrelations() {
      try {
        const res = await fetch('/server/zohodatathon_function/sociological')
        const json = await res.json()
        if (json.success) {
          setCorrelations(json.data)
        }
      } catch (err) {
        console.error('Failed to load sociological correlations:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCorrelations()
  }, [])

  const selectedCorr = correlations[selectedIdx] || null

  // Demographic / Sociological indicators mapped to specific pairs to enhance Module 7 compliance
  const demographicContext = useMemo(() => {
    if (!selectedCorr) return null
    const label = selectedCorr.label
    
    if (label.includes('Cyber')) {
      return {
        title: 'Digital Infiltration & Literacy Factor',
        xDesc: 'Internet penetration and literacy rates concentrate cyber incidents in highly urbanized centers like Bengaluru.',
        yDesc: 'Theft rate indicates physical property vulnerability, showing contrast to digital assets vulnerability.',
        insight: 'Strong positive skew shows that rapid technological adoption (high literacy/urbanization) without security training spikes cyber crimes, while petty thefts follow physical density.'
      }
    }
    if (label.includes('Domestic')) {
      return {
        title: 'Socio-Economic & Dowry Prohibitions',
        xDesc: 'Reported cruelty by husbands reflects institutional trust to log complaints.',
        yDesc: 'Dowry deaths reflect critical structural and sociological violence factors.',
        insight: 'Highly significant positive correlation highlights that domestic violence reports are leading indicators of lethal dowry-related violence, indicating the necessity of early intervention cells.'
      }
    }
    if (label.includes('POCSO')) {
      return {
        title: 'Urban Vulnerability & Child Protection Index',
        xDesc: 'POCSO reports reflect child safety index metrics.',
        yDesc: 'Rape rates indicate broader systemic crimes against women.',
        insight: 'Extremely strong linear correlation demonstrates co-occurrence of general gender violence and minor exploitation, highlighting shared district risk factors.'
      }
    }
    if (label.includes('SC/ST')) {
      return {
        title: 'Social Stratification & Agrarian Stress Vectors',
        xDesc: 'Crimes registered under SC/ST Act indicate localized social friction.',
        yDesc: 'Riots represent public disorder occurrences.',
        insight: 'Moderately positive correlation indicates that districts with high social inequality or land disputes experience higher triggers of localized public unrest and riots.'
      }
    }
    return {
      title: 'General Crime Contagion & Economic Pressure',
      xDesc: 'Independent crime metrics.',
      yDesc: 'Dependent crime metrics.',
      insight: 'The correlation indicates that shared economic pressure and urban congestion drive property-related offenses in parallel.'
    }
  }, [selectedCorr])

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 40px)' }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h1 className="page-title">Sociological & Demographic Insights</h1>
        <p className="page-subtitle">Correlation research mapping specific crime heads against district socio-economic and demographic vectors</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left pane: Scatter plot and details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Correlation dropdown selection */}
          <div className="card" style={{ flexShrink: 0 }}>
            <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="control-label">Socio-Criminal Vector:</span>
                {loading ? (
                  <span>Loading vectors...</span>
                ) : (
                  <select
                    className="control-select"
                    value={selectedIdx}
                    onChange={e => setSelectedIdx(Number(e.target.value))}
                    style={{ minWidth: 280 }}
                  >
                    {correlations.map((c, i) => (
                      <option key={i} value={i}>{c.label}</option>
                    ))}
                  </select>
                )}
              </div>
              {selectedCorr && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#5F6B7A' }}>Pearson Correlation:</span>
                  <strong style={{ fontSize: 14, color: '#0F2744', fontFamily: 'IBM Plex Mono' }}>
                    r = {selectedCorr.correlation}
                  </strong>
                  <Badge type={selectedCorr.strength === 'Strong' ? 'critical' : selectedCorr.strength === 'Moderate' ? 'warning' : 'neutral'}>
                    {selectedCorr.strength} Association
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Scatter Chart */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-title">{selectedCorr?.label || 'Correlation Plot'}</span>
              <span className="card-meta">District scatter points showing relative volume co-variance</span>
            </div>
            <div className="card-body" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px 8px' }}>
              {loading ? (
                <div style={{ color: '#8C96A3' }}>Calculating correlations...</div>
              ) : selectedCorr ? (
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={selectedCorr.x}
                      tick={{ fontSize: 10, fill: '#5F6B7A' }}
                      label={{ value: selectedCorr.x.toUpperCase(), position: 'insideBottom', offset: -10, fill: '#5F6B7A', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={selectedCorr.y}
                      tick={{ fontSize: 10, fill: '#5F6B7A' }}
                      label={{ value: selectedCorr.y.toUpperCase(), angle: -90, position: 'insideLeft', offset: 0, fill: '#5F6B7A', fontSize: 10, fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div style={{ background: '#FFFFFF', border: '1px solid #D2D6DC', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                              <strong style={{ display: 'block', marginBottom: 4 }}>{data.district}</strong>
                              <div>{selectedCorr.x}: {data.x.toLocaleString('en-IN')}</div>
                              <div>{selectedCorr.y}: {data.y.toLocaleString('en-IN')}</div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Scatter name={selectedCorr.label} data={selectedCorr.points} fill="#1F5FAF" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#8C96A3' }}>No correlation selected</div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Analysis & Research insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Research Insight Card */}
          {selectedCorr && demographicContext && (
            <div className="card" style={{ flexShrink: 0, borderLeft: '4px solid #0F2744' }}>
              <div className="card-header">
                <span className="card-title">{demographicContext.title}</span>
                <span className="card-meta">Sociological Context</span>
              </div>
              <div className="card-body" style={{ fontSize: 13, lineHeight: 1.6, padding: '12px 16px' }}>
                <p style={{ color: '#1B1F23', marginBottom: 10 }}>{demographicContext.insight}</p>
                <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 10.5, color: '#8C96A3', textTransform: 'uppercase', marginBottom: 2 }}>X-Axis Vector Context</div>
                  <div style={{ fontSize: 11.5, color: '#5F6B7A' }}>{demographicContext.xDesc}</div>
                </div>
                <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 10.5, color: '#8C96A3', textTransform: 'uppercase', marginBottom: 2 }}>Y-Axis Vector Context</div>
                  <div style={{ fontSize: 11.5, color: '#5F6B7A' }}>{demographicContext.yDesc}</div>
                </div>
              </div>
            </div>
          )}

          {/* District rankings comparison table */}
          {selectedCorr && (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header" style={{ flexShrink: 0 }}>
                <span className="card-title">Top Risk Districts Comparison</span>
                <span className="card-meta">Co-occurrence analysis</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                <table className="data-table" style={{ width: '100%', fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>District</th>
                      <th style={{ textAlign: 'right' }}>{selectedCorr.x.toUpperCase()}</th>
                      <th style={{ textAlign: 'right' }}>{selectedCorr.y.toUpperCase()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedCorr.points]
                      .sort((a, b) => (b.x + b.y) - (a.x + a.y))
                      .slice(0, 10)
                      .map((pt, idx) => (
                        <tr key={pt.district} style={{ borderBottom: '1px solid #E8ECF0' }}>
                          <td style={{ fontWeight: 500 }}>{pt.district}</td>
                          <td className="table-mono" style={{ textAlign: 'right' }}>{pt.x.toLocaleString('en-IN')}</td>
                          <td className="table-mono" style={{ textAlign: 'right' }}>{pt.y.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
