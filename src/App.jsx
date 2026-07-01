import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import TopBar from './components/shell/TopBar'
import LeftNav from './components/shell/LeftNav'

// Existing modules (eager load — already present in bundle)
import Dashboard from './modules/Dashboard/Dashboard'
import CrimeMap from './modules/CrimeMap/CrimeMap'
import Hotspots from './modules/Hotspots/Hotspots'
import CategoryIntelligence from './modules/CategoryIntelligence/CategoryIntelligence'
import TrendDiscovery from './modules/TrendDiscovery/TrendDiscovery'
import SociologicalInsights from './modules/SociologicalInsights/SociologicalInsights'
import RiskForecasting from './modules/RiskForecasting/RiskForecasting'
import AnomalyDetection from './modules/AnomalyDetection/AnomalyDetection'
import CrimeIntelCopilot from './modules/CrimeIntelCopilot/CrimeIntelCopilot'
import Reports from './modules/Reports/Reports'

// New modules (lazy load)
const CommandCenter = lazy(() => import('./modules/CommandCenter/CommandCenter'))
const DistrictProfile = lazy(() => import('./modules/DistrictProfile/DistrictProfile'))
const BriefingGenerator = lazy(() => import('./modules/BriefingGenerator/BriefingGenerator'))
const NetworkGraph = lazy(() => import('./modules/NetworkGraph/NetworkGraph'))
const OfficerWorkspace = lazy(() => import('./modules/OfficerWorkspace/OfficerWorkspace'))
const MultiAgent = lazy(() => import('./modules/MultiAgent/MultiAgent'))
const ScenarioSimulation = lazy(() => import('./modules/ScenarioSimulation/ScenarioSimulation'))

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 12,
    }}>
      <div className="intel-spinner" />
      <div style={{
        fontFamily: 'var(--font-data)', fontSize: 12,
        color: 'var(--color-text-muted)',
      }}>
        Loading module...
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <LeftNav />
        <main className="content-area">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* New: AI Command Center as landing page */}
              <Route path="/" element={<CommandCenter />} />

              {/* Existing modules — preserved exactly */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/crime-analytics" element={<CrimeMap />} />
              <Route path="/hotspots" element={<Hotspots />} />
              <Route path="/category-intel" element={<CategoryIntelligence />} />
              <Route path="/trends" element={<TrendDiscovery />} />
              <Route path="/sociological" element={<SociologicalInsights />} />
              <Route path="/forecasting" element={<RiskForecasting />} />
              <Route path="/anomaly" element={<AnomalyDetection />} />
              <Route path="/copilot" element={<CrimeIntelCopilot />} />
              <Route path="/reports" element={<Reports />} />

              {/* New modules — lazy loaded */}
              <Route path="/district/:districtName" element={<DistrictProfile />} />
              <Route path="/briefings" element={<BriefingGenerator />} />
              <Route path="/network" element={<NetworkGraph />} />
              <Route path="/workspace" element={<OfficerWorkspace />} />
              <Route path="/agents" element={<MultiAgent />} />
              <Route path="/simulation" element={<ScenarioSimulation />} />

              {/* Fallback */}
              <Route path="*" element={<CommandCenter />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
