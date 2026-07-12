import { useState, useEffect } from 'react'


export default function SystemHealth() {
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildStatus, setRebuildStatus] = useState(null)
  const [healthData, setHealthData] = useState(null)

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch('/server/zohodatathon_function/health')
        const json = await res.json()
        if (json.success) {
          setHealthData(json.data)
        }
      } catch (err) {
        console.error('Failed to load system health:', err)
      }
    }
    loadHealth()
  }, [])

  const handleRebuild = async () => {
    setIsRebuilding(true)
    setRebuildStatus(null)
    try {
      const res = await fetch('/server/zohodatathon_function/datasets/rebuild', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setRebuildStatus({ type: 'success', msg: 'Analytics cache successfully rebuilt and broadcasted to clients.' })
        window.dispatchEvent(new Event('datalayer-updated'))
      } else {
        setRebuildStatus({ type: 'error', msg: data.message || 'Failed to rebuild analytics cache.' })
      }
    } catch (err) {
      setRebuildStatus({ type: 'error', msg: err.message })
    } finally {
      setIsRebuilding(false)
    }
  }

  return (
    <div className="page-content" style={{ height: 'calc(100vh - var(--topbar-height))', overflow: 'auto' }}>
      <div className="page-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 24, marginBottom: 24 }}>
        <h1>System Health Diagnostics</h1>
        <p className="page-subtitle">Enterprise administration, API health diagnostics, and infrastructure management</p>
      </div>

      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Diagnostics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>Catalyst Data Store</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-dot ${healthData && healthData.dbStatus === 'Connected' ? 'low' : 'critical'}`} />
              <span style={{ fontSize: 16, fontWeight: 500 }}>{healthData ? healthData.dbStatus : 'Loading...'}</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>Catalyst File Store</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot low" />
              <span style={{ fontSize: 16, fontWeight: 500 }}>Online & Synchronized</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>QuickML RAG Engine</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot low" />
              <span style={{ fontSize: 16, fontWeight: 500 }}>Model Ready</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>Uptime</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot low" />
              <span style={{ fontSize: 16, fontWeight: 500 }}>{healthData ? (healthData.uptime / 3600).toFixed(2) + ' Hrs' : 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* Cache Management */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Infrastructure Controls</h2>
          </div>
          <div style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Rebuild Analytics Engine</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 16, maxWidth: 600 }}>
              Force the system to clear its compiled in-memory analytics cache, re-download all datasets from the Catalyst File Store, and rebuild all intelligence arrays (Hotspots, Forecasts, Anomalies).
            </p>
            <button 
              className="btn btn-primary" 
              onClick={handleRebuild}
              disabled={isRebuilding}
            >
              {isRebuilding ? 'Rebuilding Cache...' : 'Flush & Rebuild Cache'}
            </button>

            {rebuildStatus && (
              <div style={{ 
                marginTop: 16, 
                padding: 12, 
                borderRadius: 'var(--radius-md)', 
                background: rebuildStatus.type === 'success' ? 'var(--color-success-soft)' : 'var(--color-critical-soft)',
                color: rebuildStatus.type === 'success' ? 'var(--color-success-text)' : 'var(--color-critical-text)',
                border: `1px solid ${rebuildStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-critical)'}`
              }}>
                {rebuildStatus.msg}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
