import { useState, useRef } from 'react'
import { processQuery, QUERY_CATEGORIES, exportToCSV, exportToMarkdown } from '../../data/crimeIntelEngine'
import { generateRecommendations, generateExplainableAI } from '../../data/recommendationEngine'
import { districtStats } from '../../data/dataLayer'
import ExplainableAI from '../../components/shared/ExplainableAI'

const AGENTS = [
  { id: 'crime', label: 'Crime Analyst', focus: 'Overall crime trends', prompts: ['Top crime categories this month', 'State-wide crime summary', 'IPC vs SLL breakdown'] },
  { id: 'forecast', label: 'Forecast Analyst', focus: 'Predictions', prompts: ['Which districts will increase next period?', 'Top 5 high-risk districts', 'Crime growth analysis 2024 vs 2025'] },
  { id: 'women', label: 'Women Safety Analyst', focus: 'Gender-based crime', prompts: ['Districts with highest women crime index', 'Dowry deaths analysis', 'POCSO trends in Karnataka'] },
  { id: 'cyber', label: 'Cyber Crime Analyst', focus: 'Digital crimes', prompts: ['Cyber crime trend analysis', 'Top districts by cyber crime', 'Digital crime hotspots'] },
  { id: 'district', label: 'District Intelligence', focus: 'Single district deep dive', prompts: ['Full profile of Bengaluru City', 'Compare Mysuru City and Belagavi City', 'District risk assessment'] },
  { id: 'report', label: 'Report Generator', focus: 'Document generation', prompts: ['Generate Commissioner Report', 'Karnataka State Crime Briefing', 'SLL crime category breakdown'] },
]

export default function MultiAgent() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0])
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [history, setHistory] = useState([])

  const handleAnalyze = (qText) => {
    const activeQuery = qText || query
    if (!activeQuery.trim()) return
    setIsProcessing(true)
    setQuery(activeQuery)

    setTimeout(() => {
      const result = processQuery(activeQuery)
      if (result) {
        // Enrich with recommendations and XAI
        const districts = result.extractedEntities?.districts || []
        const d = districts.length > 0 ? districtStats.find(ds => ds.csvName === districts[0]) : districtStats[0]
        result.recommendations = d ? generateRecommendations(d) : []
        result.explainableAI = generateExplainableAI(
          result.intent, result.sources || [], districts, result.extractedEntities?.crimeFields || []
        )
        result.agentName = activeAgent.label
      }
      setResponse(result)
      setIsProcessing(false)
      if (result) {
        setHistory(prev => [{ query: activeQuery, title: result.title, agent: activeAgent.label, time: new Date() }, ...prev].slice(0, 20))
      }
    }, 400)
  }

  // Voice support
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const hasVoice = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startVoice = () => {
    if (!hasVoice) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SR()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-IN'
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setIsListening(false)
      setTimeout(() => handleAnalyze(transcript), 200)
    }
    recognitionRef.current.onerror = () => setIsListening(false)
    recognitionRef.current.onend = () => setIsListening(false)
    recognitionRef.current.start()
    setIsListening(true)
  }

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop()
    setIsListening(false)
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 className="page-title">Multi-Agent Intelligence</h1>
            <p className="page-subtitle">Specialized AI agents for focused crime intelligence analysis</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Panel: Agent Selector + Prompts */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {/* Agent Selector */}
          <div className="card">
            <div className="card-header" style={{ padding: '10px 16px' }}>
              <span className="card-title" style={{ fontSize: 12 }}>Select Agent</span>
            </div>
            <div className="card-body" style={{ padding: 8 }}>
              {AGENTS.map(agent => (
                <button key={agent.id}
                  className={`workspace-sidebar-item${activeAgent.id === agent.id ? ' active' : ''}`}
                  onClick={() => { setActiveAgent(agent); setResponse(null) }}>
                  <span style={{ fontSize: 14 }}>🤖</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{agent.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{agent.focus}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header" style={{ padding: '10px 16px' }}>
              <span className="card-title" style={{ fontSize: 12 }}>Suggested Prompts</span>
            </div>
            <div className="card-body" style={{ padding: 8 }}>
              {activeAgent.prompts.map((p, i) => (
                <button key={i} className="cc-action-btn" style={{ fontSize: 12, padding: '8px 12px', marginBottom: 4 }}
                  onClick={() => handleAnalyze(p)}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-accent-alt)"><path d="M6 3L12 8L6 13V3Z"/></svg>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ padding: '10px 16px' }}>
                <span className="card-title" style={{ fontSize: 12 }}>Recent</span>
              </div>
              <div className="card-body" style={{ padding: 8, maxHeight: 200, overflowY: 'auto' }}>
                {history.slice(0, 8).map((h, i) => (
                  <button key={i} className="cc-action-btn" style={{ fontSize: 11, padding: '6px 10px', marginBottom: 4 }}
                    onClick={() => handleAnalyze(h.query)}>
                    <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{h.agent}</span>
                    {h.query.substring(0, 40)}…
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Query Input */}
          <div className="card" style={{ flexShrink: 0 }}>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type="text" placeholder={`Ask ${activeAgent.label}...`}
                    value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                    style={{
                      width: '100%', height: 44, padding: '0 16px',
                      border: '1px solid var(--color-border)', borderRadius: 4,
                      fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-primary)', outline: 'none',
                    }}
                  />
                </div>
                {hasVoice && (
                  <button onClick={isListening ? stopVoice : startVoice}
                    style={{
                      width: 44, height: 44, border: `1px solid ${isListening ? 'var(--color-alert-high)' : 'var(--color-border)'}`,
                      borderRadius: 4, background: isListening ? 'rgba(220,38,38,0.1)' : 'var(--color-bg-surface)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {isListening ? (
                      <div className="voice-waveform">
                        {[...Array(5)].map((_, i) => <div key={i} className="voice-waveform-bar" />)}
                      </div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5">
                        <rect x="5" y="1" width="6" height="9" rx="3"/>
                        <path d="M3 7C3 10 5 12 8 12C11 12 13 10 13 7"/>
                        <path d="M8 12V15M6 15H10"/>
                      </svg>
                    )}
                  </button>
                )}
                <button onClick={() => handleAnalyze()} disabled={isProcessing}
                  style={{
                    height: 44, padding: '0 20px', border: 'none', borderRadius: 4,
                    background: 'var(--color-accent)', color: 'white', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>
                  {isProcessing ? 'ANALYZING...' : 'ANALYZE'}
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                Active Agent: <strong style={{ color: 'var(--color-accent-alt)' }}>{activeAgent.label}</strong> — {activeAgent.focus}
              </div>
            </div>
          </div>

          {/* Response */}
          {isProcessing && (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div className="intel-spinner" />
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-data)' }}>
                {activeAgent.label} analyzing query...
              </div>
            </div>
          )}

          {response && !isProcessing && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Report Header */}
              <div className="intel-report-header">
                <div className="intel-classification-bar">
                  <span className="intel-classification-label">{response.reportType}</span>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--color-accent-alt)' }}>
                    {response.confidence}% — {response.confidenceLevel}
                  </span>
                </div>
                <h2 className="intel-report-title">{response.title}</h2>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-data)' }}>
                  Agent: {response.agentName} · {new Date(response.timestamp).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="intel-section">
                <div className="intel-section-header">Executive Summary</div>
                <p className="intel-summary-text">{response.summary}</p>
              </div>

              {/* Key Findings */}
              {response.findings?.length > 0 && (
                <div className="intel-section">
                  <div className="intel-section-header">Evidence & Key Findings</div>
                  <div className="intel-findings-grid">
                    {response.findings.map((f, i) => (
                      <div key={i} className={`intel-finding-card${f.highlight ? ' highlight' : ''}`}>
                        <div className="intel-finding-label">{f.label}</div>
                        <div className="intel-finding-value">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              <div className="intel-section intel-sources-section">
                <div className="intel-section-header">Dataset Sources</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {response.sources?.map((s, i) => (
                    <span key={i} className="badge badge-neutral" style={{ fontSize: 10 }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {response.recommendations?.length > 0 && (
                <div className="intel-section">
                  <div className="intel-section-header">Operational Recommendations</div>
                  {response.recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', marginBottom: 6,
                      background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 4,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 12 }}>{rec.action}</span>
                        <span className={`badge badge-${rec.priority === 'High' ? 'critical' : 'warning'}`} style={{ fontSize: 9 }}>
                          {rec.priority} · {rec.confidence}%
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-data)' }}>{rec.basis}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Explainable AI */}
              {response.explainableAI && (
                <div className="intel-section">
                  <ExplainableAI data={response.explainableAI} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
