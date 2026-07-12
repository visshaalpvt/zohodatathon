import { useCrimeData } from '../../context/CrimeDataContext'

export default function KPIRow({ kpis }) {
  const { districtStats } = useCrimeData()
  // Compute Women Safety Index (lower = safer)
  const womenCrimeTotal = districtStats.reduce((s, d) =>
    s + d.crueltyByHusband + d.dowryDeaths + d.molestation + d.rape + d.pocso + d.pocsoRape, 0)
  const womenSafetyIndex = kpis.total2024 > 0 ? +(100 - (womenCrimeTotal / kpis.total2024 * 100)).toFixed(1) : 0

  // Compute Cyber Crime Index
  const cyberTotal = districtStats.reduce((s, d) => s + d.cyberCrime, 0)
  const cyberIndex = +(cyberTotal / kpis.total2024 * 100).toFixed(1)

  // Lowest crime district
  const lowestDistrict = [...districtStats].sort((a, b) => a.total - b.total)[0]

  const cards = [
    {
      label: 'State Crime Count',
      value: kpis.total2024.toLocaleString('en-IN'),
      sub: 'IPC + SLL combined · FY 2024',
      trend: kpis.growthRateTotal,
      trendLabel: `${kpis.growthRateTotal > 0 ? '+' : ''}${kpis.growthRateTotal}% vs 2025`,
      color: '#2563EB',
      accent: 'rgba(37,99,235,0.12)',
    },
    {
      label: 'Crime Growth %',
      value: `${kpis.growthRateTotal > 0 ? '+' : ''}${kpis.growthRateTotal}%`,
      sub: 'Year-over-year state change',
      trend: kpis.growthRateTotal,
      trendLabel: `${kpis.total2025.toLocaleString('en-IN')} projected 2025`,
      color: kpis.growthRateTotal > 0 ? '#DC2626' : '#16A34A',
      accent: kpis.growthRateTotal > 0 ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
    },
    {
      label: 'Highest Crime District',
      value: kpis.topDistrictTotal,
      sub: `${districtStats[0]?.total.toLocaleString('en-IN')} total crimes`,
      trend: null,
      trendLabel: `Rank #1 of ${kpis.totalDistricts} districts`,
      color: '#DC2626',
      accent: 'rgba(220,38,38,0.08)',
    },
    {
      label: 'Lowest Crime District',
      value: lowestDistrict?.csvName || '—',
      sub: `${lowestDistrict?.total.toLocaleString('en-IN')} total crimes`,
      trend: null,
      trendLabel: `Rank #${kpis.totalDistricts}`,
      color: '#16A34A',
      accent: 'rgba(22,163,74,0.08)',
    },
    {
      label: 'Women Safety Index',
      value: `${womenSafetyIndex}`,
      sub: `${womenCrimeTotal.toLocaleString('en-IN')} women-related crimes`,
      trend: null,
      trendLabel: 'Higher is safer (100 = no women crimes)',
      color: '#8B5CF6',
      accent: 'rgba(139,92,246,0.1)',
    },
    {
      label: 'Cyber Crime Index',
      value: `${cyberIndex}%`,
      sub: `${cyberTotal.toLocaleString('en-IN')} cyber crimes reported`,
      trend: null,
      trendLabel: 'Percentage of total crime volume',
      color: '#06B6D4',
      accent: 'rgba(6,182,212,0.1)',
    },
  ]

  return (
    <div className="kpi-row mb-md">
      {cards.map((c, i) => (
        <div className="kpi-card" key={i} style={{ '--kpi-accent': c.accent }}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {c.trend !== null && (
              <span style={{
                fontSize: 11, fontFamily: 'IBM Plex Mono',
                color: c.trend > 0 ? '#DC2626' : c.trend < 0 ? '#16A34A' : '#5F6B7A',
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
