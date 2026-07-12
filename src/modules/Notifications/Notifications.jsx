import { useState, useEffect } from 'react'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await fetch('/server/zohodatathon_function/notifications')
        const json = await res.json()
        if (json.success) {
          setNotifications(json.data)
        }
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        setLoading(false)
      }
    }
    loadNotifs()
  }, [])

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">System events and audit logs</p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent notifications.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div key={n.ROWID} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>{n.title}</strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(n.timestamp).toLocaleString()}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
