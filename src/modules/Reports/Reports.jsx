import { useState, useMemo } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import Badge from '../../components/shared/Badge'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SEASONAL_WEIGHTS = [0.078, 0.070, 0.082, 0.088, 0.095, 0.092, 0.088, 0.085, 0.082, 0.080, 0.075, 0.085]

const REPORT_TYPES = [
  { id: 'monthly', label: 'Monthly Crime Summary', description: 'District-wise monthly incident totals' },
  { id: 'district', label: 'District Intelligence Brief', description: 'Comprehensive single-district analysis' },
  { id: 'hotspot', label: 'Hotspot Analysis', description: 'Geographic cluster severity mapping' },
  { id: 'forecast', label: 'Trend Forecast Report', description: '6-month predictive risk assessment' },
  { id: 'custom', label: 'Custom Report Builder', description: 'Select metrics, districts, and date range' },
]

function MonthlySummaryPreview({ districtStats, forecasts }) {
  const { kpis = { total2024: 0, growthRateTotal: 0 } } = useCrimeData()
  const topDistricts = (districtStats || []).slice(0, 10).map((d, i) => {
    const fore = (forecasts || []).find(f => f.district === d.csvName)
    return {
      rank: i + 1,
      district: d.csvName,
      count: d.total,
      change: fore ? fore.growthRate : 1.2
    }
  })

  const total = kpis.total2024
  const growthRate = kpis.growthRateTotal

  const monthlyData = MONTHS.map((m, idx) => ({
    month: m,
    crimes: Math.round(total * SEASONAL_WEIGHTS[idx])
  }))

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1B1F23' }}>
      <div style={{ borderBottom: '2px solid #0F2744', paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8C96A3', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Karnataka State Police · SCRB</div>
            <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'IBM Plex Sans', color: '#0F2744' }}>Monthly Crime Summary Report</div>
            <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 4 }}>Reporting Period: January 2024 — December 2024</div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#8C96A3' }}>
            <div>Generated: 2024-12-31</div>
            <div>Classification: RESTRICTED</div>
            <div>Ref: SCRB/2024/MSR/001</div>
          </div>
        </div>
      </div>

      {/* Executive summary */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2744', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #E8ECF0' }}>1. Executive Summary</div>
        <p style={{ fontSize: 12, color: '#425466', lineHeight: 1.7 }}>
          During FY 2024, Karnataka state recorded a total of <strong>{total.toLocaleString('en-IN')}</strong> cognizable offences (IPC + SLL), representing a <strong>{growthRate > 0 ? '+' : ''}{growthRate}%</strong> growth rate basis when compared with FY 2025 aggregates. {topDistricts[0]?.district} continues to account for the highest absolute crime volume. Northern districts show higher growth indicators, while coastal districts continue to demonstrate comparatively stable crime rates relative to population.
        </p>
      </div>

      {/* Top districts table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2744', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #E8ECF0' }}>2. Top 10 Districts — Crime Volume</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F4F6F8' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#5F6B7A', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#5F6B7A', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>District</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#5F6B7A', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Crimes</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#5F6B7A', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>YoY Change</th>
            </tr>
          </thead>
          <tbody>
            {topDistricts.map((d, i) => (
              <tr key={d.district} style={{ borderBottom: '1px solid #F4F6F8', background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8C96A3' }}>{String(d.rank).padStart(2, '0')}</td>
                <td style={{ padding: '7px 10px', fontWeight: 500 }}>{d.district}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{d.count.toLocaleString('en-IN')}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 11, color: d.change > 0 ? '#C62828' : '#1E7D32', fontWeight: 600 }}>
                  {d.change > 0 ? '+' : ''}{d.change.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly breakdown */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2744', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #E8ECF0' }}>3. Estimated Monthly Distribution</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
          {monthlyData.map(m => (
            <div key={m.month} style={{ textAlign: 'center' }}>
              <div style={{ height: 40, background: '#F4F6F8', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2 }}>
                <div style={{ width: '70%', background: '#1F5FAF', height: `${(m.crimes / Math.max(...monthlyData.map(x => x.crimes))) * 36}px` }} />
              </div>
              <div style={{ fontSize: 8, fontFamily: 'IBM Plex Mono', color: '#8C96A3', marginTop: 2 }}>{m.month}</div>
              <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: '#5F6B7A' }}>{(m.crimes / 1000).toFixed(1)}k</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #E8ECF0', fontSize: 10, color: '#8C96A3', display: 'flex', justifyContent: 'space-between' }}>
        <span>KSP SCRB — Internal Document — Not for Public Distribution</span>
        <span style={{ fontFamily: 'IBM Plex Mono' }}>Page 1 of 4</span>
      </div>
    </div>
  )
}

export default function Reports() {
  const { districtStats, forecasts } = useCrimeData()
  const [activeReport, setActiveReport] = useState('monthly')
  const [scheduleValue, setScheduleValue] = useState('monthly')
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  const districtNames = (districtStats || []).map(d => d.csvName).sort()

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate, preview, and export intelligence reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ height: 34, padding: '0 14px', border: '1px solid #C8D0DA', borderRadius: 3, background: '#fff', fontSize: 12, color: '#5F6B7A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3 6l3.5 3.5L10 6" stroke="#5F6B7A" strokeWidth="1.3"/>
              <path d="M1 11h11" stroke="#5F6B7A" strokeWidth="1.3"/>
            </svg>
            Download PDF
          </button>
          <button style={{ height: 34, padding: '0 14px', border: '1px solid #C8D0DA', borderRadius: 3, background: '#fff', fontSize: 12, color: '#5F6B7A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 4h11M1 8h11M4 1v11M9 1v11" stroke="#5F6B7A" strokeWidth="1.1"/>
            </svg>
            Export CSV
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select value={scheduleValue} onChange={e => setScheduleValue(e.target.value)} style={{ height: 34, padding: '0 8px', border: '1px solid #C8D0DA', borderRadius: 3, fontSize: 12, fontFamily: 'Inter' }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button style={{ height: 34, padding: '0 14px', background: '#1F5FAF', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>Schedule</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        {/* Report type list */}
        <div className="card">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #E8ECF0', fontSize: 11, fontWeight: 600, color: '#5F6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Report Types
          </div>
          <div>
            {REPORT_TYPES.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveReport(r.id)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  border: 'none',
                  borderLeft: activeReport === r.id ? '3px solid #1F5FAF' : '3px solid transparent',
                  background: activeReport === r.id ? '#EEF2F7' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid #F4F6F8',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: activeReport === r.id ? 500 : 400, color: activeReport === r.id ? '#1F5FAF' : '#1B1F23', marginBottom: 2 }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 10, color: '#8C96A3' }}>{r.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Report preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{REPORT_TYPES.find(r => r.id === activeReport)?.label}</span>
            <span className="card-meta" style={{ fontFamily: 'IBM Plex Mono' }}>Preview</span>
          </div>
          <div className="card-body">
            {activeReport === 'monthly' ? (
              <MonthlySummaryPreview districtStats={districtStats} forecasts={forecasts} />
            ) : (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#5F6B7A', fontWeight: 500, marginBottom: 6 }}>
                  {REPORT_TYPES.find(r => r.id === activeReport)?.label}
                </div>
                <div style={{ fontSize: 12, color: '#8C96A3' }}>
                  Select date range, districts, and parameters to generate this report preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 400, margin: '24px auto 0' }}>
                  <div className="control-group">
                    <div className="control-label">District</div>
                    <select className="control-select" style={{ width: '100%' }}>
                      <option>All Districts</option>
                      {districtNames.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="control-group">
                    <div className="control-label">Period</div>
                    <select className="control-select" style={{ width: '100%' }}>
                      <option>FY 2024</option>
                      <option>FY 2025 (Forecast)</option>
                    </select>
                  </div>
                </div>
                <button style={{ marginTop: 20, height: 36, padding: '0 24px', background: '#1F5FAF', color: '#fff', border: 'none', borderRadius: 3, fontSize: 13, cursor: 'pointer' }}>
                  Generate Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
