import { useState, useEffect } from 'react'

export default function Settings() {
  const [preferences, setPreferences] = useState({ theme: 'dark', notifications: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [docId, setDocId] = useState(null)

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch('/server/zohodatathon_function/workspace')
        const json = await res.json()
        if (json.success) {
          const prefs = json.data.find(d => d.type === 'preference')
          if (prefs) {
            setDocId(prefs.ROWID)
            if (prefs.content) {
              setPreferences(JSON.parse(prefs.content))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPrefs()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const payload = {
        type: 'preference',
        title: 'User Settings',
        content: JSON.stringify(preferences)
      }
      
      const method = docId ? 'PUT' : 'POST'
      const url = docId 
        ? `/server/zohodatathon_function/workspace/${docId}`
        : '/server/zohodatathon_function/workspace'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json.success && !docId && json.data.ROWID) {
        setDocId(json.data.ROWID)
      }
      
      // Dispatch real-time event
      window.dispatchEvent(new Event('catalyst-mutation-event'))
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage user preferences and system configurations</p>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading preferences...</div>
      ) : (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header"><span className="card-title">General Preferences</span></div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Theme</label>
              <select 
                style={{ width: '100%', padding: '8px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 4 }}
                value={preferences.theme}
                onChange={e => setPreferences({...preferences, theme: e.target.value})}
              >
                <option value="dark">Premium Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={preferences.notifications}
                  onChange={e => setPreferences({...preferences, notifications: e.target.checked})}
                />
                Enable System Notifications
              </label>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
