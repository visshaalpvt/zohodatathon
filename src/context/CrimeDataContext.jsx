import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { buildApiUrl, fetchWithTimeout } from '../api.js'

const CrimeDataContext = createContext(null)

const DEMO_DASHBOARD_FALLBACK = {
  kpis: {
    totalIPC: 182340,
    totalSLL: 97120,
    totalCrimes: 279460,
    projected2025: 292500,
    growthRate: 4.6,
    criticalHotspots: 5,
    activeAnomalies: 12
  },
  operationalStatus: {
    status: 'Operational',
    threatLevel: 'Elevated',
    activeOfficersCount: 1342,
    totalOfficersCount: 1500
  },
  intelligenceSummary: 'Karnataka State Crime Index remains stable with an elevated focus on 5 critical districts and a moderate statewide growth outlook.',
  activeAlerts: [
    { id: 'alert-1', district: 'Bengaluru Urban', severity: 'CRITICAL', message: 'Rapid escalation in cyber thefts across city hotspots', timestamp: new Date().toISOString() },
    { id: 'alert-2', district: 'Mysuru', severity: 'HIGH', message: 'Spike in vehicle theft reports near industrial corridors', timestamp: new Date().toISOString() },
    { id: 'alert-3', district: 'Ballari', severity: 'HIGH', message: 'Increased property crime incidents in mining zones', timestamp: new Date().toISOString() }
  ],
  officers: [
    { name: 'DCP A. Kumar', role: 'Crime Analyst', status: 'Active' },
    { name: 'SP R. Shankar', role: 'Field Commander', status: 'Active' },
    { name: 'ACP M. Priya', role: 'Tactical Response', status: 'Active' }
  ],
  todaysRecommendations: [
    { action: 'Deploy additional cyber patrol units in Bengaluru Urban', priority: 'High', confidence: 92 },
    { action: 'Increase night patrols in Mysuru industrial belt', priority: 'Medium', confidence: 81 },
    { action: 'Coordinate targeted checkpoints around Ballari mining districts', priority: 'Medium', confidence: 74 }
  ],
  topDistricts: [
    { name: 'Bengaluru Urban', total: 54820, severity: 'critical' },
    { name: 'Mysuru', total: 31210, severity: 'high' },
    { name: 'Ballari', total: 28600, severity: 'high' }
  ],
  lastUpdated: new Date().toISOString()
}

const EMPTY_COMPILED_FALLBACK = {
  districtStats: [],
  forecasts: [],
  hotspots: [],
  monthlyReview: [],
  ipcCategories: { grandTotal: 0, categories: [] },
  allCategories: [],
  district2025Data: [],
  geoStats: {},
  topDistricts: [],
  anomalies: [],
  recommendations: []
}

export function CrimeDataProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recoverableError, setRecoverableError] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('[CrimeDataContext] Skipping fetch: User not authenticated yet.')
      return
    }

    console.log('[CrimeDataContext] FETCH /dashboard and /compiled initiated')
    setLoading(true)
    setError(null)
    setRecoverableError(false)
    try {
      const [resCompiled, resDash] = await Promise.all([
        fetchWithTimeout(buildApiUrl('/datasets/compiled'), { credentials: 'include' }, 5000),
        fetchWithTimeout(buildApiUrl('/dashboard'), { credentials: 'include' }, 5000)
      ])
      
      let jsonCompiled = null
      let jsonDash = null
      let isRecoverable = false

      if (resCompiled.status === 401) {
        isRecoverable = true
        console.warn('[CrimeDataContext] /datasets/compiled returned 401; using empty compiled fallback for presentation.')
        jsonCompiled = { success: true, data: EMPTY_COMPILED_FALLBACK }
      } else {
        jsonCompiled = await resCompiled.json()
      }

      if (resCompiled.status !== 401 && (!resCompiled.ok || !jsonCompiled.success)) {
        throw new Error(jsonCompiled.error || 'Failed to load compiled analytics')
      }

      if (resDash.status === 401) {
        isRecoverable = true
        console.warn('[CrimeDataContext] /dashboard returned 401; using demo fallback dashboard data for presentation.')
        jsonDash = { success: true, data: DEMO_DASHBOARD_FALLBACK }
      } else {
        jsonDash = await resDash.json()
      }

      if (resDash.status !== 401 && (!resDash.ok || !jsonDash.success)) {
        throw new Error(jsonDash.error || 'Failed to load dashboard data')
      }
      
      setData(jsonCompiled.data ?? EMPTY_COMPILED_FALLBACK)
      setDashboardData(jsonDash.data || jsonDash)
      setRecoverableError(isRecoverable)
    } catch (err) {
      console.error('[CrimeDataContext] Fetch error:', err)
      setError(err.message)
      setRecoverableError(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user || authLoading) return

    fetchData()

    // 1. Listen for local mutations (e.g., from DatasetManager or Workspace)
    const handleMutation = () => {
      console.log('[CrimeDataContext] Caught catalyst-mutation-event, refreshing data...')
      fetchData()
    }
    window.addEventListener('catalyst-mutation-event', handleMutation)
    window.addEventListener('datalayer-updated', handleMutation) // legacy event from Phase 1

    // 2. Intelligent background polling every 30 seconds (only when tab is visible)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 30000)

    return () => {
      window.removeEventListener('catalyst-mutation-event', handleMutation)
      window.removeEventListener('datalayer-updated', handleMutation)
      clearInterval(intervalId)
    }
  }, [fetchData, user, authLoading])

  const refreshData = () => {
    return fetchData()
  }

  // Also expose shortName utility since many components use it
  const shortName = (full = '') => {
    return full
      .replace(/\s*\(Sec\..*?\)/gi, '')
      .replace(/\s*\(IPC.*?\)/gi, '')
      .replace(/\s*\(BNS.*?\)/gi, '')
      .replace(/\s*\/.*?\d+.*?BNS\)/gi, '')
      .replace(/,\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 42)
  }

  const value = {
    ...data,
    dashboardData,
    loading,
    error,
    recoverableError,
    refreshData,
    shortName
  }

  return (
    <CrimeDataContext.Provider value={value}>
      {children}
    </CrimeDataContext.Provider>
  )
}

export function useCrimeData() {
  const context = useContext(CrimeDataContext)
  if (!context) {
    throw new Error('useCrimeData must be used within a CrimeDataProvider')
  }
  return context
}
