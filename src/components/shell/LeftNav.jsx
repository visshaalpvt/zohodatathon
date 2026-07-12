import { useLocation, useNavigate } from 'react-router-dom'

const INTEL_NAV_ITEMS = [
  {
    id: '/', label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )
  },
  {
    id: '/map', label: 'Crime Map',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.1"/>
        <circle cx="9" cy="9" r="1" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: '/hotspots', label: 'Hotspot Intelligence',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M9 2C6 5 3 7.5 3 11C3 14.3 5.7 17 9 17C12.3 17 15 14.3 15 11C15 7.5 12 5 9 2Z" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="9" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    )
  },
  {
    id: '/networks', label: 'Criminal Networks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="14" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="8" cy="14" r="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5.5 5.5L12.5 6.5M5.5 5L7 12M13 7.5L9.5 12.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/trends', label: 'Trend Discovery',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M2 16H16M3 12L7 7.5L11 9.5L15 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: '/sociological', label: 'Sociological Insights',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M3 3V15H15M6 11L10 6L14 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="6" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="10" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: '/forecast', label: 'Risk Forecasting',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M9 1V3M9 15V17M1 9H3M15 9H17" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <path d="M6 9.5L8.5 7L11.5 9.5L14 7" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    )
  },
  {
    id: '/anomaly', label: 'Anomaly Detection',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M9 2L16 15H2L9 2Z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M9 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="13" r="0.8" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: '/reports', label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M4 2H12L15 5V16H4V2Z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M12 2V5H15" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M6 8H13M6 11H11M6 14H9" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/recommendations', label: 'Recommendations',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M9 1L11.5 6L17 7L13 11L14 16.5L9 14L4 16.5L5 11L1 7L6.5 6L9 1Z" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )
  },
]

const WORKSPACE_NAV_ITEMS = [
  {
    id: '/workspace', label: 'Officer Workspace',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2 7H16M6 3V15" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/bookmarks', label: 'Bookmarks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M4 2H14V16L9 12L4 16V2Z" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )
  },
  {
    id: '/notes', label: 'Officer Notes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M12 2H3C2.4 2 2 2.4 2 3V15C2 15.6 2.4 16 3 16H15C15.6 16 16 15.6 16 15V6L12 2Z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M11 2V7H16M5 10H13M5 13H10" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/notifications', label: 'Notifications',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M8.5 1C5.5 1 3 3.5 3 6.5V11.5L1 13.5V14.5H16V13.5L14 11.5V6.5C14 3.5 11.5 1 8.5 1Z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6.5 14.5C6.5 15.6 7.4 16.5 8.5 16.5C9.6 16.5 10.5 15.6 10.5 14.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )
  },
]

const SYSTEM_NAV_ITEMS = [
  {
    id: '/copilot', label: 'AI Copilot',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M9 1L3 4.5V9C3 13.5 5.8 17.2 9 18C12.2 17.2 15 13.5 15 9V4.5L9 1Z" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 12.5C6 10.8 7.3 10 9 10C10.7 10 12 10.8 12 12.5" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    )
  },
  {
    id: '/datasets', label: 'Dataset Manager',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M2 5C2 3.89543 5.13401 3 9 3C12.866 3 16 3.89543 16 5M2 5C2 6.10457 5.13401 7 9 7C12.866 7 16 6.10457 16 5M2 5V13C2 14.1046 5.13401 15 9 15C12.866 15 16 14.1046 16 13V5M2 9C2 10.1046 5.13401 11 9 11C12.866 11 16 10.1046 16 9" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )
  },
  {
    id: '/alerts', label: 'System Alerts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M9 2C6.2 2 4 4.2 4 7V11L2 13V14H16V13L14 11V7C14 4.2 11.8 2 9 2Z" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )
  },
  {
    id: '/health', label: 'System Health',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M2 9L5 9L7 4L11 14L13 9L16 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: '/settings', label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M9 2V4M9 14V16M4 9H2M16 9H14M4 4L5.5 5.5M12.5 12.5L14 14M14 4L12.5 5.5M5.5 12.5L4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: '/admin', label: 'Administration',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M9 1V3.5M9 14.5V17M1 9H3.5M14.5 9H17M3.2 3.2L5 5M13 13L14.8 14.8M14.8 3.2L13 5M5 13L3.2 14.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  },
]

export default function LeftNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  const isActive = (id) => {
    if (id === '/') return currentPath === '/'
    return currentPath.startsWith(id)
  }

  const renderNavSection = (label, items) => (
    <>
      <div className="leftnav-section-label">{label}</div>
      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-item${isActive(item.id) ? ' active' : ''}`}
          onClick={() => navigate(item.id)}
          aria-current={isActive(item.id) ? 'page' : undefined}
        >
          <span className="nav-item-icon">{item.icon}</span>
          <span className="nav-item-label">{item.label}</span>
          {item.id === '/alerts' && (
            <span className="nav-item-badge">3</span>
          )}
        </button>
      ))}
      <div className="leftnav-divider" />
    </>
  )

  return (
    <nav className="leftnav" aria-label="Main navigation">
      {renderNavSection('INTELLIGENCE MODULES', INTEL_NAV_ITEMS)}
      {renderNavSection('OFFICER WORKSPACE', WORKSPACE_NAV_ITEMS)}
      {renderNavSection('SYSTEM SERVICES', SYSTEM_NAV_ITEMS)}
      
      <div className="leftnav-footer">
        <div className="leftnav-version">
          <span className="leftnav-version-dot" />
          CrimeVision AI v2.1
        </div>
      </div>
    </nav>
  )
}
