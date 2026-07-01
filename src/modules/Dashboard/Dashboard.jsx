import { kpis, districtStats, ipcCategories, sllCategories, monthlyComparison, hotspots } from '../../data/dataLayer'
import KPIRow from './KPIRow'
import MonthlyTrendChart from './MonthlyTrendChart'
import CategoryBarChart from './CategoryBarChart'
import DistrictRankTable from './DistrictRankTable'
import CrimeHeatmap from './CrimeHeatmap'

export default function Dashboard() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Executive Crime Dashboard</h1>
        <p className="page-subtitle">Karnataka State — Dataset-Driven Operational Summary · Sources: 5 KSP CSV Datasets</p>
      </div>

      <KPIRow kpis={kpis} />

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
