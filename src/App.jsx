import { Component, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TopBar from './components/shell/TopBar'
import LeftNav from './components/shell/LeftNav'
import { useCrimeData } from './context/CrimeDataContext'
import { useAuth } from './context/AuthContext'
import Login from './modules/Authentication/Login'
import ProtectedRoute from './components/shared/ProtectedRoute'

// Module imports — eager load core dashboards/views
import Dashboard from './modules/Dashboard/Dashboard'
import CrimeMap from './modules/CrimeMap/CrimeMap'
import Hotspots from './modules/Hotspots/Hotspots'
import TrendDiscovery from './modules/TrendDiscovery/TrendDiscovery'
import RiskForecasting from './modules/RiskForecasting/RiskForecasting'
import AnomalyDetection from './modules/AnomalyDetection/AnomalyDetection'
import Reports from './modules/Reports/Reports'
import CrimeIntelCopilot from './modules/CrimeIntelCopilot/CrimeIntelCopilot'
import Alerts from './modules/Alerts/Alerts'
import Administration from './modules/Administration/Administration'

// Lazy load new modules
const CriminalNetworks = lazy(() => import('./modules/CriminalNetworks/CriminalNetworks'))
const SociologicalInsights = lazy(() => import('./modules/SociologicalInsights/SociologicalInsights'))
const Recommendations = lazy(() => import('./modules/Recommendations/Recommendations'))
const Workspace = lazy(() => import('./modules/Workspace/Workspace'))
const Bookmarks = lazy(() => import('./modules/Bookmarks/Bookmarks'))
const Notes = lazy(() => import('./modules/Notes/Notes'))
const Notifications = lazy(() => import('./modules/Notifications/Notifications'))
const DatasetManager = lazy(() => import('./modules/DatasetManager/DatasetManager'))
const Settings = lazy(() => import('./modules/Settings/Settings'))
const SystemHealth = lazy(() => import('./modules/SystemHealth/SystemHealth'))

let appRenderCount = 0

function LoadingFallback({ message = 'Loading module...' }) {
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
        {message}
      </div>
    </div>
  )
}

function ErrorFallback({ error }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 16, padding: 24, textAlign: 'center'
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="var(--color-alert-high)" strokeWidth="3"/>
        <path d="M24 14V26" stroke="var(--color-alert-high)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="24" cy="34" r="2" fill="var(--color-alert-high)"/>
      </svg>
      <div>
        <h2 style={{ fontSize: 18, color: 'var(--color-text-primary)', marginBottom: 8 }}>System Initialization Failed</h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 400 }}>
          {error}
        </p>
      </div>
    </div>
  )
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary] Module render failed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 8 }}>This section is unavailable right now.</div>
          <div style={{ padding: 20, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>This section is unavailable.</strong>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 13 }}>
              The selected module encountered an error. Please choose another item from the sidebar.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { loading: dataLoading, error: dataError, recoverableError } = useCrimeData()
  const isRecoverableDataError = recoverableError || (dataError && /authentication required|unauthorized|401/i.test(dataError))

  appRenderCount += 1
  console.log('[App] COMPONENT RENDER', {
    renderCount: appRenderCount,
    user,
    authLoading,
    dataLoading,
    dataError,
    recoverableError,
  })

  // Auth Loading Gate:
  if (authLoading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <LoadingFallback message="Authenticating..." />
      </div>
    )
  }

  // User Check Gate:
  if (!user) {
    return <Login />
  }

  // Email Verification Gate:
  // Catalyst returns status 'Unverified' or 'verified' usually, or we can check user.status / is_verified from the DB
  const isUnverified = user.status && user.status.toLowerCase() === 'unverified'
  if (isUnverified) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40, background: 'var(--color-bg-secondary)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <h2 style={{ marginBottom: 8, color: 'var(--color-text-primary)' }}>Please verify your email</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 300, margin: '0 auto 24px auto', fontSize: 14 }}>
            We've sent a verification link to your email address. Please click the link to activate your account.
          </p>
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            I have verified my email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <LeftNav />
        <main className="content-area">
          {!isRecoverableDataError && dataError ? (
            <ErrorFallback error={dataError} />
          ) : dataLoading ? (
            <LoadingFallback message="Initializing Enterprise Data Layer..." />
          ) : (
            <AppErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                {/* 10 Intelligence Modules */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<CrimeMap />} />
                <Route path="/hotspots" element={<Hotspots />} />
                <Route path="/networks" element={<CriminalNetworks />} />
                <Route path="/trends" element={<TrendDiscovery />} />
                <Route path="/sociological" element={<SociologicalInsights />} />
                <Route path="/forecast" element={<RiskForecasting />} />
                <Route path="/anomaly" element={<AnomalyDetection />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/recommendations" element={<Recommendations />} />

                {/* Workspace Modules */}
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/notifications" element={<Notifications />} />

                {/* System Services */}
                <Route path="/copilot" element={<CrimeIntelCopilot />} />
                <Route path="/datasets" element={
                  <ProtectedRoute allowedRoles={['System Admin', 'Supervisor']}>
                    <DatasetManager />
                  </ProtectedRoute>
                } />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/health" element={<SystemHealth />} />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['System Admin', 'Supervisor']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['System Admin']}>
                    <Administration />
                  </ProtectedRoute>
                } />

                {/* Fallback — redirect to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
          )}
        </main>
      </div>
    </div>
  )
}
