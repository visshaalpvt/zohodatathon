import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  {
    id: '/', label: 'Command Center', group: 'overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L2 4V8C2 12 4.8 15 8 16C11.2 15 14 12 14 8V4L8 1Z" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/dashboard', label: 'Dashboard', group: 'overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    )
  },
  { divider: true },
  {
    id: '/crime-analytics', label: 'Crime Analytics', group: 'analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 1.5V8L12 12" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    )
  },
  {
    id: '/hotspots', label: 'Hotspot Intelligence', group: 'analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1C5 1 3 3.5 3 6C3 10 8 15 8 15C8 15 13 10 13 6C13 3.5 11 1 8 1Z" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/category-intel', label: 'Category Intelligence', group: 'analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="11" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="9" y="11" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/trends', label: 'Trend Discovery', group: 'analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 12L5 8L8 10L11 5L15 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M1 15H15" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/sociological', label: 'Sociological Insights', group: 'analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="11" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 7L8 10M7 8L11 6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/>
      </svg>
    )
  },
  {
    id: '/forecasting', label: 'Risk Forecasting', group: 'analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 13L5 9L8 10.5L11 6L14 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M11 6L14 6L14 9" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 15H15" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  { divider: true },
  {
    id: '/anomaly', label: 'Anomaly Detection', group: 'intel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L15 13.5H1L8 1Z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 6V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="11.5" r="0.8" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: '/copilot', label: 'Crime Intel Copilot', group: 'intel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L2 4V8C2 12.4 4.8 16.5 8 17.5C11.2 16.5 14 12.4 14 8V4L8 1Z" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 11C5 9.3 6.3 8.5 8 8.5C9.7 8.5 11 9.3 11 11" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    )
  },
  {
    id: '/reports', label: 'Reports', group: 'intel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2H10L13 5V14H3V2Z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 8H11M5 10.5H9" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  { divider: true },
  {
    id: '/briefings', label: 'Briefing Generator', group: 'advanced',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 4H11M5 7H11M5 10H8" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/network', label: 'Intelligence Network', group: 'advanced',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="3" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="3" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 5V7L3 10M8 7L13 10" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    )
  },
  {
    id: '/workspace', label: 'Officer Workspace', group: 'advanced',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 6H15" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 6V14" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/agents', label: 'Multi-Agent AI', group: 'advanced',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="11" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M1 12C1 9.5 3 8 5 8C6.2 8 7 8.4 7.5 9" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M15 12C15 9.5 13 8 11 8C9.8 8 9 8.4 8.5 9" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="8" cy="11" r="2" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: '/simulation', label: 'Scenario Simulation', group: 'advanced',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="10" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 6H9M7 8H9M7 10H9" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
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

  return (
    <nav className="leftnav" aria-label="Main navigation">
      {NAV_ITEMS.map((item, i) => {
        if (item.divider) return <div key={`div-${i}`} className="leftnav-divider" />
        return (
          <button
            key={item.id}
            className={`nav-item${isActive(item.id) ? ' active' : ''}`}
            onClick={() => navigate(item.id)}
            aria-current={isActive(item.id) ? 'page' : undefined}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
