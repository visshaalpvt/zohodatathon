import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'bookmarks', label: 'Bookmarked Districts', icon: '📍' },
  { id: 'reports', label: 'Saved Reports', icon: '📄' },
  { id: 'conversations', label: 'Saved Conversations', icon: '💬' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'alerts', label: 'Assigned Alerts', icon: '🔔' },
]

const STORAGE_KEY = 'crimevision_workspace'

function loadWorkspace() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {
      bookmarks: [],
      reports: [],
      conversations: [],
      notes: '',
      alerts: [],
    }
  } catch { return { bookmarks: [], reports: [], conversations: [], notes: '', alerts: [] } }
}

function saveWorkspace(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export default function OfficerWorkspace() {
  const [activeSection, setActiveSection] = useState('bookmarks')
  const [workspace, setWorkspace] = useState(loadWorkspace)

  useEffect(() => { saveWorkspace(workspace) }, [workspace])

  const updateField = (field, value) => {
    setWorkspace(prev => ({ ...prev, [field]: value }))
  }

  const addBookmark = () => {
    const name = prompt('Enter district name:')
    if (name) {
      updateField('bookmarks', [...workspace.bookmarks, { name, timestamp: new Date().toISOString() }])
    }
  }

  const removeBookmark = (index) => {
    updateField('bookmarks', workspace.bookmarks.filter((_, i) => i !== index))
  }

  return (
    <div className="workspace-layout">
      {/* Sidebar */}
      <div className="workspace-sidebar">
        <div style={{ padding: '0 16px 12px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Workspace
        </div>
        {SECTIONS.map(s => (
          <button key={s.id}
            className={`workspace-sidebar-item${activeSection === s.id ? ' active' : ''}`}
            onClick={() => setActiveSection(s.id)}>
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="workspace-content">
        {activeSection === 'bookmarks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="page-title" style={{ fontSize: 18 }}>Bookmarked Districts</h2>
              <button className="cc-action-btn" style={{ width: 'auto' }} onClick={addBookmark}>+ Add Bookmark</button>
            </div>
            {workspace.bookmarks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workspace.bookmarks.map((bm, i) => (
                  <div key={i} className="cc-intel-item">
                    <span className="status-dot medium" />
                    <span style={{ flex: 1 }}>
                      <strong>{bm.name}</strong>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8, fontFamily: 'var(--font-data)' }}>
                        {new Date(bm.timestamp).toLocaleString('en-IN')}
                      </span>
                    </span>
                    <button onClick={() => removeBookmark(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">No bookmarked districts</div>
                <div className="empty-state-detail">Click "Add Bookmark" to save districts for quick access.</div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'notes' && (
          <div>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 16 }}>Notes</h2>
            <textarea
              value={workspace.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Write your investigation notes here... (auto-saved)"
              style={{
                width: '100%', minHeight: 400, padding: 16,
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                borderRadius: 4, color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
                resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, fontFamily: 'var(--font-data)' }}>
              Auto-saved to local storage · {workspace.notes.length} characters
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 16 }}>Saved Reports</h2>
            <div className="empty-state">
              <div className="empty-state-title">No saved reports yet</div>
              <div className="empty-state-detail">Reports generated from the Briefing Generator will appear here.</div>
            </div>
          </div>
        )}

        {activeSection === 'conversations' && (
          <div>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 16 }}>Saved Copilot Conversations</h2>
            <div className="empty-state">
              <div className="empty-state-title">No saved conversations</div>
              <div className="empty-state-detail">Save Copilot queries and responses for future reference.</div>
            </div>
          </div>
        )}

        {activeSection === 'alerts' && (
          <div>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 16 }}>Assigned Alerts</h2>
            <div className="empty-state">
              <div className="empty-state-title">No assigned alerts</div>
              <div className="empty-state-detail">Alerts from the Live Intelligence Feed can be assigned here.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
