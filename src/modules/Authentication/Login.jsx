import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()

  const handleSubmit = (event) => {
    event.preventDefault()
    login()
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: 440, maxWidth: '90%', overflow: 'hidden' }}>
        <div className="card-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="topbar-logo-icon" style={{ width: 48, height: 48 }}>
              <svg width="24" height="26" viewBox="0 0 18 20" fill="none">
                <path d="M9 0L0 3.5V9.5C0 14.7 3.9 19.6 9 21C14.1 19.6 18 14.7 18 9.5V3.5L9 0Z" fill="#3B82F6" />
                <path d="M7 10.5L5 8.5L3.5 10L7 13.5L14.5 6L13 4.5L7 10.5Z" fill="white" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 className="page-title" style={{ fontSize: 24 }}>CrimeVision AI</h1>
              <p className="page-subtitle" style={{ marginTop: 4 }}>Enterprise Intelligence Portal</p>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: '24px 20px', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, marginBottom: 8, color: 'var(--color-text-primary)' }}>Demo access ready</h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Enter the demo experience instantly with a mock officer identity and local session persistence.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Continue to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
