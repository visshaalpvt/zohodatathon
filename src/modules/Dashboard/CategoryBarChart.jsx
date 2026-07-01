import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload[0]?.payload?.value
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label" style={{ fontSize: 11 }}>{label}</div>
      <div className="tooltip-row">
        <span>Cases</span>
        <span>{total?.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

function truncateLabel(label) {
  return label
    .replace(/VEHICLE ACCIDENTS - NON-FATAL|VEHICLE ACCIDENTS NON-FATAL/gi, 'Accident Non-Fatal')
    .replace(/VEHICLE ACCIDENTS - FATAL|VEHICLE ACCIDENTS FATAL/gi, 'Accident Fatal')
    .replace(/CASES OF MURDER/gi, 'Murder')
    .replace(/KIDNAPPING AND ABDUCTION.*/gi, 'Kidnapping')
    .replace(/CRUELTY BY HUSBAND.*/gi, 'Domestic Cruelty')
    .replace(/ATTEMPT TO MURDER/gi, 'Attempt Murder')
    .replace(/THEFT.*/gi, 'Theft')
    .replace(/RIOTS/gi, 'Riots')
    .replace(/MOLESTATION/gi, 'Molestation')
    .substring(0, 22)
}

export default function CategoryBarChart({ data }) {
  const totalAll = data.reduce((s, d) => s + (d.total ?? d.count ?? 0), 0)

  const chartData = data.map(d => {
    const label = d.name ?? d.category ?? ''
    const value = d.total ?? d.count ?? 0
    return {
      ...d,
      label,
      value,
      shortLabel: truncateLabel(label),
      pct: totalAll > 0 ? ((value / totalAll) * 100).toFixed(1) : '0.0',
    }
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke="#E8ECF0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#8C96A3' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${(v/1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="shortLabel"
          tick={{ fontFamily: 'Inter', fontSize: 10, fill: '#5F6B7A' }}
          axisLine={false}
          tickLine={false}
          width={135}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#1F5FAF" radius={[0, 2, 2, 0]} maxBarSize={14}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill="#1F5FAF" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
