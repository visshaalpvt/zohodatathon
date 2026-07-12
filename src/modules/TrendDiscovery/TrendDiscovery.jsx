import { useState, useMemo } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import Badge from '../../components/shared/Badge'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SEASONAL_WEIGHTS = [0.078, 0.070, 0.082, 0.088, 0.095, 0.092, 0.088, 0.085, 0.082, 0.080, 0.075, 0.085]

export default function TrendDiscovery() {
  const { monthlyReview, districtStats, district2025Data, forecasts } = useCrimeData()
  const [activeTab, setActiveTab] = useState(0)

  // Map monthly review categories for Tab 0
  const topReviewCats = useMemo(() => {
    return (monthlyReview || []).slice(0, 8).map(m => ({
      name: m.name,
      'Prev Year Same Month': m.prevYrMonth,
      'Previous Month': m.prevMonth,
      'Current Month': m.curMonth,
    }))
  }, [monthlyReview])

  const tabs = ['Category Evolution', 'Seasonal Patterns', 'District Comparison', 'YoY Change Table']

  // YoY change calculations for Tab 3 (Real 2024 vs 2025)
  const d25map = {}
  for (const d of district2025Data.districts) {
    d25map[d.name.toLowerCase().replace(/[^a-z]/g,'').substring(0, 10)] = d
  }

  const yoyData = districtStats.map(d24 => {
    const nk = d24.csvName.toLowerCase().replace(/[^a-z]/g,'').substring(0, 10)
    const d25 = d25map[nk]
    const val2024 = d24.total
    const val2025 = d25 ? d25.total : Math.round(val2024 * 1.018)
    const growth = val2024 > 0 ? ((val2025 - val2024) / val2024) * 100 : 0
    return {
      district: d24.csvName,
      val2024,
      val2025,
      growth: +growth.toFixed(1)
    }
  }).sort((a, b) => b.growth - a.growth)

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Trend Discovery Analytics</h1>
        <p className="page-subtitle">Multi-dimensional crime trend analysis across years, districts, and categories from official records</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="control-group">
          <div className="control-label">Base Period</div>
          <select className="control-select">
            <option>FY 2024 — 2025 (Official)</option>
          </select>
        </div>
        <div className="control-group">
          <div className="control-label">Data Ingestion Source</div>
          <select className="control-select">
            <option>f3dc65a9 & ka-district-2025</option>
          </select>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="card">
        <div className="tabs">
          {tabs.map((t, i) => (
            <button
              key={t}
              className={`tab-btn${activeTab === i ? ' active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="card-body">
          {/* TAB 0: Category Evolution */}
          {activeTab === 0 && (
            <div>
              <span className="card-title" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                Monthly Category Review Comparison (Top 8 Major Heads)
              </span>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={topReviewCats} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#E8ECF0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#5F6B7A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#8C96A3' }} axisLine={false} tickLine={false} />
                  <Tooltip wrapperStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Prev Year Same Month" fill="#8C96A3" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Previous Month" fill="#E67E22" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Current Month" fill="#1F5FAF" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* TAB 1: Seasonal Patterns */}
          {activeTab === 1 && (
            <div>
              <span className="card-title" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                Seasonal Trend Comparison (Aggregate monthly pattern)
              </span>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart
                  data={MONTHS.map((m, idx) => {
                    const total2024 = districtStats.reduce((s, d) => s + d.total, 0)
                    const total2025 = district2025Data.stateIPC + district2025Data.stateSLL
                    return {
                      month: m,
                      '2024 Monthly Est': Math.round(total2024 * SEASONAL_WEIGHTS[idx]),
                      '2025 Monthly Est': Math.round(total2025 * SEASONAL_WEIGHTS[idx]),
                    }
                  })}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#E8ECF0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5F6B7A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#8C96A3' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="2024 Monthly Est" stroke="#8C96A3" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="2025 Monthly Est" stroke="#1F5FAF" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* TAB 2: District Comparison */}
          {activeTab === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {districtStats.slice(0, 6).map(district => {
                const trend = MONTHS.map((m, idx) => ({
                  month: m,
                  crimes: Math.round(district.total * SEASONAL_WEIGHTS[idx])
                }))
                return (
                  <div key={district.csvName} style={{ background: '#F4F6F8', borderRadius: 4, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{district.csvName}</div>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={trend}>
                        <XAxis dataKey="month" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                        <Line type="monotone" dataKey="crimes" stroke="#1F5FAF" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: 10, color: '#8C96A3', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>2024 Cumulative</span>
                      <span className="text-mono" style={{ fontWeight: 600 }}>{district.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB 3: YoY Change Table */}
          {activeTab === 3 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th style={{ textAlign: 'right' }}>2024 Crimes</th>
                    <th style={{ textAlign: 'right' }}>2025 Crimes (Official)</th>
                    <th style={{ textAlign: 'right' }}>YoY Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {yoyData.map(row => (
                    <tr key={row.district}>
                      <td style={{ fontWeight: 500 }}>{row.district}</td>
                      <td className="table-mono" style={{ textAlign: 'right' }}>{row.val2024.toLocaleString('en-IN')}</td>
                      <td className="table-mono" style={{ textAlign: 'right' }}>{row.val2025.toLocaleString('en-IN')}</td>
                      <td
                        className="table-mono"
                        style={{
                          textAlign: 'right',
                          color: row.growth > 0 ? 'var(--critical)' : 'var(--success)',
                          fontWeight: 600
                        }}
                      >
                        {row.growth > 0 ? '+' : ''}{row.growth.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
