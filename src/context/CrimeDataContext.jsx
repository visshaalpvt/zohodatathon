import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { buildApiUrl } from '../api.js'

const CrimeDataContext = createContext(null)

export function CrimeDataProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('[CrimeDataContext] Skipping fetch: User not authenticated yet.')
      return
    }

    console.log('[CrimeDataContext] FETCH /dashboard and /compiled initiated')
    setLoading(true)
    setError(null)
    try {
      const [resCompiled, resDash] = await Promise.all([
        fetch(buildApiUrl('/datasets/compiled'), { credentials: 'include' }),
        fetch(buildApiUrl('/dashboard'), { credentials: 'include' })
      ])
      
      const jsonCompiled = await resCompiled.json()
      const jsonDash = await resDash.json()
      
      if (!resCompiled.ok || !jsonCompiled.success) {
        throw new Error(jsonCompiled.error || 'Failed to load compiled analytics')
      }
      
      setData(jsonCompiled.data)
      setDashboardData(jsonDash.data || jsonDash)
    } catch (err) {
      console.error('[CrimeDataContext] Fetch error:', err)
      setError(err.message)
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
