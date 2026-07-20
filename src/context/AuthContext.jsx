import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const DEMO_USER = {
  name: 'Demo Officer',
  role: 'Administrator',
  authenticated: true,
}

function getStoredDemoUser() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem('demo_authenticated') === 'true' ? { ...DEMO_USER } : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredDemoUser())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = () => setError(null)

  const login = () => {
    const nextUser = { ...DEMO_USER }
    setUser(nextUser)
    setError(null)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo_authenticated', 'true')
    }
  }

  const logout = () => {
    setUser(null)
    setError(null)

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('demo_authenticated')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, clearError, login, logout }}>
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
