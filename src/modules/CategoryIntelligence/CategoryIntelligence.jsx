import { useState } from 'react'
import { allCategories, monthlyReview, districtStats } from '../../data/dataLayer'
import Badge from '../../components/shared/Badge'

// Interactive Treemap coordinate generation
function computeTreemap(data, width, height) {
  const sorted = [...data].filter(d => d.total > 0).sort((a, b) => b.total - a.total)
  const total = sorted.reduce((sum, d) => sum + d.total, 0)
  
  const rects = []
  function subdivide(nodes, x, y, w, h, vertical) {
    if (nodes.length === 0) return
    if (nodes.length === 1) {
      rects.push({ ...nodes[0], x, y, w, h })
      return
    }
    
    const half = nodes.reduce((sum, n) => sum + n.total, 0) / 2
    let currentSum = 0
    let splitIdx = 0
    for (let i = 0; i < nodes.length; i++) {
      currentSum += nodes[i].total
      if (currentSum >= half || i === nodes.length - 2) {
        splitIdx = i + 1
        break
      }
    }
    
    const leftPart = nodes.slice(0, splitIdx)
    const rightPart = nodes.slice(splitIdx)
    const leftSum = leftPart.reduce((sum, n) => sum + n.total, 0)
    const rightSum = rightPart.reduce((sum, n) => sum + n.total, 0)
    const sumAll = leftSum + rightSum
    
    if (vertical) {
      const leftW = sumAll > 0 ? w * (leftSum / sumAll) : 0
      const rightW = w - leftW
      subdivide(leftPart, x, y, leftW, h, !vertical)
      subdivide(rightPart, x + leftW, y, rightW, h, !vertical)
    } else {
      const leftH = sumAll > 0 ? h * (leftSum / sumAll) : 0
      const rightH = h - leftH
      subdivide(leftPart, x, y, w, leftH, !vertical)
      subdivide(rightPart, x, y + leftH, w, rightH, !vertical)
    }
  }
  
  subdivide(sorted, 0, 0, width, height, true)
  return rects
}

function getDistrictStatsForCategory(catName) {
  const key = catName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const keys = {
    murder: ['murder'],
    attemptToMurder: ['attempttomurder'],
    rape: ['rape'],
    dacoity: ['dacoity'],
    robbery: ['robbery'],
    burglaryDay: ['burglaryday', 'housebreakingday'],
    burglaryNight: ['burglarynight', 'housebreakingnight'],
    theft: ['theft'],
    riots: ['riots', 'rioting'],
    casesOfHurt: ['casesofhurt', 'hurt', 'grievoushurt'],
    crueltyByHusband: ['crueltybyhusband', 'dowryharassment', 'husbandcruelty'],
    dowryDeaths: ['dowrydeaths'],
    fatalAccidents: ['fatalaccidents', 'roadaccidents', 'motorvehicle'],
    nonFatalAccidents: ['nonfatalaccidents'],
    molestation: ['molestation', 'outragingmodesty'],
    scst: ['scst', 'atrocity'],
    gambling: ['gambling', 'gamingact'],
    dpAct: ['dpact', 'dowryprohibition'],
    cyberCrime: ['cybercrime', 'cyber'],
    pocso: ['pocso', 'pocsoact'],
    pocsoRape: ['pocsorape']
  }
  
  let matchedKey = null
  for (const [k, aliases] of Object.entries(keys)) {
    if (aliases.some(alias => key.includes(alias) || alias.includes(key))) {
      matchedKey = k
      break
    }
  }
  
  if (!matchedKey) return []
  return districtStats
    .map(d => ({ district: d.csvName, value: d[matchedKey] || 0 }))
    .sort((a, b) => b.value - a.value)
}

export default function CategoryIntelligence() {
  const [selectedType, setSelectedType] = useState('ALL') // ALL, IPC, SLL
  const [selectedCat, setSelectedCat] = useState(allCategories[0])

  const filteredCats = allCategories.filter(c => selectedType === 'ALL' || c.type === selectedType)
  const treemapWidth = 720
  const treemapHeight = 400
  const treemapData = computeTreemap(filteredCats.slice(0, 16), treemapWidth, treemapHeight)

  // Fastest growing categories YoY based on monthly review dataset
  const fastestGrowing = monthlyReview
    .filter(m => m.prevYrMonth > 0 && m.curMonth > 0)
    .map(m => {
      const growth = ((m.curMonth - m.prevYrMonth) / m.prevYrMonth) * 100
      return { ...m, growth }
    })
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 6)

  const districtData = selectedCat ? getDistrictStatsForCategory(selectedCat.name) : []

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Crime Category Intelligence</h1>
        <p className="page-subtitle">Granular analysis of IPC and SLL categories and their spatial concentration</p>
      </div>

      <div className="controls-bar">
        <div className="control-group">
          <span className="control-label">Filter by Class</span>
          <select
            className="control-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="IPC">IPC (Indian Penal Code)</option>
            <option value="SLL">SLL (Special & Local Laws)</option>
          </select>
        </div>
      </div>

      <div className="grid-6040 mb-md">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Crime Treemap Volume Analysis</span>
            <span className="card-meta">Area proportional to total 2024 cases</span>
          </div>
          <div className="card-body" style={{ position: 'relative' }}>
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${treemapWidth} ${treemapHeight}`}
              style={{ overflow: 'hidden', borderRadius: 4, background: '#E8ECF0' }}
            >
              {treemapData.map((rect, idx) => {
                const isSelected = selectedCat && selectedCat.name === rect.name
                const depthColor = rect.type === 'IPC'
                  ? `hsl(212, ${45 + (idx % 3) * 10}%, ${30 + (idx % 4) * 8}%)`
                  : `hsl(140, ${40 + (idx % 3) * 10}%, ${28 + (idx % 4) * 8}%)`

                return (
                  <g
                    key={rect.name}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCat(rect)}
                  >
                    <rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.w}
                      height={rect.h}
                      fill={isSelected ? '#1F5FAF' : depthColor}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                      style={{ transition: 'all 0.15s ease' }}
                    />
                    {rect.w > 65 && rect.h > 35 && (
                      <foreignObject
                        x={rect.x + 6}
                        y={rect.y + 6}
                        width={rect.w - 12}
                        height={rect.h - 12}
                        style={{ overflow: 'hidden', pointerEvents: 'none' }}
                      >
                        <div style={{
                          color: '#FFFFFF',
                          fontFamily: 'Inter',
                          fontSize: rect.w > 120 ? '11.5px' : '10px',
                          fontWeight: 500,
                          lineHeight: '1.2',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}>
                          {rect.name}
                        </div>
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '9.5px',
                          marginTop: 2
                        }}>
                          {rect.total.toLocaleString('en-IN')}
                        </div>
                      </foreignObject>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Category Profile</span>
            {selectedCat && <Badge type={selectedCat.type === 'IPC' ? 'neutral' : 'success'}>{selectedCat.type}</Badge>}
          </div>
          <div className="card-body">
            {selectedCat ? (
              <div>
                <h3 className="text-section" style={{ fontSize: 16, marginBottom: 4 }}>{selectedCat.fullName}</h3>
                <div style={{ display: 'flex', gap: 16, margin: '14px 0 20px' }}>
                  <div>
                    <span className="control-label" style={{ display: 'block' }}>2024 Cumulative Cases</span>
                    <span className="text-kpi" style={{ fontSize: 26, color: 'var(--accent-blue)' }}>
                      {selectedCat.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="control-label" style={{ display: 'block' }}>Percentage Share</span>
                    <span className="text-kpi" style={{ fontSize: 26, color: '#425466' }}>
                      {selectedCat.pct}%
                    </span>
                  </div>
                </div>

                <div className="leftnav-divider" style={{ margin: '16px 0', background: 'var(--border-light)' }} />

                <span className="card-title" style={{ fontSize: 12.5, display: 'block', marginBottom: 10 }}>
                  District Concentration (Top Districts)
                </span>
                {districtData.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {districtData.slice(0, 5).map((d, idx) => (
                      <div key={d.district} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ fontWeight: 500, color: '#333' }}>
                          {idx + 1}. {d.district}
                        </span>
                        <span className="text-mono" style={{ fontWeight: 600, color: 'var(--slate-600)' }}>
                          {d.value.toLocaleString('en-IN')} cases
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '16px 8px' }}>
                    <div className="empty-state-title" style={{ fontSize: 12 }}>No Direct Spatial Map Mapping</div>
                    <div className="empty-state-detail" style={{ fontSize: 10.5 }}>This category is compiled at the state level or does not align with a district stats column.</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">Select a Category</div>
                <div className="empty-state-detail">Click on any block in the treemap to view details.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">YoY Spike Warnings (Monthly Review Trends)</span>
          <span className="card-meta">Comparing current month vs same month last year · Source: f3dc65a9</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Major Head</th>
                <th>Section</th>
                <th style={{ textAlign: 'right' }}>Prev Year Month</th>
                <th style={{ textAlign: 'right' }}>Current Month</th>
                <th style={{ textAlign: 'right' }}>YTD Cumulative</th>
                <th style={{ textAlign: 'right' }}>YoY Growth</th>
              </tr>
            </thead>
            <tbody>
              {fastestGrowing.map((item) => (
                <tr key={item.name}>
                  <td style={{ fontWeight: 500 }}>{item.fullName}</td>
                  <td><Badge type="neutral">{item.section}</Badge></td>
                  <td className="table-mono" style={{ textAlign: 'right' }}>{item.prevYrMonth}</td>
                  <td className="table-mono" style={{ textAlign: 'right' }}>{item.curMonth}</td>
                  <td className="table-mono" style={{ textAlign: 'right' }}>{item.ytd.toLocaleString('en-IN')}</td>
                  <td
                    className="table-mono"
                    style={{
                      textAlign: 'right',
                      color: item.growth > 0 ? 'var(--critical)' : 'var(--success)',
                      fontWeight: 600
                    }}
                  >
                    {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
