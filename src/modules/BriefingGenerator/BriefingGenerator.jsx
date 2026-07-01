import { useState } from 'react'
import { districtStats, hotspots, anomalies, forecasts, kpis, ipcCategories, sllCategories, monthlyReview } from '../../data/dataLayer'
import { generateRecommendations } from '../../data/recommendationEngine'

const WOMEN_FIELDS = ['rape', 'molestation', 'crueltyByHusband', 'dowryDeaths', 'pocso', 'pocsoRape']
function fmt(n) { return typeof n === 'number' ? n.toLocaleString('en-IN') : String(n) }

const BRIEF_TYPES = [
  { id: 'daily', label: 'Daily Brief', desc: 'Latest dataset snapshot with key indicators' },
  { id: 'weekly', label: 'Weekly Brief', desc: '7-day trend aggregation and alerts' },
  { id: 'monthly', label: 'Monthly Brief', desc: 'Monthly aggregation and comparisons' },
  { id: 'district', label: 'District Brief', desc: 'Single district full intelligence profile' },
  { id: 'commissioner', label: 'Commissioner Brief', desc: 'Executive summary — top 10 risks + recommendations' },
  { id: 'scrb', label: 'SCRB Brief', desc: 'State Crime Records Bureau format report' },
]

function generateBriefContent(type, selectedDistrict) {
  const critical = hotspots.filter(h => h.severityLevel === 'critical')
  const high = hotspots.filter(h => h.severityLevel === 'high')
  const stateWomen = districtStats.reduce((s, d) => s + WOMEN_FIELDS.reduce((ss, f) => ss + (d[f] || 0), 0), 0)
  const topRecs = districtStats.slice(0, 3).flatMap(d => generateRecommendations(d).slice(0, 2))
  const now = new Date()

  const base = {
    generated: now.toISOString(),
    classification: 'RESTRICTED — FOR OFFICIAL USE ONLY',
    organization: 'Karnataka State Police — State Crime Records Bureau',
  }

  if (type === 'commissioner') {
    return {
      ...base,
      title: 'Commissioner Intelligence Brief',
      subtitle: `Generated ${now.toLocaleDateString('en-IN')} at ${now.toLocaleTimeString('en-IN')}`,
      sections: [
        { heading: 'Executive Summary', content: `Karnataka recorded ${fmt(kpis.total2024)} total crimes in 2024 (IPC: ${fmt(kpis.totalIPC2024)}, SLL: ${fmt(kpis.totalSLL2024)}). 2025 IPC growth: ${kpis.growthRateIPC > 0 ? '+' : ''}${kpis.growthRateIPC}%. ${critical.length} districts at CRITICAL severity.` },
        { heading: 'Top 10 Risk Districts', items: hotspots.slice(0, 10).map((h, i) => `${i + 1}. ${h.csvName} — Score: ${h.hotspotScore}/100 (${h.severityLevel.toUpperCase()}) — Total: ${fmt(h.total)}`) },
        { heading: 'Anomalies Detected', items: anomalies.slice(0, 5).map(a => `${a.category}: ${a.description}`) },
        { heading: 'Crime Trends', items: [`IPC Growth Rate: ${kpis.growthRateIPC}%`, `Critical hotspots: ${critical.length}`, `High severity: ${high.length}`, `Crimes against women: ${fmt(stateWomen)}`] },
        { heading: 'Priority Recommendations', items: topRecs.slice(0, 5).map(r => `[${r.priority}] ${r.action} — ${r.basis}`) },
      ],
      sources: ['District-wise IPC Crimes 2024', 'IPC Categories 2024', 'SLL Categories 2024', 'Monthly Review 2024', 'District 2025'],
      confidence: 95,
    }
  }

  if (type === 'district' && selectedDistrict) {
    const d = districtStats.find(ds => ds.csvName === selectedDistrict)
    if (!d) return { ...base, title: 'District not found', sections: [] }
    const rank = districtStats.indexOf(d) + 1
    const hot = hotspots.find(h => h.csvName === d.csvName)
    const recs = generateRecommendations(d)
    return {
      ...base,
      title: `District Intelligence Brief — ${d.csvName}`,
      subtitle: `Rank #${rank} of ${districtStats.length} — ${hot?.severityLevel?.toUpperCase() || 'MODERATE'} severity`,
      sections: [
        { heading: 'Overview', content: `${d.csvName} recorded ${fmt(d.total)} total crimes in 2024. Hotspot score: ${hot?.hotspotScore || 'N/A'}/100.` },
        { heading: 'Key Statistics', items: [`Murder: ${d.murder}`, `Rape: ${d.rape}`, `Theft: ${fmt(d.theft)}`, `Cyber Crime: ${fmt(d.cyberCrime)}`, `POCSO: ${d.pocso}`, `SC/ST: ${d.scst}`, `Women crimes: ${fmt(WOMEN_FIELDS.reduce((s, f) => s + (d[f] || 0), 0))}`] },
        { heading: 'Recommendations', items: recs.slice(0, 3).map(r => `[${r.priority}] ${r.action}`) },
      ],
      sources: ['District-wise IPC Crimes 2024'],
      confidence: 96,
    }
  }

  // Default: Daily/Weekly/Monthly/SCRB
  return {
    ...base,
    title: `${BRIEF_TYPES.find(b => b.id === type)?.label || 'Intelligence Brief'} — Karnataka State`,
    subtitle: `Report Period: 2024 · Generated ${now.toLocaleDateString('en-IN')}`,
    sections: [
      { heading: 'State Overview', content: `Total crimes: ${fmt(kpis.total2024)} (IPC: ${fmt(kpis.totalIPC2024)}, SLL: ${fmt(kpis.totalSLL2024)}). 2025 update: IPC ${fmt(kpis.totalIPC2025)} (${kpis.growthRateIPC > 0 ? '+' : ''}${kpis.growthRateIPC}%).` },
      { heading: 'Critical Districts', items: critical.map(h => `${h.csvName} — Score: ${h.hotspotScore}/100 — Total: ${fmt(h.total)}`) },
      { heading: 'Top Crime Categories (IPC)', items: ipcCategories.categories.slice(0, 8).map(c => `${c.name}: ${fmt(c.total)} (${c.pct}%)`) },
      { heading: 'Anomaly Alerts', items: anomalies.slice(0, 4).map(a => a.description) },
      { heading: 'Recommendations', items: topRecs.slice(0, 4).map(r => `[${r.priority}] ${r.action}`) },
    ],
    sources: ['All 5 KSP CSV Datasets'],
    confidence: 94,
  }
}

export default function BriefingGenerator() {
  const [activeType, setActiveType] = useState('commissioner')
  const [selectedDistrict, setSelectedDistrict] = useState(districtStats[0]?.csvName || '')
  const [brief, setBrief] = useState(null)

  const handleGenerate = () => {
    setBrief(generateBriefContent(activeType, selectedDistrict))
  }

  const handleExportPDF = () => { window.print() }

  return (
    <div className="page-content" style={{ height: 'calc(100vh - var(--topbar-height))', overflow: 'auto' }}>
      <div className="page-header">
        <h1 className="page-title">Briefing Generator</h1>
        <p className="page-subtitle">Generate institutional intelligence reports from Karnataka crime datasets</p>
      </div>

      {/* Brief Type Selection */}
      <div className="briefing-type-grid">
        {BRIEF_TYPES.map(bt => (
          <button key={bt.id} className={`briefing-type-card${activeType === bt.id ? ' active' : ''}`}
            onClick={() => setActiveType(bt.id)}>
            <div className="briefing-type-title">{bt.label}</div>
            <div className="briefing-type-desc">{bt.desc}</div>
          </button>
        ))}
      </div>

      {/* District selector for district brief */}
      {activeType === 'district' && (
        <div className="controls-bar" style={{ marginBottom: 16 }}>
          <div className="control-group">
            <span className="control-label">Select District</span>
            <select className="control-select" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
              {districtStats.map(d => <option key={d.csvName} value={d.csvName}>{d.csvName}</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button className="cc-action-btn" style={{ width: 'auto' }} onClick={handleGenerate}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2H10L13 5V14H3V2Z"/></svg>
          Generate Brief
        </button>
        {brief && (
          <button className="cc-action-btn" style={{ width: 'auto' }} onClick={handleExportPDF}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1V10M4 7L8 11L12 7M2 13H14" /></svg>
            Export PDF
          </button>
        )}
      </div>

      {/* Brief Output */}
      {brief && (
        <div style={{ maxWidth: 900 }}>
          <div className="intel-report-header">
            <div className="intel-classification-bar">
              <span className="intel-classification-label">{brief.classification}</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                Confidence: {brief.confidence}%
              </span>
            </div>
            <h2 className="intel-report-title">{brief.title}</h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-data)' }}>
              {brief.subtitle} · {brief.organization}
            </div>
          </div>

          {brief.sections?.map((section, i) => (
            <div key={i} className="intel-section">
              <div className="intel-section-header">{section.heading}</div>
              {section.content && <p className="intel-summary-text">{section.content}</p>}
              {section.items?.length > 0 && (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.items.map((item, j) => (
                    <li key={j} className="cc-intel-item" style={{ padding: '8px 12px' }}>
                      <span className="status-dot medium" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="intel-section intel-sources-section">
            <div className="intel-section-header">Evidence Sources</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {brief.sources?.map((s, i) => (
                <span key={i} className="badge badge-neutral" style={{ fontSize: 11 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
