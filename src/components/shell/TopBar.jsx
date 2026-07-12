import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const BREADCRUMB_MAP = {
  '/': 'Dashboard',
  '/intelligence': 'Crime Intelligence',
  '/copilot': 'AI Copilot',
  '/reports': 'Reports',
  '/alerts': 'Alerts',
  '/admin': 'Administration',
}

const TAB_NAMES = {
  'map': 'Crime Map',
  'hotspots': 'Hotspots',
  'category': 'Category Intelligence',
  'trends': 'Trend Discovery',
  'forecast': 'Forecast',
  'anomaly': 'Anomaly Detection',
  'recommendations': 'Recommendations',
  'comparison': 'District Comparison',
  'datasets': 'Dataset Manager',
  'users': 'Users',
  'roles': 'Roles',
  'permissions': 'Permissions',
  'quickml': 'QuickML Config',
  'health': 'System Health',
  'audit': 'Audit Logs',
  'settings': 'Settings',
}

export default function TopBar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const path = location.pathname
  const params = new URLSearchParams(location.search)
  const tab = params.get('tab')

  // Build breadcrumb
  const baseRoute = '/' + (path.split('/')[1] || '')
  const baseName = BREADCRUMB_MAP[baseRoute] || BREADCRUMB_MAP['/']
  const tabName = tab ? TAB_NAMES[tab] : null

  // User initials
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SP'

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <div className="topbar-logo-icon">
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path d="M9 0L0 3.5V9.5C0 14.7 3.9 19.6 9 21C14.1 19.6 18 14.7 18 9.5V3.5L9 0Z" fill="#2563EB"/>
            <path d="M7 10.5L5 8.5L3.5 10L7 13.5L14.5 6L13 4.5L7 10.5Z" fill="white"/>
          </svg>
        </div>
        <div>
          <div className="topbar-logo-text">CrimeVision AI</div>
          <div className="topbar-logo-sub">Karnataka State Police Intelligence</div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-item">{baseName}</span>
        {tabName && (
          <>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="breadcrumb-sep">
              <path d="M1 1L5 5L1 9" stroke="var(--color-text-muted)" strokeWidth="1.2"/>
            </svg>
            <span className="breadcrumb-item active">{tabName}</span>
          </>
        )}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-daterange">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="2" width="11" height="10" rx="1" stroke="#475569" strokeWidth="1.2" fill="none"/>
          <path d="M4 1v2M9 1v2M1 5h11" stroke="#475569" strokeWidth="1.2"/>
        </svg>
        01 Jan 2024 — 31 Dec 2024
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#475569" strokeWidth="1.3"/>
        </svg>
      </div>

      {/* Role Badge */}
      <div className="topbar-role-badge">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 0L0 2V5C0 7.8 2.2 10.4 5 11C7.8 10.4 10 7.8 10 5V2L5 0Z" fill="var(--color-accent-alt)" opacity="0.3"/>
          <path d="M5 0L0 2V5C0 7.8 2.2 10.4 5 11C7.8 10.4 10 7.8 10 5V2L5 0Z" stroke="var(--color-accent-alt)" strokeWidth="0.8"/>
        </svg>
        {user?.role || 'Officer'}
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon-btn" aria-label="Notifications" title="Notifications">
          <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
            <path d="M8.5 1C5.5 1 3 3.5 3 6.5V11.5L1 13.5V14.5H16V13.5L14 11.5V6.5C14 3.5 11.5 1 8.5 1Z" stroke="#94A3B8" strokeWidth="1.3" fill="none"/>
            <path d="M6.5 14.5C6.5 15.6 7.4 16.5 8.5 16.5C9.6 16.5 10.5 15.6 10.5 14.5" stroke="#94A3B8" strokeWidth="1.3"/>
          </svg>
          <span className="notif-badge">7</span>
        </button>
      </div>

      <button className="topbar-user" onClick={logout} aria-label="Logout" title="Click to logout">
        <div className="user-avatar">{initials}</div>
        <span className="user-name">{user?.name || 'User'}</span>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style={{marginLeft: 4, color: 'var(--color-text-muted)'}}>
          <path d="M6.5 15.5H3.5C3.1 15.5 2.7 15.3 2.5 15.1C2.2 14.8 2 14.4 2 14V4C2 3.6 2.2 3.2 2.5 2.9C2.7 2.7 3.1 2.5 3.5 2.5H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.5 12.5L16 9L12.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 9H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </header>
  )
}
