import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const ADMIN_TABS = [
  { id: 'users',       label: 'Users',            icon: '👤' },
  { id: 'roles',       label: 'Roles',            icon: '🔑' },
  { id: 'permissions', label: 'Permissions',       icon: '🛡️' },
  { id: 'quickml',     label: 'QuickML Config',    icon: '🧠' },
  { id: 'testing',     label: 'Automated Testing', icon: '🧪' },
  { id: 'audit',       label: 'Audit Logs',        icon: '📋' },
]

// Placeholder for modules not yet built
function PlaceholderTab({ title, description }) {
  return (
    <div className="admin-placeholder">
      <div className="admin-placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="4" width="40" height="40" rx="8" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3"/>
          <path d="M24 16V32M16 24H32" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="admin-placeholder-title">{title}</div>
      <div className="admin-placeholder-desc">{description}</div>
      <div className="admin-placeholder-badge">
        <span className="badge badge-neutral">Coming Soon</span>
      </div>
    </div>
  )
}

function UsersTab() {
  return <PlaceholderTab
    title="User Management"
    description="Manage administrator, commissioner, officer, and crime analyst accounts. Requires Catalyst Data Store 'users' table."
  />
}

function RolesTab() {
  return <PlaceholderTab
    title="Role Management"
    description="Define and manage roles: Administrator, Commissioner, Officer, Crime Analyst. Map permissions to roles."
  />
}

function PermissionsTab() {
  return <PlaceholderTab
    title="Permission Management"
    description="Granular permission controls for module access, dataset operations, report generation, and copilot usage."
  />
}

function QuickMLTab() {
  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <span className="card-title">QuickML Configuration</span>
          <span className="card-meta">Legal AI Model Endpoint</span>
        </div>
        <div className="card-body" style={{ padding: 20 }}>
          <div className="admin-config-grid">
            <div className="admin-config-item">
              <label className="control-label">Model Endpoint</label>
              <div className="admin-config-value">
                <code>https://ml.zoho.in/api/v1/predict</code>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
            <div className="admin-config-item">
              <label className="control-label">OAuth Token URL</label>
              <div className="admin-config-value">
                <code>https://accounts.zoho.in/oauth/v2/token</code>
              </div>
            </div>
            <div className="admin-config-item">
              <label className="control-label">Client ID</label>
              <div className="admin-config-value">
                <code>••••••••••••••••</code>
                <span className="badge badge-neutral">Configured</span>
              </div>
            </div>
            <div className="admin-config-item">
              <label className="control-label">Refresh Token</label>
              <div className="admin-config-value">
                <code>••••••••••••••••</code>
                <span className="badge badge-neutral">Configured</span>
              </div>
            </div>
            <div className="admin-config-item">
              <label className="control-label">Supported Domains</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {['BNS', 'BNSS', 'CrPC', 'IPC', 'Evidence Act', 'Police Manual'].map(d => (
                  <span key={d} className="badge badge-success">{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TestingTab() {
  const [testCases, setTestCases] = useState([
    { id: 'auth', name: 'Authentication API Verification (/me)', target: '/server/zohodatathon_function/me', status: 'idle', details: 'Verifies Catalyst token validation and identity exchange' },
    { id: 'admin', name: 'Administration Health API (/health)', target: '/server/zohodatathon_function/health', status: 'idle', details: 'Verifies advanced advancedio health metrics and active stack configurations' },
    { id: 'dataset_list', name: 'Dataset Manager Listing API (/datasets)', target: '/server/zohodatathon_function/datasets', status: 'idle', details: 'Verifies file records mapping inside Datasets Datastore' },
    { id: 'analytics_compiled', name: 'Analytics Compile API (/datasets/compiled)', target: '/server/zohodatathon_function/datasets/compiled', status: 'idle', details: 'Verifies active cache compile vectors' },
    { id: 'dashboard', name: 'Executive Dashboard API (/dashboard)', target: '/server/zohodatathon_function/dashboard', status: 'idle', details: 'Verifies KPI and growth aggregates rendering state' },
    { id: 'map', name: 'Crime Map District API (/districts)', target: '/server/zohodatathon_function/districts', status: 'idle', details: 'Verifies geographical units boundary mappings' },
    { id: 'forecast', name: 'Predictive Forecasting API (/forecast)', target: '/server/zohodatathon_function/forecast', status: 'idle', details: 'Verifies regression growth rate and confidence metrics' },
    { id: 'hotspots', name: 'Hotspot Detection API (/hotspots)', target: '/server/zohodatathon_function/hotspots', status: 'idle', details: 'Verifies computed hotspots cluster records' },
    { id: 'anomalies', name: 'Anomaly Detection API (/anomalies)', target: '/server/zohodatathon_function/anomalies', status: 'idle', details: 'Verifies month-over-month and YoY standard deviation anomalies' },
    { id: 'recommendations', name: 'Recommendations Engine API (/recommendations)', target: '/server/zohodatathon_function/recommendations', status: 'idle', details: 'Verifies dynamic action recommendations derived from hotspots' },
    { id: 'reports', name: 'Reports Listing API (/reports)', target: '/server/zohodatathon_function/reports', status: 'idle', details: 'Verifies PDF/DOCX templates mapping state' },
    { id: 'copilot', name: 'AI Copilot & QuickML RAG Endpoint (/copilot)', target: '/server/zohodatathon_function/copilot', method: 'POST', status: 'idle', details: 'Verifies QuickML RAG token exchange, document retrieval, and legal RAG feedback' }
  ])
  const [isRunning, setIsRunning] = useState(false)

  const runAllTests = async () => {
    setIsRunning(true)
    const updated = [...testCases]
    
    // Set all to running
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'running', error: null }
    }
    setTestCases([...updated])

    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i]
      try {
        let res
        if (tc.method === 'POST') {
          res = await fetch(buildApiUrl(tc.target.replace('/server/zohodatathon_function', '')), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Explain BNS Section 302 details and guidelines.' })
          })
        } else {
          res = await fetch(buildApiUrl(tc.target.replace('/server/zohodatathon_function', '')))
        }

        const json = await res.json()
        if (res.ok && json.success) {
          updated[i] = { ...tc, status: 'passed', details: `Passed: Status ${res.status} · Resolves successfully.` }
        } else {
          updated[i] = { ...tc, status: 'failed', error: json.error || `Response returned status ${res.status}` }
        }
      } catch (err) {
        updated[i] = { ...tc, status: 'failed', error: err.message }
      }
      setTestCases([...updated])
    }
    setIsRunning(false)
  }

  const passedCount = testCases.filter(t => t.status === 'passed').length
  const failedCount = testCases.filter(t => t.status === 'failed').length
  const runningCount = testCases.filter(t => t.status === 'running').length

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#5F6B7A' }}>Diagnostic Run Status:</span>
          {passedCount > 0 && <span style={{ background: 'var(--color-alert-low)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{passedCount} Passed</span>}
          {failedCount > 0 && <span style={{ background: 'var(--color-alert-high)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{failedCount} Failed</span>}
          {runningCount > 0 && <span style={{ background: 'var(--color-accent-alt)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>Running Diagnostics ({runningCount} left)...</span>}
        </div>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          style={{ height: 34, padding: '0 16px', background: 'var(--navy-900)', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12.5, cursor: isRunning ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Automated Diagnostics'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">KSP SCRB Automated Verification Dashboard</span>
          <span className="card-meta">Full stack diagnostics test runner producing active PASS/FAIL logs</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>TEST CASE SYSTEM</th>
                <th>ENDPOINT TARGET</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc) => (
                <tr key={tc.id}>
                  <td style={{ fontWeight: 600, fontSize: 12.5 }}>{tc.name}</td>
                  <td className="table-mono" style={{ fontSize: 11 }}><code>{tc.method || 'GET'} {tc.target.replace('/server/zohodatathon_function', '')}</code></td>
                  <td style={{ fontSize: 11.5, color: '#5F6B7A' }}>
                    {tc.status === 'failed' ? (
                      <span style={{ color: 'var(--color-alert-high)', fontWeight: 500 }}>Error: {tc.error}</span>
                    ) : (
                      tc.details
                    )}
                  </td>
                  <td>
                    {tc.status === 'passed' ? (
                      <span className="badge badge-success">PASS</span>
                    ) : tc.status === 'failed' ? (
                      <span className="badge badge-critical">FAIL</span>
                    ) : tc.status === 'running' ? (
                      <span className="badge badge-neutral">TESTING...</span>
                    ) : (
                      <span className="badge badge-neutral">IDLE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AuditLogsTab() {
  const logs = [
    { time: '2024-12-28 14:32', user: 'SP Ramesh Kumar', action: 'Dataset Upload', detail: 'Uploaded ka-district-wise-2025.csv (1.1 KB)', status: 'success' },
    { time: '2024-12-28 14:32', user: 'System', action: 'Analytics Rebuild', detail: 'Analytics cache rebuilt — 5 datasets processed', status: 'success' },
    { time: '2024-12-27 09:15', user: 'DCP Meera Nair', action: 'Report Generated', detail: 'Monthly Crime Summary — Dec 2024', status: 'success' },
    { time: '2024-12-26 16:45', user: 'Analyst Priya S', action: 'Copilot Query', detail: 'Compare Bengaluru City vs Mysuru City', status: 'success' },
    { time: '2024-12-25 11:20', user: 'System', action: 'QuickML Health', detail: 'Endpoint health check passed — 340ms', status: 'success' },
    { time: '2024-12-24 08:00', user: 'System', action: 'Cron: Anomaly Scan', detail: 'Detected 3 critical anomalies', status: 'warning' },
  ]

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Audit Logs</span>
          <span className="card-meta">Recent system activity</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>USER</th>
                <th>ACTION</th>
                <th>DETAILS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td className="table-mono" style={{ fontSize: 11 }}>{log.time}</td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{log.user}</td>
                  <td style={{ fontSize: 12 }}>{log.action}</td>
                  <td style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{log.detail}</td>
                  <td>
                    <span className={`badge badge-${log.status === 'success' ? 'success' : 'warning'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  return <PlaceholderTab
    title="Platform Settings"
    description="Configure application preferences, notification settings, theme options, and deployment parameters."
  />
}

const TAB_COMPONENTS = {
  users:       UsersTab,
  roles:       RolesTab,
  permissions: PermissionsTab,
  quickml:     QuickMLTab,
  testing:     TestingTab,
  audit:       AuditLogsTab,
  settings:    SettingsTab,
}

export default function Administration() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'users'

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab] || DatasetManager

  return (
    <div className="intel-module">
      {/* Module Header */}
      <div className="intel-module-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">System management, dataset operations, user administration, and platform configuration</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="intel-tab-bar">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.id}
            className={`intel-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="intel-tab-icon">{tab.icon}</span>
            <span className="intel-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="intel-tab-content" key={activeTab}>
        <ActiveComponent />
      </div>
    </div>
  )
}
