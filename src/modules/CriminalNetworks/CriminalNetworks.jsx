import { useState, useEffect, useRef } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useCrimeData } from '../../context/CrimeDataContext'
import Badge from '../../components/shared/Badge'

const REPEAT_OFFENDERS = []

export default function CriminalNetworks() {
  const { districtStats = [] } = useCrimeData()
  const fgRef = useRef(null)
  
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedOffender, setSelectedOffender] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNetwork() {
      try {
        const res = await fetch('/server/zohodatathon_function/network')
        const json = await res.json()
        if (json.success) {
          // Rename edges -> links for force-graph compat
          const links = (json.data.edges || []).map(e => ({
            source: e.source,
            target: e.target,
            weight: e.weight
          }))
          setGraphData({ nodes: json.data.nodes || [], links })
        }
      } catch (err) {
        console.error('Failed to load network graph:', err)
      } finally {
        setLoading(false)
      }
    }
    loadNetwork()
  }, [])

  // Auto-fit graph view after rendering nodes
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50)
      }, 500)
    }
  }, [graphData])

  const handleNodeClick = (node) => {
    setSelectedNode(node)
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 40px)' }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h1 className="page-title">Criminal Network & Offender Intelligence</h1>
        <p className="page-subtitle">Interactive relationship modeling between high-crime districts and offense categories, with repeat offender tracking</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left pane: Network Graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div className="card-header" style={{ flexShrink: 0 }}>
            <span className="card-title">Link Analysis Network</span>
            <span className="card-meta">Force-directed representation (nodes represent districts and crime categories)</span>
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#F8FAFC' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8C96A3', fontSize: 13 }}>
                Compiling crime networks...
              </div>
            ) : (
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="label"
                nodeColor={node => node.color === 'red' ? '#C62828' : node.color === 'orange' ? '#E67E22' : node.color === 'purple' ? '#8B5CF6' : '#1F5FAF'}
                nodeVal={node => node.size || 10}
                linkWidth={link => Math.min(6, (link.weight || 1) * 0.75)}
                linkColor={() => '#CBD5E1'}
                onNodeClick={handleNodeClick}
                width={700}
                height={500}
              />
            )}

            {/* Floating legend */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#FFFFFF', border: '1px solid #D2D6DC',
              borderRadius: 4, padding: '8px 12px', fontSize: 11,
              display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} />
                <span>Crime Category Node</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C62828' }} />
                <span>Critical Risk District</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E67E22' }} />
                <span>High Risk District</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F5FAF' }} />
                <span>Moderate Risk District</span>
              </div>
            </div>

            {/* Floating Node Details Card */}
            {selectedNode && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: '#FFFFFF', border: '1px solid #D2D6DC',
                borderRadius: 4, padding: '10px 14px', zIndex: 10,
                width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <strong style={{ fontSize: 12.5, color: '#1B1F23' }}>{selectedNode.label}</strong>
                  <button
                    onClick={() => setSelectedNode(null)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#8C96A3', fontSize: 13 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontSize: 11.5, color: '#5F6B7A' }}>
                  Type: <Badge type={selectedNode.type === 'category' ? 'success' : 'neutral'}>{selectedNode.type.toUpperCase()}</Badge>
                </div>
                {selectedNode.type === 'district' && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#5F6B7A' }}>
                    Click-based link discovery shows associations to major crime classes.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Offender Profiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* Offender selector */}
          <div className="card" style={{ flexShrink: 0 }}>
            <div className="card-header">
              <span className="card-title">Known Repeat Offenders</span>
              <Badge type="warning">DB Offline</Badge>
            </div>
            
            <div className="card-body" style={{ padding: 40, textAlign: 'center', color: '#8C96A3' }}>
              Offender records will be synced from Catalyst Data Store in Phase 3.
            </div>
          </div>

          {/* Offender Details */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header" style={{ flexShrink: 0 }}>
              <span className="card-title">Offender Profile</span>
              <span className="card-meta">KSP SCRB Criminal Dossier</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F2744' }}>{selectedOffender.name}</span>
                <Badge type={selectedOffender.status === 'Wanted' ? 'critical' : selectedOffender.status === 'In Custody' ? 'success' : 'warning'}>
                  {selectedOffender.status.toUpperCase()}
                </Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: '#1B1F23', marginBottom: 16 }}>
                <div>
                  <strong style={{ color: '#5F6B7A' }}>Specialization:</strong> {selectedOffender ? selectedOffender.specialization : 'N/A'}
                </div>
                {selectedOffender && (
                <>
                  <div className="grid-2">
                    <div className="card" style={{ padding: 12, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>LINKED CASES</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#1B1F23' }}>{selectedOffender.linkedCases}</div>
                    </div>
                    <div className="card" style={{ padding: 12, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>STATUS</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: selectedOffender.status === 'Wanted' ? '#C62828' : '#1E7D32' }}>{selectedOffender.status}</div>
                    </div>
                  </div>

                  <div>
                    <span className="card-title" style={{ fontSize: 11, display: 'block', marginBottom: 4, color: '#5F6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operational Areas</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedOffender.districts.map(d => (
                        <Badge key={d} text={d} />
                      ))}
                    </div>
                  </div>
                </>
                )}
              </div>

              {/* Dossier Timeline */}
              {selectedOffender ? (
                <div>
                  <span className="card-title" style={{ fontSize: 11, display: 'block', marginBottom: 8, color: '#5F6B7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Case Incident Timeline
                  </span>
                  <div style={{ borderLeft: '1px solid #D2D6DC', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedOffender.timeline.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Bullet point anchor */}
                        <span style={{
                          position: 'absolute', left: -16.5, top: 3,
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#0F2744', border: '2px solid #FFFFFF'
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>
                          <span>{item.date}</span>
                          <span>{item.caseNo}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1B1F23', marginTop: 2 }}>{item.offense}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#5F6B7A', marginTop: 1 }}>
                          <span>Loc: {item.district}</span>
                          <span style={{ fontWeight: 500, color: item.status === 'Arrested' || item.status === 'Convicted' ? '#1E7D32' : '#E67E22' }}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#8C96A3', fontSize: 12 }}>
                  Select an offender to view dossier
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
