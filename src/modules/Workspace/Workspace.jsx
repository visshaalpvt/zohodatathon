import { useState, useEffect } from 'react'
import { buildApiUrl, fetchWithTimeout } from '../../api.js'
import Badge from '../../components/shared/Badge'

const DEMO_WORKSPACE_ITEMS = [
  { ROWID: 'ws-1', type: 'bookmark', title: 'Bengaluru South Crime Heatmap', content: 'Saved view for priority operations.' },
  { ROWID: 'ws-2', type: 'saved_report', title: 'Weekly District Trends', content: 'Prebuilt report for weekly monitoring.' },
  { ROWID: 'ws-3', type: 'officer_note', title: 'Quick Note', content: 'Use manual note entry when backend editing is unavailable.' }
]

export default function Workspace() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const fetchWorkspace = async () => {
    try {
      const res = await fetchWithTimeout(buildApiUrl('/workspace'), {}, 5000)
      const json = await res.json()
      if (res.status === 401) {
        console.warn('[Workspace] /workspace returned 401; using demo workspace fallback.')
        setItems(DEMO_WORKSPACE_ITEMS)
      } else if (json.success) {
        setItems(json.data)
      }
    } catch (err) {
      console.error('Failed to load workspace:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspace()

    const handleMutation = () => {
      fetchWorkspace()
    }
    window.addEventListener('catalyst-mutation-event', handleMutation)
    return () => window.removeEventListener('catalyst-mutation-event', handleMutation)
  }, [])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    try {
      const payload = {
        type: 'officer_note',
        title: 'Quick Note',
        content: newNote
      }
      const res = await fetchWithTimeout(buildApiUrl('/workspace'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 5000)
      const json = await res.json()
      if (json.success) {
        setNewNote('')
        window.dispatchEvent(new Event('catalyst-mutation-event'))
      }
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setAddingNote(false)
    }
  }


  const bookmarks = items.filter(i => i.type === 'bookmark')
  const reports = items.filter(i => i.type === 'saved_report')
  const notes = items.filter(i => i.type === 'officer_note')

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Workspace</h1>
          <p className="page-subtitle">Your personal dashboard for saved insights, reports, and tactical notes.</p>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading Workspace...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Quick Add Note</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
                placeholder="Enter tactical note..."
                style={{ flex: 1, padding: '8px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 4 }}
              />
              <button onClick={handleAddNote} disabled={addingNote} className="btn btn-primary" style={{ padding: '0 16px' }}>
                {addingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Your workspace is empty. Save reports or create bookmarks to see them here.
              </div>
            </div>
          ) : (
            <div className="grid-3">
              <div className="card">
                <div className="card-header"><span className="card-title">Saved Reports</span><Badge text={reports.length.toString()} type="info" /></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reports.map(r => <div key={r.ROWID} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 4 }}><strong>{r.title}</strong><div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{new Date(r.timestamp).toLocaleDateString()}</div></div>)}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Bookmarks</span><Badge text={bookmarks.length.toString()} type="info" /></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bookmarks.map(r => <div key={r.ROWID} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 4 }}><strong>{r.title}</strong><div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{new Date(r.timestamp).toLocaleDateString()}</div></div>)}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Officer Notes</span><Badge text={notes.length.toString()} type="info" /></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notes.map(r => <div key={r.ROWID} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 4 }}><strong>{r.title}</strong><p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{r.content}</p></div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
