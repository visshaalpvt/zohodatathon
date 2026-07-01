import { useState } from 'react'

const ITEMS_PER_PAGE = 25

export default function DataTable({ columns, data, pageSize = ITEMS_PER_PAGE, onRowClick }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  const handleSort = (col) => {
    if (!col.sortable) return
    if (sortCol === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col.key)
      setSortDir('asc')
    }
    setPage(0)
  }

  let sorted = [...data]
  if (sortCol) {
    sorted.sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const total = sorted.length
  const start = page * pageSize
  const paged = sorted.slice(start, start + pageSize)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default', textAlign: col.align || 'left' }}
                >
                  {col.label}
                  {col.sortable && sortCol === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} onClick={() => onRowClick && onRowClick(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > pageSize && (
        <div className="pagination">
          <span>Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}</span>
          <div className="pagination-buttons">
            <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Previous</button>
            <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
