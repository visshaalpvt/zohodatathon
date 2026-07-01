export default function KPIRow({ kpis }) {
  const cards = [
    {
      label: 'Total IPC Crimes 2024',
      value: kpis.totalIPC2024.toLocaleString('en-IN'),
      sub: `Source: IPC categories CSV`,
      trend: kpis.growthRateIPC,
      trendLabel: `${kpis.growthRateIPC > 0 ? '+' : ''}${kpis.growthRateIPC}% vs 2025 projection`,
      color: '#1F5FAF',
    },
    {
      label: 'Total SLL Crimes 2024',
      value: kpis.totalSLL2024.toLocaleString('en-IN'),
      sub: `Source: SLL categories CSV`,
      trend: 0,
      trendLabel: `Grand total SLL offences`,
      color: '#5F6B7A',
    },
    {
      label: 'Total Crimes 2024',
      value: kpis.total2024.toLocaleString('en-IN'),
      sub: `IPC + SLL combined`,
      trend: kpis.growthRateTotal,
      trendLabel: `${kpis.growthRateTotal > 0 ? '+' : ''}${kpis.growthRateTotal}% state growth (2025 data)`,
      color: '#2E4D7A',
    },
    {
      label: 'Critical Hotspot Districts',
      value: String(kpis.criticalHotspots),
      sub: `High-severity composite score`,
      trend: null,
      trendLabel: `${kpis.totalDistricts} districts analysed`,
      color: '#C62828',
    },
    {
      label: 'Anomalies Detected',
      value: String(kpis.totalAnomalies),
      sub: `Z-score ≥ 1.96 events`,
      trend: null,
      trendLabel: `Source: f3dc65a9 Monthly Review`,
      color: '#E67E22',
    },
  ]

  return (
    <div className="kpi-row mb-md">
      {cards.map((c, i) => (
        <div className="kpi-card" key={i}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {c.trend !== null && (
              <span style={{
                fontSize: 11, fontFamily: 'IBM Plex Mono',
                color: c.trend > 0 ? '#C62828' : c.trend < 0 ? '#1E7D32' : '#5F6B7A',
                fontWeight: 600,
              }}>
                {c.trend > 0 ? '▲' : c.trend < 0 ? '▼' : '—'}
              </span>
            )}
            <span className="kpi-sub">{c.trendLabel}</span>
          </div>
          <div style={{ fontSize: 10, color: '#8C96A3', marginTop: 2 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
