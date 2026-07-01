import { useState } from 'react'

/**
 * Explainable AI Panel — "Why this answer?" collapsible section
 * Embedded in every AI output card for transparency
 */
export default function ExplainableAI({ data }) {
  const [open, setOpen] = useState(false)

  if (!data) return null

  return (
    <div className="xai-panel">
      <button className="xai-trigger" onClick={() => setOpen(!open)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5"/>
            <path d="M6 6C6 4.9 6.9 4 8 4C9.1 4 10 4.9 10 6C10 7 9 7.5 8 7.5V9" strokeLinecap="round"/>
            <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
          </svg>
          Why this answer?
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms ease' }}>
          <path d="M3 4.5L6 7.5L9 4.5"/>
        </svg>
      </button>
      {open && (
        <div className="xai-content">
          {data.method && (
            <div className="xai-row">
              <span className="xai-label">Method</span>
              <span>{data.method}</span>
            </div>
          )}
          {data.inputVariables?.length > 0 && (
            <div className="xai-row">
              <span className="xai-label">Inputs</span>
              <span>{data.inputVariables.join(' · ')}</span>
            </div>
          )}
          {data.datasetColumns?.length > 0 && (
            <div className="xai-row">
              <span className="xai-label">Columns</span>
              <span style={{ fontFamily: 'var(--font-data)' }}>{data.datasetColumns.join(', ')}</span>
            </div>
          )}
          {data.confidenceDerivation && (
            <div className="xai-row">
              <span className="xai-label">Confidence</span>
              <span>{data.confidenceDerivation}</span>
            </div>
          )}
          {data.limitations?.length > 0 && (
            <div className="xai-row" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="xai-label">Limitations</span>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {data.limitations.map((l, i) => (
                  <li key={i} style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
