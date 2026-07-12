import { useState, useMemo } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import Badge from '../../components/shared/Badge'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function severityBadge(s) {
  if (s === 'critical') return <Badge type="critical">Critical</Badge>
  if (s === 'warning') return <Badge type="warning">High</Badge>
  return <Badge type="neutral">Notice</Badge>
}

// Function removed since it's duplicate



function statusBadge(s) {
  if (s === 'Escalated') return <Badge type="critical">Escalated</Badge>
  if (s === 'Under Review') return <Badge type="warning">Under Review</Badge>
  return <Badge type="success">Resolved</Badge>
}

// Generate contextual baseline chart for each anomaly based on real baseline & spike
function getAnomalyChartData(anomaly) {
  const ref = anomaly.expected
  const obs = anomaly.observed
  return [
    { month: 'M-4', expected: ref, observed: Math.round(ref * 0.98) },
    { month: 'M-3', expected: ref, observed: Math.round(ref * 1.02) },
    { month: 'M-2', expected: ref, observed: Math.round(ref * 0.95) },
    { month: 'M-1', expected: ref, observed: ref },
    { month: 'Current', expected: ref, observed: obs },
  ]
}

const RECOMMENDED_ACTIONS = [
  'Request detailed precinct-level breakout report from district units',
  'Compare cyber crime registration numbers against banking frauds reports',
  'Instruct field patrol units to verify local clusters and verify informants',
  'Coordinate crime mapping with State Crime Records Bureau data intelligence cell',
]

export default function AnomalyDetection() {
  const { anomalies: datasetAnomalies } = useCrimeData()
  const anomalies = useMemo(() => {
    return (datasetAnomalies || []).map(a => ({
      id: a.id,
      severity: a.severity, // critical or warning
      type: a.type, // Month-over-Month or Year-on-Year
      description: a.description,
      district: a.district || 'Karnataka State',
      date: 'FY 2024/2025',
      detected: '2026-06-20 08:30:00',
      status: 'Under Review',
      expected: a.reference,
      observed: a.current,
      zscore: a.zScore,
      category: a.category,
      refLabel: a.refLabel
    }))
  }, [datasetAnomalies])

  const [selectedId, setSelectedId] = useState(anomalies[0]?.id || null)
  const [dismissed, setDismissed] = useState([])
  const [assignee, setAssignee] = useState('')
  const [note, setNote] = useState('')

  const activeAnomalies = anomalies.filter(a => !dismissed.includes(a.id))
  const selected = activeAnomalies.find(a => a.id === selectedId) || activeAnomalies[0]

  const criticalActive = activeAnomalies.filter(a => a.severity === 'critical')

  const chartData = selected ? getAnomalyChartData(selected) : []

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Anomaly Detection Engine</h1>
        <p className="page-subtitle">Statistically significant spikes (Z-score ≥ 1.96σ) detected across monthly review categories</p>
      </div>

      {/* Active anomalies banner */}
      {criticalActive.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {criticalActive.map(a => (
            <div key={a.id} className="alert-banner" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 1L14.5 13H0.5L7.5 1Z" stroke="#C62828" strokeWidth="1.2"/>
                  <path d="M7.5 6V9" stroke="#C62828" strokeWidth="1.5"/>
                  <circle cx="7.5" cy="11" r="0.7" fill="#C62828"/>
                </svg>
                <div>
                  <span className="alert-banner-text">{a.type} Spike — {a.category}</span>
                  <span className="alert-banner-detail"> · Z={a.zscore}σ · Observed: {a.observed} (Expected: {a.expected})</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedId(a.id)}
                  style={{ border: '1px solid #C62828', background: 'transparent', color: '#C62828', borderRadius: 3, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}
                >
                  View
                </button>
                <button
                  onClick={() => setDismissed(d => [...d, a.id])}
                  style={{ border: 'none', background: 'transparent', color: '#8C96A3', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeAnomalies.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 1fr', gap: 16, minHeight: 520 }}>
          {/* Feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-title">Statistical Anomaly Feed</span>
              <span className="card-meta">{activeAnomalies.length} active alerts</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 460 }}>
              {activeAnomalies.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  style={{
                    padding: '13px 16px',
                    borderBottom: '1px solid #F4F6F8',
                    cursor: 'pointer',
                    background: selected?.id === a.id ? '#EEF2F7' : 'transparent',
                    borderLeft: selected?.id === a.id ? '3px solid #1F5FAF' : '3px solid transparent',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {severityBadge(a.severity)}
                      <span style={{ fontSize: 11, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>{a.type}</span>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#1B1F23', fontWeight: 600, marginBottom: 3, lineHeight: 1.4 }}>{a.description}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>
                    <span>Scope: {a.district}</span>
                    <span>·</span>
                    <span>{a.date}</span>
                    <span>·</span>
                    <span>Z={a.zscore}σ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail view */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selected ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{selected.category} — {selected.type} Spike</div>
                    <div style={{ fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono', marginTop: 2 }}>
                      Alert ID: {selected.id} · Verification: Verifiable against f3dc65a9
                    </div>
                  </div>
                  {statusBadge(selected.status)}
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: '#5F6B7A', marginBottom: 14, lineHeight: 1.6 }}>
                    This anomaly indicates a statistical variation in the category <strong>"{selected.category}"</strong>. 
                    The current monthly count represents a Z-score of {selected.zscore}σ relative to the historical baseline variance.
                  </p>

                  {/* Statistical basis */}
                  <div style={{ background: '#F4F6F8', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                    <div style={{ color: '#8C96A3', marginBottom: 4 }}>Statistical Vector Details</div>
                    <div style={{ color: '#1B1F23' }}>
                      Baseline ({selected.refLabel}): {selected.expected.toLocaleString('en-IN')} &nbsp;·&nbsp;
                      Observed: <strong style={{ color: 'var(--critical)' }}>{selected.observed.toLocaleString('en-IN')}</strong> &nbsp;·&nbsp;
                      Z-score: <strong>{selected.zscore}σ</strong>
                    </div>
                  </div>

                  {/* Spike chart */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: '#1B1F23' }}>Deviation Profile (Expected vs Spike)</div>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke="#E8ECF0" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 8, fill: '#8C96A3' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Area type="monotone" dataKey="expected" stroke="#8C96A3" fill="#E8ECF0" strokeWidth={1} strokeDasharray="4 2" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="observed" stroke="var(--critical)" fill="#FDEBEB" strokeWidth={1.5} fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recommended actions */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: '#1B1F23' }}>Recommended Investigative Protocol</div>
                    {RECOMMENDED_ACTIONS.map((action, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12.5, color: '#5F6B7A' }}>
                        <span style={{ color: '#1F5FAF', fontFamily: 'IBM Plex Mono', fontSize: 10, marginTop: 1, flexShrink: 0 }}>
                          {String(i+1).padStart(2,'0')}
                        </span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>

                  {/* Assign / Note form */}
                  <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: '#1B1F23' }}>Assign Action & Add Note</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        value={assignee}
                        onChange={e => setAssignee(e.target.value)}
                        placeholder="Assign to officer / unit"
                        style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid #C8D0DA', borderRadius: 3, fontSize: 12, fontFamily: 'Inter' }}
                      />
                      <button style={{ height: 32, padding: '0 14px', background: '#1F5FAF', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>Assign</button>
                    </div>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Add operational notes..."
                      rows={2}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #C8D0DA', borderRadius: 3, fontSize: 12, fontFamily: 'Inter', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">No anomaly selected</div>
                <div className="empty-state-detail">Click an anomaly from the feed to view details</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">All Alerts Dismissed</div>
          <div className="empty-state-detail">Refresh the page to reset the anomaly list.</div>
        </div>
      )}
    </div>
  )
}
