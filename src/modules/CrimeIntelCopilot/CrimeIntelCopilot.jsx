import { useState, useRef } from 'react'
import { useCrimeData } from '../../context/CrimeDataContext'
import ExplainableAI from '../../components/shared/ExplainableAI'

// =============================================================================
// SEVERITY / CONFIDENCE COLORS
// =============================================================================

const SEV_COLORS = {
  critical: { bg: 'rgba(220,38,38,0.15)', color: '#FCA5A5', border: 'rgba(220,38,38,0.3)' },
  high:     { bg: 'rgba(217,119,6,0.15)', color: '#FCD34D', border: 'rgba(217,119,6,0.3)' },
  moderate: { bg: 'rgba(37,99,235,0.15)', color: '#93C5FD', border: 'rgba(37,99,235,0.3)' },
  low:      { bg: 'rgba(22,163,74,0.15)', color: '#86EFAC', border: 'rgba(22,163,74,0.3)' },
}

function confidenceColor(level) {
  if (level === 'High') return SEV_COLORS.low
  if (level === 'Medium') return SEV_COLORS.moderate
  return SEV_COLORS.high
}

function severityColor(sev) {
  return SEV_COLORS[sev] || SEV_COLORS.moderate
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SourceChip({ source }) {
  const chipColors = {
    'District-wise IPC Crimes Karnataka 2024': { bg: 'rgba(37,99,235,0.12)', color: '#93C5FD' },
    'IPC Crimes Under Various Heads 2024':     { bg: 'rgba(139,92,246,0.12)', color: '#C4B5FD' },
    'SLL Crimes Under Various Heads 2024':     { bg: 'rgba(22,163,74,0.12)', color: '#86EFAC' },
    'Karnataka Crime Review Tables 2024':      { bg: 'rgba(217,119,6,0.12)', color: '#FCD34D' },
    'Karnataka District Crime Dataset 2025':   { bg: 'rgba(6,182,212,0.12)', color: '#A5F3FC' },
  }
  const c = chipColors[source] || { bg: 'rgba(148,163,184,0.1)', color: 'var(--color-text-secondary)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.color, fontFamily: 'var(--font-body)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
        <path d="M3 2H10L13 5V14H3V2Z"/>
        <path d="M10 2V5H13" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      {source}
    </span>
  )
}

function MetadataBadge({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

function ConfidenceBadge({ confidence, level }) {
  const c = confidenceColor(level)
  return (
    <span className="intel-confidence-badge" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontFamily: 'var(--font-mono)',
    }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        {level === 'High' ? (
          <path d="M8 0L10 6H16L11 9.5L13 16L8 12L3 16L5 9.5L0 6H6L8 0Z"/>
        ) : (
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
        )}
      </svg>
      {confidence}% — {level}
    </span>
  )
}

function SeverityIndicator({ severity }) {
  const c = severityColor(severity)
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {severity}
    </span>
  )
}

// =============================================================================
// COMPARISON TABLE
// =============================================================================

function ComparisonTable({ data }) {
  if (!data) return null
  const { districts, fields } = data
  return (
    <div className="intel-section">
      <div className="intel-section-header">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="6" height="14" rx="1"/>
          <rect x="9" y="1" width="6" height="14" rx="1"/>
        </svg>
        Side-by-Side Comparison
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 500 }}>
          <thead>
            <tr>
              <th>CRIME CATEGORY</th>
              {districts.map(d => <th key={d.csvName || d}>{d.csvName || d}</th>)}
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const maxVal = Math.max(...f.values.map(v => v.value))
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{f.category}</td>
                  {f.values.map(v => (
                    <td key={v.district} className="table-mono" style={{
                      fontWeight: v.value === maxVal && maxVal > 0 ? 700 : 400,
                      color: v.value === maxVal && maxVal > 0 ? 'var(--color-alert-high)' : 'var(--color-text-primary)',
                      background: v.value === maxVal && maxVal > 0 ? 'rgba(220,38,38,0.05)' : 'transparent',
                    }}>
                      {v.value.toLocaleString('en-IN')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================================================
// RANKING TABLE
// =============================================================================

function RankingTable({ rankings, rankField }) {
  if (!rankings?.length) return null
  return (
    <div className="intel-section">
      <div className="intel-section-header">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 3H15M1 8H11M1 13H7"/>
        </svg>
        {rankField || 'Rankings'}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>RANK</th>
            <th>DISTRICT / CATEGORY</th>
            <th>VALUE</th>
            <th>SEVERITY</th>
            {rankings[0]?.extra && <th>DETAILS</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map(r => (
            <tr key={r.rank}>
              <td className="table-mono" style={{ fontWeight: 700, fontSize: 13 }}>#{r.rank}</td>
              <td style={{ fontWeight: 500 }}>{r.district}</td>
              <td className="table-mono" style={{ fontWeight: 600 }}>{r.formattedValue}</td>
              <td><SeverityIndicator severity={r.severity || 'moderate'} /></td>
              {r.extra && <td style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.extra}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================================
// SUGGESTED PROMPTS (SPEC MANDATED)
// =============================================================================
const SUGGESTED_PROMPTS = [
  "Which district has the highest crime rate?",
  "Show cyber crime trend in Karnataka",
  "Compare crime rates between Bengaluru City and Mysuru City",
  "What is the projected crime trend for 2025?",
  "Identify key hotspots for crimes against women",
  "Suggest operational recommendations for high-risk zones"
]

const QUERY_CATEGORIES = [
  { id: 'all', label: 'All Queries' },
  { id: 'stats', label: 'Statistics' },
  { id: 'legal', label: 'Legal Knowledge' },
  { id: 'forecast', label: 'Predictions' }
]

const JURY_QUESTIONS = [
  "What sections of BNS apply to financial fraud?",
  "What is the total crime volume for Bengaluru City in 2024?",
  "Which districts are critical hotspots for murders?",
  "Compare property crimes between Hubballi-Dharwad City and Mangaluru City"
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CrimeIntelCopilot() {
  const { districtStats } = useCrimeData()
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [history, setHistory] = useState([])
  const [evidenceOpen, setEvidenceOpen] = useState(true)
  const [copilotError, setCopilotError] = useState(null)
  const reportRef = useRef(null)

  // Voice recognition support
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

  const handleAnalyze = async (qText) => {
    const activeQuery = qText || query
    if (!activeQuery.trim()) return

    setIsProcessing(true)
    setQuery(activeQuery)
    setCopilotError(null)

    try {
      const res = await fetch(buildApiUrl('/copilot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery })
      })
      const json = await res.json()

      if (json.success) {
        setResponse(json.data)
        setHistory(prev => [{ query: activeQuery, title: json.data.title, time: new Date() }, ...prev].slice(0, 20))
      } else {
        setCopilotError(json.error || json.message || 'Analysis failed.')
      }
    } catch (err) {
      setCopilotError('Network error connecting to Copilot API.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResponse(null)
  }

  const handleExportCSV = () => {
    alert('Export to CSV is handled by the backend API in the Enterprise version.')
  }

  const handleExportMD = () => {
    alert('Intelligence Brief export is handled by the backend API in the Enterprise version.')
  }

  const handleExportPDF = () => {
    if (!reportRef.current) return
    window.print()
  }

  return (
    <div className="page-content intel-copilot-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)' }}>
      {/* HEADER */}
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="intel-logo-mark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V7L12 2Z" fill="var(--color-bg-surface)"/>
              <path d="M12 6L8 8.5V12C8 15 9.8 17.8 12 18.8C14.2 17.8 16 15 16 12V8.5L12 6Z" fill="var(--color-accent-alt)"/>
              <circle cx="12" cy="11" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="page-title">Crime Intelligence Copilot</h1>
            <p className="page-subtitle">AI-powered investigative assistant trained on Karnataka crime records and district statistics</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* MAIN COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* QUERY INPUT */}
          <div className="card intel-query-card" style={{ flexShrink: 0 }}>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    id="intel-query-input"
                    type="text"
                    className="intel-query-input"
                    placeholder="Enter your intelligence query (e.g., 'Which district has the highest crimes against women?')"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                    style={{
                      width: '100%', height: 44, padding: '0 16px',
                      border: '1px solid var(--color-border)', borderRadius: 4,
                      fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-primary)', outline: 'none',
                      transition: 'border-color 150ms ease',
                    }}
                  />
                </div>
                {hasVoice && (
                  <button
                    onClick={isListening ? stopVoice : startVoice}
                    style={{
                      width: 44, height: 44, border: `1px solid ${isListening ? 'var(--color-alert-high)' : 'var(--color-border)'}`,
                      borderRadius: 4, background: isListening ? 'rgba(220,38,38,0.1)' : 'var(--color-bg-surface)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
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
                <button
                  id="intel-analyze-btn"
                  className="intel-analyze-btn"
                  onClick={() => handleAnalyze()}
                  disabled={isProcessing}
                  style={{
                    height: 44, padding: '0 24px', border: 'none', borderRadius: 4,
                    background: 'var(--color-accent)', color: 'white', fontSize: 13,
                    fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 150ms ease',
                    opacity: isProcessing ? 0.7 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.5 0A6.5 6.5 0 0 1 13 6.5a6.47 6.47 0 0 1-1.36 3.98l4.19 4.19a.75.75 0 1 1-1.06 1.06l-4.19-4.19A6.47 6.47 0 0 1 6.5 13 6.5 6.5 0 1 1 6.5 0zm0 1.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
                  </svg>
                  {isProcessing ? 'ANALYZING...' : 'ANALYZE'}
                </button>
                {response && (
                  <button
                    onClick={handleClear}
                    style={{
                      height: 44, padding: '0 16px', border: '1px solid var(--color-border)',
                      borderRadius: 4, background: 'var(--color-bg-surface)', fontSize: 13,
                      fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PROCESSING INDICATOR */}
          {isProcessing && (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div className="intel-spinner" />
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Processing intelligence query...
              </div>
            </div>
          )}

          {/* INTELLIGENCE BRIEFING RESPONSE */}
          {response && !isProcessing && (
            <div ref={reportRef} className="intel-briefing" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* REPORT HEADER */}
              <div className="intel-report-header">
                <div className="intel-classification-bar">
                  <span className="intel-classification-label">
                    {response.reportType}
                  </span>
                  <ConfidenceBadge confidence={response.confidence} level={response.confidenceLevel} />
                </div>
                <h2 className="intel-report-title">{response.title}</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {response.badges?.district && (
                    <MetadataBadge label="DISTRICT" value={response.badges.district}
                      color={{ bg: 'rgba(37,99,235,0.12)', color: '#93C5FD', border: 'rgba(37,99,235,0.2)' }} />
                  )}
                  {response.badges?.districts?.map(d => (
                    <MetadataBadge key={d} label="DISTRICT" value={d}
                      color={{ bg: 'rgba(37,99,235,0.12)', color: '#93C5FD', border: 'rgba(37,99,235,0.2)' }} />
                  ))}
                  {response.badges?.category && (
                    <MetadataBadge label="CATEGORY" value={response.badges.category}
                      color={{ bg: 'rgba(139,92,246,0.12)', color: '#C4B5FD', border: 'rgba(139,92,246,0.2)' }} />
                  )}
                  {response.badges?.year && (
                    <MetadataBadge label="YEAR" value={response.badges.year}
                      color={{ bg: 'rgba(217,119,6,0.12)', color: '#FCD34D', border: 'rgba(217,119,6,0.2)' }} />
                  )}
                  {response.badges?.severity && (
                    <MetadataBadge label="SEVERITY" value={response.badges.severity.toUpperCase()}
                      color={severityColor(response.badges.severity)} />
                  )}
                </div>
              </div>

              {/* EXECUTIVE SUMMARY */}
              <div className="intel-section">
                <div className="intel-section-header">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1L15 13.5H1L8 1Z"/>
                    <path d="M8 6V9.5" strokeLinecap="round"/>
                    <circle cx="8" cy="11.5" r="0.6" fill="currentColor"/>
                  </svg>
                  Executive Summary
                </div>
                <p className="intel-summary-text">{response.summary}</p>
              </div>

              {/* EVIDENCE PANEL (COLLAPSIBLE) */}
              <div className="intel-section">
                <button
                  onClick={() => setEvidenceOpen(!evidenceOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: 'none', border: 'none', color: 'var(--color-accent-alt)',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer',
                    paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="1" width="14" height="14" rx="2"/>
                      <path d="M4 5H12M4 8H12M4 11H9"/>
                    </svg>
                    Evidence & Findings
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ transform: evidenceOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms ease' }}>
                    <path d="M3 4.5L6 7.5L9 4.5"/>
                  </svg>
                </button>
                {evidenceOpen && response.findings?.length > 0 && (
                  <div className="intel-findings-grid" style={{ marginTop: 14 }}>
                    {response.findings.map((f, i) => (
                      <div key={i} className={`intel-finding-card${f.highlight ? ' highlight' : ''}`}>
                        <div className="intel-finding-label">{f.label}</div>
                        <div className="intel-finding-value">{f.value}</div>
                        {f.severity && <SeverityIndicator severity={f.severity} />}
                        {f.subItems && (
                          <div className="intel-finding-subitems">
                            {f.subItems.map((sub, j) => (
                              <span key={j} className="intel-finding-subitem">{sub}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPARISON TABLE */}
              {response.comparisonData && <ComparisonTable data={response.comparisonData} />}

              {/* RANKING TABLE */}
              {response.rankings?.length > 0 && !response.comparisonData && (
                <RankingTable rankings={response.rankings} rankField={response.rankField} />
              )}

              {/* EVIDENCE SOURCES */}
              <div className="intel-section intel-sources-section">
                <div className="intel-section-header">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 2H10L13 5V14H3V2Z"/>
                    <path d="M10 2V5H13"/>
                  </svg>
                  Dataset Sources
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {response.sources?.map((s, i) => <SourceChip key={i} source={s} />)}
                </div>
              </div>

              {/* RECOMMENDATIONS SECTION */}
              {response.recommendations?.length > 0 && (
                <div className="intel-section">
                  <div className="intel-section-header">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="1" width="12" height="14" rx="1"/>
                      <path d="M5 4H11M5 7H11M5 10H8"/>
                    </svg>
                    Operational Recommendations
                  </div>
                  {response.recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} style={{
                      padding: '12px 16px', marginBottom: 8,
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)', borderRadius: 4,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 13 }}>{rec.action}</span>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <span className={`badge badge-${rec.priority === 'High' ? 'critical' : rec.priority === 'Medium' ? 'warning' : 'success'}`} style={{ fontSize: 9 }}>
                            {rec.priority}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                            {rec.confidence}%
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        BASIS: {rec.basis}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        IMPACT: {rec.impact}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EXPLAINABLE AI */}
              {response.explainableAI && (
                <div className="intel-section">
                  <ExplainableAI data={response.explainableAI} />
                </div>
              )}

              {/* EXPORT BAR */}
              <div className="intel-export-bar">
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Export Report
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleExportCSV} className="intel-export-btn">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 14V2H14V14H2ZM4 6V12H6V6H4ZM7 4V12H9V4H7ZM10 8V12H12V8H10Z"/>
                    </svg>
                    CSV
                  </button>
                  <button onClick={handleExportPDF} className="intel-export-btn">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3 0H10L14 4V16H3V0ZM10 0V4H14L10 0ZM5 8H12V9H5V8ZM5 10.5H12V11.5H5V10.5ZM5 13H9V14H5V13Z"/>
                    </svg>
                    PDF
                  </button>
                  <button onClick={handleExportMD} className="intel-export-btn">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 2H15V14H1V2ZM3 4V12H5L6.5 8L8 12H10V4H8V9L6.5 6L5 9V4H3ZM11 4V12H13V4H11Z"/>
                    </svg>
                    Intelligence Brief
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR — SUGGESTED PROMPTS & HISTORY */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {/* SUGGESTED PROMPTS */}
          {!response && (
            <div className="card">
              <div className="card-header" style={{ padding: '10px 16px' }}>
                <span className="card-title" style={{ fontSize: 12 }}>Suggested Prompts</span>
              </div>
              <div className="card-body" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SUGGESTED_PROMPTS.map((sp, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnalyze(sp)}
                    className="cc-action-btn"
                    style={{ fontSize: 12, padding: '10px 12px', justifyContent: 'flex-start' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--color-accent-alt)" style={{ flexShrink: 0 }}>
                      <path d="M6 3L12 8L6 13V3Z"/>
                    </svg>
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* JURY DEMONSTRATION QUESTIONS */}
          {!response && (
            <div className="card" style={{ flexShrink: 0 }}>
              <div className="card-header" style={{ padding: '10px 16px' }}>
                <span className="card-title" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--color-accent-alt)">
                    <path d="M8 0L10 6H16L11 9.5L13 16L8 12L3 16L5 9.5L0 6H6L8 0Z"/>
                  </svg>
                  JURY QUESTIONS
                </span>
              </div>
              <div className="card-body" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {JURY_QUESTIONS.map((jq, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnalyze(jq)}
                    className="cc-action-btn"
                    style={{ fontSize: 12, padding: '8px 12px' }}
                  >
                    {i + 1}. {jq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXTRACTED ENTITIES */}
          {response && response.extractedEntities && (
            <div className="card">
              <div className="card-header" style={{ padding: '10px 16px' }}>
                <span className="card-title" style={{ fontSize: 12 }}>Query Analysis</span>
              </div>
              <div className="card-body" style={{ padding: 12, fontSize: 12 }}>
                <div style={{ marginBottom: 8 }}>
                  <span className="control-label" style={{ display: 'block', marginBottom: 4 }}>Intent</span>
                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>{response.intent}</span>
                </div>
                {response.extractedEntities.districts.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span className="control-label" style={{ display: 'block', marginBottom: 4 }}>Districts</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {response.extractedEntities.districts.map(d => (
                        <span key={d} className="badge badge-success" style={{ fontSize: 10 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {response.extractedEntities.crimeFields.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span className="control-label" style={{ display: 'block', marginBottom: 4 }}>Crime Fields</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {response.extractedEntities.crimeFields.map(f => (
                        <span key={f} className="badge badge-warning" style={{ fontSize: 10 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUERY HISTORY */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '10px 16px', flexShrink: 0 }}>
              <span className="card-title" style={{ fontSize: 12 }}>Query History</span>
              {history.length > 0 && (
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>{history.length}</span>
              )}
            </div>
            <div className="card-body" style={{ padding: '8px 12px', flex: 1, overflowY: 'auto' }}>
              {history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnalyze(h.query)}
                      style={{
                        textAlign: 'left', padding: '8px 10px', border: '1px solid var(--color-border)',
                        borderRadius: 4, background: 'var(--color-bg-primary)', cursor: 'pointer',
                        transition: 'all 120ms ease', display: 'block', width: '100%',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
                        {h.query.length > 50 ? h.query.substring(0, 50) + '…' : h.query}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {h.time.toLocaleTimeString()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ border: 'none', padding: '24px 8px' }}>
                  <div className="empty-state-title" style={{ fontSize: 12 }}>No queries yet</div>
                  <div className="empty-state-detail" style={{ fontSize: 11 }}>
                    Your analysis history will appear here.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
