import { useState, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'

// Existing modules — reused as tab content
import CrimeMap from '../CrimeMap/CrimeMap'
import Hotspots from '../Hotspots/Hotspots'
import CategoryIntelligence from '../CategoryIntelligence/CategoryIntelligence'
import TrendDiscovery from '../TrendDiscovery/TrendDiscovery'
import RiskForecasting from '../RiskForecasting/RiskForecasting'
import AnomalyDetection from '../AnomalyDetection/AnomalyDetection'
import Recommendations from './Recommendations'
import DistrictComparison from './DistrictComparison'

const TABS = [
  { id: 'map',             label: 'Crime Map',             icon: '🗺️' },
  { id: 'hotspots',        label: 'Hotspots',              icon: '🔥' },
  { id: 'category',        label: 'Category Intelligence', icon: '📊' },
  { id: 'trends',          label: 'Trend Discovery',       icon: '📈' },
  { id: 'forecast',        label: 'Forecast',              icon: '🔮' },
  { id: 'anomaly',         label: 'Anomaly Detection',     icon: '⚠️' },
  { id: 'recommendations', label: 'Recommendations',       icon: '💡' },
  { id: 'comparison',      label: 'District Comparison',   icon: '⚖️' },
]

const TAB_COMPONENTS = {
  map:             CrimeMap,
  hotspots:        Hotspots,
  category:        CategoryIntelligence,
  trends:          TrendDiscovery,
  forecast:        RiskForecasting,
  anomaly:         AnomalyDetection,
  recommendations: Recommendations,
  comparison:      DistrictComparison,
}

export default function CrimeIntelligence() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'map'

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab] || CrimeMap

  return (
    <div className="intel-module">
      {/* Module Header */}
      <div className="intel-module-header">
        <div>
          <h1 className="page-title">Crime Intelligence</h1>
          <p className="page-subtitle">Comprehensive crime analytics, spatial intelligence, forecasting, and recommendations</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="intel-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`intel-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="intel-tab-icon">{tab.icon}</span>
            <span className="intel-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="intel-tab-content" key={activeTab}>
        <ActiveComponent />
      </div>
    </div>
  )
}
