import { useState, useEffect } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import Badge from '../../components/shared/Badge'

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

export default function Recommendations() {
  const { districtStats = [] } = useCrimeData()
  const topDistricts = districtStats
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  
  const [allRecs, setAllRecs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecs() {
      setLoading(true)
      try {
        const url = selectedDistrict === 'all' 
          ? '/server/zohodatathon_function/recommendations'
          : `/server/zohodatathon_function/recommendations?district=${encodeURIComponent(selectedDistrict)}`
          
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          // If we fetched a specific district, append district name to recs
          const data = json.data.map(r => ({
            ...r,
            district: r.district || selectedDistrict,
            geoName: r.geoName || selectedDistrict
          }))
          setAllRecs(data)
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRecs()
  }, [selectedDistrict])

  // Filter
  let filtered = allRecs
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(r => r.priority === priorityFilter)
  }

  // Sort by priority
  filtered.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))

  const highCount = filtered.filter(r => r.priority === 'High').length
  const medCount = filtered.filter(r => r.priority === 'Medium').length

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">AI-Powered Recommendations</h1>
        <p className="page-subtitle">Operational intelligence recommendations generated from crime pattern analysis across Karnataka districts</p>
      </div>

      {/* Summary Strip */}
      <div className="rec-summary-strip">
        <div className="rec-summary-card rec-high">
          <div className="rec-summary-value">{highCount}</div>
          <div className="rec-summary-label">High Priority</div>
        </div>
        <div className="rec-summary-card rec-medium">
          <div className="rec-summary-value">{medCount}</div>
          <div className="rec-summary-label">Medium Priority</div>
        </div>
        <div className="rec-summary-card rec-total">
          <div className="rec-summary-value">{filtered.length}</div>
          <div className="rec-summary-label">Total Actions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rec-filters">
        <div className="control-group">
          <label className="control-label">District</label>
          <select
            className="control-select"
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
          >
            <option value="all">All Districts ({topDistricts.length})</option>
            {topDistricts.map(d => (
              <option key={d.csvName} value={d.csvName}>{d.csvName}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Priority</label>
          <select
            className="control-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="rec-grid">
        {filtered.slice(0, 30).map((rec, i) => (
          <div key={i} className={`rec-card rec-card-${rec.priority.toLowerCase()}`}>
            <div className="rec-card-header">
              <div className="rec-card-district">{rec.district}</div>
              <div className="rec-card-badges">
                <Badge type={rec.priority === 'High' ? 'critical' : rec.priority === 'Medium' ? 'warning' : 'success'}>
                  {rec.priority}
                </Badge>
                <span className="rec-confidence">{rec.confidence}%</span>
              </div>
            </div>
            <div className="rec-card-action">{rec.action}</div>
            <div className="rec-card-meta">
              <div className="rec-card-basis">
                <span className="rec-meta-label">BASIS</span>
                {rec.basis}
              </div>
              <div className="rec-card-impact">
                <span className="rec-meta-label">IMPACT</span>
                {rec.impact}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">No recommendations match filters</div>
          <div className="empty-state-detail">Adjust district or priority filter to see recommendations</div>
        </div>
      )}
    </div>
  )
}
