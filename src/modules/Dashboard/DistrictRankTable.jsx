import Badge from '../../components/shared/Badge'
import { hotspots, forecasts } from '../../data/dataLayer'

function getRiskBadge(score) {
  if (score >= 75) return <Badge type="critical">Critical</Badge>
  if (score >= 55) return <Badge type="warning">High</Badge>
  if (score >= 35) return <Badge type="neutral">Medium</Badge>
  return <Badge type="success">Low</Badge>
}

export default function DistrictRankTable({ data }) {
  const rows = data.map((row, i) => {
    const name = row.district ?? row.csvName ?? ''
    const count = row.count ?? row.total ?? 0
    const rank = row.rank ?? (i + 1)

    // Lookup extra metrics from dataLayer if not present
    const hot = hotspots.find(h => h.csvName === name)
    const fore = forecasts.find(f => f.district === name)

    const change = row.change ?? fore?.growthRate ?? 0
    const riskScore = row.riskScore ?? hot?.hotspotScore ?? 50

    return {
      district: name,
      count,
      rank,
      change,
      riskScore
    }
  })

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>#</th>
            <th>District</th>
            <th style={{ textAlign: 'right' }}>Crimes</th>
            <th style={{ textAlign: 'right' }}>Change</th>
            <th style={{ textAlign: 'center' }}>Risk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.district}>
              <td className="table-mono" style={{ color: '#8C96A3', fontSize: 12 }}>{String(row.rank).padStart(2, '0')}</td>
              <td style={{ fontWeight: 500 }}>{row.district}</td>
              <td className="table-mono" style={{ textAlign: 'right' }}>{row.count.toLocaleString('en-IN')}</td>
              <td
                className="table-mono"
                style={{
                  textAlign: 'right',
                  color: row.change > 0 ? '#C62828' : '#1E7D32',
                  fontWeight: 500,
                }}
              >
                {row.change > 0 ? '+' : ''}{row.change}%
              </td>
              <td style={{ textAlign: 'center' }}>{getRiskBadge(row.riskScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
