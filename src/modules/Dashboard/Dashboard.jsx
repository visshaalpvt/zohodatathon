import { useCrimeData } from '../../context/CrimeDataContext'
import KPIRow from './KPIRow'
import MonthlyTrendChart from './MonthlyTrendChart'
import CategoryBarChart from './CategoryBarChart'
import DistrictRankTable from './DistrictRankTable'
import CrimeHeatmap from './CrimeHeatmap'
import Badge from '../../components/shared/Badge'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const { 
    dashboardData, 
    forecasts = [], 
    kpis = { total2024: 0, growthRateTotal: 0, total2025: 0, totalDistricts: 0 }, 
    districtStats = [], 
    monthlyComparison = [], 
    ipcCategories = { grandTotal: 0, categories: [] } 
  } = useCrimeData()

  // AI Insights — from backend dashboard API
  const topRecs = dashboardData?.todaysRecommendations?.slice(0, 3) || []

  // Forecast Summary — top 3 districts with highest projected growth
  const topForecasts = [...forecasts]
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 3)

  // Active Alerts count from backend dashboard API alerts
  const criticalAnomalies = dashboardData?.activeAlerts?.filter(a => a.severity === 'CRITICAL')?.length || 0
  const warningAnomalies = dashboardData?.activeAlerts?.filter(a => a.severity === 'HIGH')?.length || 0

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Crime Dashboard</h1>
          <p className="page-subtitle">Karnataka State — Real-time Operational Summary · Sources: 5 KSP CSV Datasets</p>
        </div>
        <div className="dash-dataset-version">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="var(--color-alert-low)" strokeWidth="1.5" fill="none"/>
            <path d="M6 3.5V6.5L8 8" stroke="var(--color-alert-low)" strokeWidth="1.2"/>
          </svg>
          <span>Dataset v1.0 · Updated Dec 2024</span>
        </div>
      </div>

      {/* Spec-mandated KPI Cards */}
      <KPIRow kpis={kpis} />

      {/* Quick Actions + Active Alerts */}
      <div className="dash-actions-row mb-md">
        <div className="dash-quick-actions">
          <button className="dash-action-btn" onClick={() => navigate('/reports')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 2H10L13 5V14H3V2Z"/>
              <path d="M10 2V5H13"/>
            </svg>
            Generate Report
          </button>
          <button className="dash-action-btn" onClick={() => navigate('/copilot')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 1L2 4V8C2 12.4 4.8 16.5 8 17.5C11.2 16.5 14 12.4 14 8V4L8 1Z"/>
              <circle cx="8" cy="7" r="2"/>
            </svg>
            Open Copilot
          </button>
          <button className="dash-action-btn" onClick={() => navigate('/admin?tab=datasets')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 1V11M5 8L8 11L11 8"/>
              <path d="M2 13H14"/>
            </svg>
            Upload Dataset
          </button>
          <button className="dash-action-btn" onClick={() => navigate('/alerts')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 1L15 13.5H1L8 1Z"/>
              <path d="M8 6V9.5" strokeLinecap="round"/>
            </svg>
            View Alerts
            <Badge type="critical">{criticalAnomalies + warningAnomalies}</Badge>
          </button>
        </div>
      </div>

      {/* AI Insights + Forecast Summary */}
      <div className="grid-5050 mb-md">
        <div className="card dash-insights-card">
          <div className="card-header">
            <span className="card-title">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--color-accent-alt)" style={{ marginRight: 6 }}>
                <path d="M8 0L10 6H16L11 9.5L13 16L8 12L3 16L5 9.5L0 6H6L8 0Z"/>
              </svg>
              AI Insights
            </span>
            <span className="card-meta">Top recommendations for {districtStats[0]?.csvName}</span>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {topRecs.map((rec, i) => (
              <div key={i} className="dash-insight-item">
                <div className="dash-insight-action">{rec.action}</div>
                <div className="dash-insight-meta">
                  <Badge type={rec.priority === 'High' ? 'critical' : 'warning'}>{rec.priority}</Badge>
                  <span className="dash-insight-confidence">{rec.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dash-forecast-card">
          <div className="card-header">
            <span className="card-title">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-accent-alt)" strokeWidth="1.4" style={{ marginRight: 6 }}>
                <path d="M2 13L5 9L8 10.5L11 6L14 2"/>
                <path d="M11 6L14 6L14 9"/>
              </svg>
              Forecast Summary
            </span>
            <span className="card-meta">Highest projected growth districts</span>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {topForecasts.map((f, i) => (
              <div key={i} className="dash-forecast-item">
                <div className="dash-forecast-district">{f.district}</div>
                <div className="dash-forecast-stats">
                  <span className="dash-forecast-growth" style={{ color: f.growthRate > 0 ? 'var(--color-alert-high)' : 'var(--color-alert-low)' }}>
                    {f.growthRate > 0 ? '▲' : '▼'} {Math.abs(f.growthRate).toFixed(1)}%
                  </span>
                  <span className="dash-forecast-proj">
                    {f.projected2025?.toLocaleString('en-IN')} → {f.projected2026?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-6040 mb-md">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Crime Review</span>
            <span className="card-meta">Current month vs prev month vs prev year · Source: f3dc65a9</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <MonthlyTrendChart data={monthlyComparison} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">IPC Crime Category Distribution</span>
            <span className="card-meta">Karnataka 2024 · {ipcCategories.grandTotal.toLocaleString('en-IN')} total IPC cases</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <CategoryBarChart data={ipcCategories.categories.slice(0,10)} />
          </div>
        </div>
      </div>

      <div className="grid-4060">
        <div className="card">
          <div className="card-header">
            <span className="card-title">District Rankings by Total Crimes</span>
            <span className="card-meta">Source: 2a1e057f — 2024</span>
          </div>
          <DistrictRankTable data={districtStats.slice(0,12)} />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Crime Intensity Heatmap</span>
            <span className="card-meta">Key categories × Top 8 districts · 2024</span>
          </div>
          <div className="card-body">
            <CrimeHeatmap districtStats={districtStats.slice(0,8)} />
          </div>
        </div>
      </div>
    </div>
  )
}
