import { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const clearError = () => setError(null)

  const fetchSession = async () => {
    console.log('[AuthContext] FETCH /me initiated')
    try {
      const res = await fetch(buildApiUrl('/me'), {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success && data.data) {
        console.log('[AuthContext] SESSION FOUND:', data.data.email)
        setUser(data.data)
      } else {
        console.log('[AuthContext] SESSION NOT FOUND via /me')
        setUser(null)
      }
    } catch (err) {
      console.error('[AuthContext] Auth check failed:', err)
      setUser(null)
    }
  }

  useEffect(() => {
    console.log('[AuthContext] APP START - AUTH CHECK')

    let isMounted = true
    let settled = false
    const globalTimer = window.setTimeout(() => {
      console.warn('[AuthContext] Global auth safety timeout triggered. Forcing authentication loading state to false.')
      if (!settled && isMounted) {
        settled = true
        setLoading(false)
      }
    }, 6000)

    const finishAuth = () => {
      if (settled || !isMounted) {
        return
      }

      settled = true
      clearTimeout(globalTimer)
      setLoading(false)
    }

    const runAuthCheck = async () => {
      try {
        await fetchSession()
      } catch (err) {
        console.error('[AuthContext] Initial auth check failed:', err)
      } finally {
        finishAuth()
      }
    }

    runAuthCheck()

    return () => {
      isMounted = false
      settled = true
      clearTimeout(globalTimer)
    }
  }, [])

  const logout = async () => {
    try {
      if (window.catalyst && window.catalyst.auth) {
        await window.catalyst.auth.signOut()
      } else {
        window.location.href = '/__catalyst/auth/logout'
      }
    } catch (err) {
      console.error("Logout failed:", err)
      window.location.href = '/__catalyst/auth/logout'
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, clearError, fetchSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
