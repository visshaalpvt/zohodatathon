const CATEGORIES = [
  { key: 'murder', label: 'Murder' },
  { key: 'rape', label: 'Rape' },
  { key: 'dacoity', label: 'Dacoity' },
  { key: 'robbery', label: 'Robbery' },
  { key: 'theft', label: 'Theft' },
  { key: 'riots', label: 'Riots' },
  { key: 'cyberCrime', label: 'Cyber' },
  { key: 'pocso', label: 'POCSO' }
]

function getHeatColor(value, min, max) {
  if (max === min) return '#E8ECF0'
  const t = (value - min) / (max - min)
  if (t < 0.33) {
    const r = Math.round(230 + (255 - 230) * (t / 0.33))
    const g = Math.round(240 + (193 - 240) * (t / 0.33))
    const b = Math.round(230 + (7 - 230) * (t / 0.33))
    return `rgb(${r},${g},${b})`
  }
  if (t < 0.66) {
    const r2 = Math.round(255 + (244 - 255) * ((t - 0.33) / 0.33))
    const g2 = Math.round(193 + (67 - 193) * ((t - 0.33) / 0.33))
    const b2 = Math.round(7 + (54 - 7) * ((t - 0.33) / 0.33))
    return `rgb(${r2},${g2},${b2})`
  }
  const r3 = Math.round(244 + (198 - 244) * ((t - 0.66) / 0.34))
  const g3 = Math.round(67 + (40 - 67) * ((t - 0.66) / 0.34))
  const b3 = Math.round(54 + (40 - 54) * ((t - 0.66) / 0.34))
  return `rgb(${r3},${g3},${b3})`
}

export default function CrimeHeatmap({ districtStats }) {
  const data = districtStats || []
  const allValues = data.flatMap(d => CATEGORIES.map(c => d[c.key] || 0))
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)

  return (
    <div>
      {/* Category header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(8, 1fr)', gap: 2, marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: 'transparent' }}>District</div>
        {CATEGORIES.map(c => (
          <div key={c.key} style={{ fontSize: 9.5, color: '#8C96A3', textAlign: 'center', fontFamily: 'Inter', fontWeight: 600 }} title={c.label}>
            {c.label}
          </div>
        ))}
      </div>

      {data.map(row => (
        <div
          key={row.csvName}
          style={{ display: 'grid', gridTemplateColumns: '120px repeat(8, 1fr)', gap: 2, marginBottom: 2 }}
        >
          <div style={{
            fontSize: 11,
            color: '#5F6B7A',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingRight: 4,
          }}>
            {row.csvName}
          </div>
          {CATEGORIES.map(c => {
            const val = row[c.key] || 0
            return (
              <div
                key={c.key}
                title={`${row.csvName} · ${c.label}: ${val.toLocaleString('en-IN')}`}
                style={{
                  height: 26,
                  background: getHeatColor(val, min, max),
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                }}
              />
            )
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>Low</span>
        <div style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'linear-gradient(to right, rgb(230, 240, 230), rgb(255, 193, 7), rgb(198, 40, 40))',
        }} />
        <span style={{ fontSize: 10, color: '#8C96A3', fontFamily: 'IBM Plex Mono' }}>High</span>
      </div>
    </div>
  )
}
