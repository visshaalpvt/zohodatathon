import { useState, useEffect } from 'react'
import { buildApiUrl } from '../../api.js'

const DATASET_TYPES = [
  { id: 'district_stats_2024', label: 'District Crime Stats 2024 (Primary)', desc: '22 crime category columns, 37 districts' },
  { id: 'ipc_categories_2024', label: 'IPC Crime Categories 2024', desc: 'Section headers, categories & totals' },
  { id: 'sll_categories_2024', label: 'SLL Crime Categories 2024', desc: 'Special & Local Laws classification' },
  { id: 'monthly_review', label: 'Monthly Crime Review', desc: 'Current, prev, YTD statistics' },
  { id: 'district_stats_2025', label: 'District Crime Stats 2025', desc: 'IPC and SLL total columns for forecasting' },
]

export default function DatasetManager() {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadType, setUploadType] = useState('district_stats_2024')
  const [uploadYear, setUploadYear] = useState('2024')
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [replacingId, setReplacingId] = useState(null)
  const [activeTab, setActiveTab] = useState('list')
  const [toasts, setToasts] = useState([])

  // Load datasets list
  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const res = await fetch(buildApiUrl('/datasets'))
      const data = await res.json()
      if (data.success) {
        setDatasets(data.data)
      } else {
        showToast(data.error || 'Failed to retrieve datasets', 'critical')
      }
    } catch (err) {
      showToast('Network error while fetching datasets: ' + err.message, 'critical')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Handle file select/drag & drop upload
  const handleFileUpload = async (event, replaceId = null) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      showToast('Only CSV files are allowed.', 'critical')
      return
    }

    setUploading(true)
    setUploadProgress(10)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('year', uploadYear)
    formData.append('uploaded_by', 'Administrator (KSP HQ)')

    // If uploading a normal dataset, type is selected in UI. If replacing, type is preserved.
    if (!replaceId) {
      formData.append('dataset_type', uploadType)
    }

    setUploadProgress(35)

    try {
      const url = replaceId 
        ? buildApiUrl(`/datasets/${replaceId}`) 
        : buildApiUrl('/datasets/upload')
      const method = replaceId ? 'PUT' : 'POST'

      setUploadProgress(65)
      
      const res = await fetch(url, {
        method,
        body: formData
      })
      
      setUploadProgress(85)
      const data = await res.json()
      setUploadProgress(100)

      if (data.success) {
        showToast(replaceId ? 'Dataset replaced successfully.' : 'New dataset uploaded successfully.')
        setReplacingId(null)
        setActiveTab('list')
        fetchDatasets()
        window.dispatchEvent(new Event('catalyst-mutation-event'))
      } else {
        showToast(data.error || 'Operation failed', 'critical')
      }
    } catch (err) {
      showToast('Network error during file upload: ' + err.message, 'critical')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  // Handle dataset delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this dataset? This will permanently delete the File Store object and metadata.')) return

    try {
      const res = await fetch(buildApiUrl(`/datasets/${id}`), {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showToast('Dataset deleted successfully.')
        fetchDatasets()
        window.dispatchEvent(new Event('catalyst-mutation-event'))
      } else {
        showToast(data.error || 'Failed to delete dataset', 'critical')
      }
    } catch (err) {
      showToast('Network error while deleting dataset: ' + err.message, 'critical')
    }
  }

  // Handle dataset preview
  const handlePreview = async (id) => {
    setPreviewLoading(true)
    setPreviewData(null)
    try {
      const res = await fetch(buildApiUrl(`/datasets/${id}`))
      const data = await res.json()
      if (data.success) {
        setPreviewData(data.data)
      } else {
        showToast(data.error || 'Failed to get preview', 'critical')
      }
    } catch (err) {
      showToast('Network error during preview: ' + err.message, 'critical')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Handle rebuild / refresh analytics cache
  const handleRebuild = async () => {
    setLoading(true)
    try {
      const res = await fetch(buildApiUrl('/datasets/rebuild'), {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        showToast('Analytics cache successfully recompiled from newest File Store datasets!')
        window.dispatchEvent(new Event('catalyst-mutation-event'))
      } else {
        showToast(data.error || 'Rebuild failed', 'critical')
      }
    } catch (err) {
      showToast('Network error during cache recompile: ' + err.message, 'critical')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      {/* Toast Notifications */}
      <div className="toast-container" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} style={{
            background: t.type === 'critical' ? 'var(--color-critical-soft)' : 'var(--color-success-soft)',
            border: `1px solid ${t.type === 'critical' ? 'var(--color-critical)' : 'var(--color-success)'}`,
            color: t.type === 'critical' ? 'var(--color-critical-text)' : 'var(--color-success-text)',
            padding: '12px 24px',
            borderRadius: 4,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: 280,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease'
          }}>
            <span style={{ fontWeight: 'bold' }}>{t.type === 'critical' ? '⚠️' : '✓'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Dataset Manager</h1>
          <p className="page-subtitle">Karnataka State Police · Enterprise AI Cloud Datastore and File Store Sourcing</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="intel-btn btn-secondary" onClick={handleRebuild} disabled={loading || uploading}>
            🔄 Refresh Analytics Cache
          </button>
          <button className="intel-btn btn-primary" onClick={() => setActiveTab(activeTab === 'list' ? 'upload' : 'list')}>
            {activeTab === 'list' ? '➕ Upload New Dataset' : '📂 View Datasets'}
          </button>
        </div>
      </div>

      {/* Progress bar overlay during upload */}
      {uploading && (
        <div className="card mb-lg" style={{ border: '1px solid var(--color-accent)' }}>
          <div className="card-body" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: 'var(--font-data)' }}>
              <span style={{ color: 'var(--color-accent-hover)' }}>Uploading file to Catalyst File Store...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--color-bg-inset)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-accent)', transition: 'width 0.2s ease' }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upload New Dataset</span>
            <span className="card-meta">Maximum file size: 100 MB · Formats: CSV only</span>
          </div>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="grid-5050" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--color-text-secondary)', fontSize: 13 }}>Dataset Classification Type</label>
                  <select 
                    value={uploadType} 
                    onChange={(e) => setUploadType(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-inset)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      padding: 10,
                      borderRadius: 4,
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {DATASET_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <p style={{ marginTop: 4, color: 'var(--color-text-muted)', fontSize: 12 }}>
                    {DATASET_TYPES.find(t => t.id === uploadType)?.desc}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: 'var(--color-text-secondary)', fontSize: 13 }}>Dataset Reporting Year</label>
                  <input 
                    type="number" 
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-inset)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      padding: 10,
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>

              <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 6,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-inset)',
                position: 'relative'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                  <path d="M12 16V8M12 8L9 11M12 8L15 11" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 8 }}>Drag and drop CSV dataset file here</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>or select from your computer</span>
                
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 64, gap: 16 }}>
              <div className="intel-spinner" />
              <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-data)' }}>Loading datasets registry...</div>
            </div>
          ) : datasets.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>No datasets uploaded yet in Catalyst cloud repository.</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>Upload crime datasets to Catalyst File Store to enable analytics.</p>
              <button className="intel-btn btn-primary" onClick={() => setActiveTab('upload')}>
                Upload your first dataset
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Cloud Datasets Repository</span>
                <span className="card-meta">{datasets.length} active files registered on Catalyst Data Store</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="intel-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-inset)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12 }}>CLASSIFICATION TYPE</th>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12 }}>FILENAME</th>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12, textAlign: 'right' }}>RECORDS</th>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12, textAlign: 'center' }}>YEAR</th>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12, textAlign: 'center' }}>VERSION</th>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12, textAlign: 'center' }}>STATUS</th>
                      <th style={{ padding: 12, color: 'var(--color-text-secondary)', fontSize: 12, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map(d => (
                      <tr key={d.ROWID} style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.2s' }}>
                        <td style={{ padding: 12, fontWeight: '500', color: 'var(--color-accent-hover)', fontSize: 13 }}>
                          {DATASET_TYPES.find(t => t.id === d.dataset_type)?.label || d.dataset_type}
                        </td>
                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-primary)' }}>
                          {d.filename}
                        </td>
                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--color-text-primary)' }}>
                          {Number(d.records).toLocaleString()}
                        </td>
                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'center', color: 'var(--color-text-primary)' }}>
                          {d.year}
                        </td>
                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'center', color: 'var(--color-text-primary)' }}>
                          v{d.version}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{
                            background: d.status === 'active' ? 'var(--color-success-soft)' : 'var(--color-bg-inset)',
                            border: `1px solid ${d.status === 'active' ? 'var(--color-success)' : 'var(--color-border)'}`,
                            color: d.status === 'active' ? 'var(--color-success-text)' : 'var(--color-text-muted)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            textTransform: 'uppercase'
                          }}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="intel-btn btn-secondary" onClick={() => handlePreview(d.ROWID)} style={{ padding: '4px 8px', fontSize: 11 }}>
                              👁️ Preview
                            </button>
                            <div style={{ position: 'relative' }}>
                              <button className="intel-btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}>
                                🔄 Replace
                              </button>
                              <input 
                                type="file" 
                                accept=".csv"
                                onChange={(e) => handleFileUpload(e, d.ROWID)}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  opacity: 0,
                                  cursor: 'pointer'
                                }}
                              />
                            </div>
                            <button className="intel-btn btn-secondary" onClick={() => handleDelete(d.ROWID)} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid var(--color-critical)', color: 'var(--color-critical-text)' }}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {(previewLoading || previewData) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 32
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 1000, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-title">Dataset Preview</span>
                <span className="card-meta">
                  {previewData ? `${previewData.metadata.filename} (${previewData.metadata.records} total records)` : 'Loading...'}
                </span>
              </div>
              <button className="intel-btn btn-secondary" onClick={() => { setPreviewData(null); setPreviewLoading(false); }} style={{ padding: '4px 12px' }}>
                ✕ Close
              </button>
            </div>
            <div className="card-body" style={{ overflow: 'auto', flex: 1, padding: 0 }}>
              {previewLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 64, gap: 12 }}>
                  <div className="intel-spinner" />
                  <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-data)' }}>Downloading preview from File Store...</div>
                </div>
              ) : (
                <table className="intel-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-inset)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 1 }}>
                      {previewData?.preview?.[0]?.map((col, idx) => (
                        <th key={idx} style={{ padding: 10, color: 'var(--color-text-secondary)', fontSize: 11, textTransform: 'uppercase', background: 'var(--color-bg-inset)' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData?.preview?.slice(1).map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        {row.map((val, cIdx) => (
                          <td key={cIdx} style={{ padding: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-primary)' }}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
