import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="tooltip-row">
        <span style={{ color: p.color }}>Current month</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>{p.payload.curMonth?.toLocaleString('en-IN')}</span>
      </div>
      <div className="tooltip-row">
        <span style={{ color: '#8C96A3' }}>Previous month</span>
        <span style={{ fontFamily: 'IBM Plex Mono' }}>{p.payload.prevMonth?.toLocaleString('en-IN')}</span>
      </div>
      <div className="tooltip-row">
        <span style={{ color: '#8C96A3' }}>Prev year same month</span>
        <span style={{ fontFamily: 'IBM Plex Mono' }}>{p.payload.prevYrMonth?.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ fontSize: 9, color: '#8C96A3', marginTop: 4 }}>YTD: {p.payload.ytd?.toLocaleString('en-IN')}</div>
    </div>
  )
}

export default function MonthlyTrendChart({ data }) {
  // Filter to entries that have actual monthly data and sort by curMonth
  const chartData = data
    .filter(d => d.curMonth > 0 || d.prevMonth > 0)
    .slice(0, 10)
    .map(d => ({
      name: d.name.length > 20 ? d.name.substring(0, 18) + '…' : d.name,
      curMonth:    d.curMonth,
      prevMonth:   d.prevMonth,
      prevYrMonth: d.prevYrMonth,
      ytd:         d.ytd,
    }))

  if (!chartData.length) {
    return <div style={{ padding: 20, color: '#8C96A3', fontSize: 12 }}>No monthly data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 60, left: 10 }} barGap={2}>
        <CartesianGrid stroke="#E8ECF0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontFamily: 'IBM Plex Mono', fontSize: 8, fill: '#8C96A3' }}
          angle={-40} textAnchor="end" interval={0}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#8C96A3' }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="prevYrMonth" name="Prev Year Same Month" fill="#C8D0DA" radius={[2,2,0,0]} />
        <Bar dataKey="prevMonth"   name="Previous Month"       fill="#8C96A3" radius={[2,2,0,0]} />
        <Bar dataKey="curMonth"    name="Current Month"        fill="#1F5FAF" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
