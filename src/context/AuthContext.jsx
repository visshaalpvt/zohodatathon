import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const clearError = () => setError(null)

  const fetchSession = async () => {
    console.log('[AuthContext] FETCH /me initiated')
    try {
      const res = await fetch('/server/zohodatathon_function/me', {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success && data.data) {
        console.log('[AuthContext] SESSION FOUND:', data.data.email)
        setUser(data.data)
      } else {
        console.log('[AuthContext] SESSION NOT FOUND via /me')
        setUser(null)
        // Clear native SDK session if desynchronized from backend to allow login widget to render
        if (window.catalyst && window.catalyst.auth) {
          window.catalyst.auth.isUserAuthenticated()
            .then(() => {
              console.warn('[AuthContext] Desync detected: Native SDK has session, but backend `/me` is empty. Signing out natively.');
              window.catalyst.auth.signOut().catch(err => console.error('[AuthContext] Signout sync error:', err));
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('[AuthContext] Auth check failed:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('[AuthContext] APP START - AUTH CHECK')
    
    // Safety timeout: force loading=false after 5 seconds to prevent permanent "Authenticating..." spinner
    const timer = setTimeout(() => {
      console.warn('[AuthContext] Safety timeout triggered. Forcing authentication loading state to false.');
      setLoading(false);
    }, 5000);

    const onAuthChecked = () => {
      clearTimeout(timer);
    };

    if (window.catalyst && window.catalyst.auth) {
      window.catalyst.auth.isUserAuthenticated()
        .then(userResponse => {
          console.log('[AuthContext] Catalyst SDK: Active session verified natively.');
          fetchSession().then(onAuthChecked).catch(onAuthChecked);
        })
        .catch(err => {
          console.log('[AuthContext] Catalyst SDK: No active native session detected. Falling back to backend.');
          fetchSession().then(onAuthChecked).catch(onAuthChecked);
        })
    } else {
      console.log('[AuthContext] Catalyst SDK not ready, falling back to /me fetch')
      fetchSession().then(onAuthChecked).catch(onAuthChecked);
    }

    return () => clearTimeout(timer);
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
