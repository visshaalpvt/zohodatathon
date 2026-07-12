import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // If roles are specified, enforce them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-alert-high)' }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Your current role ({user.role}) does not have permission to view this module.
          </p>
        </div>
      )
    }
  }

  return children
}
