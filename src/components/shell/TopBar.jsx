export default function TopBar() {
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

      <div className="topbar-search">
        <input
          type="text"
          placeholder="Search districts, crime categories, reports..."
          aria-label="Search"
        />
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

      <div className="topbar-actions">
        <button className="topbar-icon-btn" aria-label="Notifications" title="Notifications">
          <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
            <path d="M8.5 1C5.5 1 3 3.5 3 6.5V11.5L1 13.5V14.5H16V13.5L14 11.5V6.5C14 3.5 11.5 1 8.5 1Z" stroke="#94A3B8" strokeWidth="1.3" fill="none"/>
            <path d="M6.5 14.5C6.5 15.6 7.4 16.5 8.5 16.5C9.6 16.5 10.5 15.6 10.5 14.5" stroke="#94A3B8" strokeWidth="1.3"/>
          </svg>
          <span className="notif-badge">7</span>
        </button>
      </div>

      <button className="topbar-user" aria-label="User menu">
        <div className="user-avatar">RK</div>
        <span className="user-name">SP Ramesh Kumar</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{marginLeft: 2}}>
          <path d="M1 1L5 5L9 1" stroke="#475569" strokeWidth="1.3"/>
        </svg>
      </button>
    </header>
  )
}
