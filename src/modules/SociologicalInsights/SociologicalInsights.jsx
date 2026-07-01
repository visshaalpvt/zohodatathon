import { useState } from 'react'
import { correlations } from '../../data/dataLayer'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function linearRegression(points) {
  const n = points.length
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 }
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)
  const denominator = (n * sumXX - sumX * sumX)
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
  const intercept = (sumY - slope * sumX) / n
  const yMean = sumY / n
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0
  return { slope, intercept, r2 }
}

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{d.district}</div>
      <div className="tooltip-row">
        <span>X Value:</span>
        <span>{d.x?.toLocaleString()}</span>
      </div>
      <div className="tooltip-row">
        <span>Y Value:</span>
        <span>{d.y?.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function SociologicalInsights() {
  const [activePairIndex, setActivePairIndex] = useState(1) // Default: Domestic Violence vs Dowry Deaths

  const activePair = correlations[activePairIndex] || correlations[0]
  const points = activePair.points.map(p => ({
    x: p.x,
    y: p.y,
    district: p.district
  }))

  const { slope, intercept, r2 } = linearRegression(points)
  const xVals = points.map(p => p.x)
  const minX = Math.min(...xVals)
  const maxX = Math.max(...xVals)
  const refLine = [{ x: minX, y: slope * minX + intercept }, { x: maxX, y: slope * maxX + intercept }]

  // Outliers: sorting residuals (vertical distance from regression line)
  const pointsWithResiduals = points.map(p => {
    const expectedY = slope * p.x + intercept
    return {
      ...p,
      expectedY,
      residual: p.y - expectedY
    }
  })

  const positiveOutliers = [...pointsWithResiduals]
    .sort((a, b) => b.residual - a.residual)
    .slice(0, 5)

  const negativeOutliers = [...pointsWithResiduals]
    .sort((a, b) => a.residual - b.residual)
    .slice(0, 5)

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Socio-Criminal Intelligence</h1>
        <p className="page-subtitle">Cross-category correlations and statistical outliers across Karnataka districts</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: 16, marginBottom: 16 }}>
        {/* Left: scatter plot */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{activePair.label} Correlation</span>
            <span className="card-meta" style={{ fontFamily: 'IBM Plex Mono' }}>Pearson R = {activePair.correlation.toFixed(3)}</span>
          </div>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #E8ECF0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {correlations.map((c, idx) => (
              <button
                key={idx}
                onClick={() => setActivePairIndex(idx)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid',
                  borderColor: activePairIndex === idx ? '#1F5FAF' : '#C8D0DA',
                  borderRadius: 3,
                  background: activePairIndex === idx ? '#1F5FAF' : '#fff',
                  color: activePairIndex === idx ? '#fff' : '#5F6B7A',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  marginBottom: 2
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
                <CartesianGrid stroke="#E8ECF0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="X Category Count"
                  tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#8C96A3' }}
                  label={{ value: 'X Category Cases', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#8C96A3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Y Category Count"
                  tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#8C96A3' }}
                  label={{ value: 'Y Category Cases', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#8C96A3' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter data={points} fill="#1F5FAF" opacity={0.75} r={4} />
                <ReferenceLine segment={refLine} stroke="#C62828" strokeWidth={1.5} strokeDasharray="5 3" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: correlation details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Correlation Strength</span>
            </div>
            <div className="card-body">
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 15, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4 }}>
                Pearson R = {activePair.correlation.toFixed(3)}
              </div>
              <div style={{ fontSize: 12, color: '#5F6B7A', marginBottom: 10 }}>
                {activePair.strength} correlation detected between categories in Karnataka.
              </div>
              <div style={{ fontSize: 11, color: '#8C96A3', lineHeight: 1.4 }}>
                A coefficient of R={activePair.correlation.toFixed(2)} signifies that changes in the X category values account for observed changes in Y values under regression logic.
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Positive Outliers (Higher than Expected Y)</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              {positiveOutliers.slice(0, 4).map(o => (
                <div key={o.district} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F4F6F8', fontSize: 12.5 }}>
                  <span>{o.district}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', color: '#C62828', fontSize: 11, fontWeight: 600 }}>
                    +{Math.round(o.residual)} cases
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Negative Outliers (Lower than Expected Y)</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              {negativeOutliers.slice(0, 4).map(o => (
                <div key={o.district} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F4F6F8', fontSize: 12.5 }}>
                  <span>{o.district}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', color: '#1E7D32', fontSize: 11, fontWeight: 600 }}>
                    {Math.round(o.residual)} cases
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">District-wise Incident Counts</span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 310 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th style={{ textAlign: 'right' }}>X Category Value</th>
                <th style={{ textAlign: 'right' }}>Y Category Value</th>
                <th style={{ textAlign: 'right' }}>Expected Y</th>
                <th style={{ textAlign: 'right' }}>Deviation</th>
              </tr>
            </thead>
            <tbody>
              {pointsWithResiduals.sort((a,b) => b.x - a.x).map(row => (
                <tr key={row.district}>
                  <td style={{ fontWeight: 500 }}>{row.district}</td>
                  <td className="table-mono" style={{ textAlign: 'right' }}>{row.x.toLocaleString()}</td>
                  <td className="table-mono" style={{ textAlign: 'right' }}>{row.y.toLocaleString()}</td>
                  <td className="table-mono" style={{ textAlign: 'right', color: '#8C96A3' }}>{Math.round(row.expectedY).toLocaleString()}</td>
                  <td
                    className="table-mono"
                    style={{
                      textAlign: 'right',
                      color: row.residual > 0 ? 'var(--critical)' : 'var(--success)',
                      fontWeight: 600
                    }}
                  >
                    {row.residual > 0 ? '+' : ''}{Math.round(row.residual).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
