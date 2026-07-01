import { useState } from 'react'
import KarnatakaMap from '../../components/shared/KarnatakaMap'
import MapControlPanel from './MapControlPanel'
import DistrictDrawer from './DistrictDrawer'
import MapLegend from './MapLegend'

export default function CrimeMap() {
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedProf, setSelectedProf] = useState(null)
  const [controls, setControls] = useState({
    year: 2024,
    category: 'all',
    metric: 'crimeCount',
    showStations: false,
    showHotspots: false,
  })

  const handleDistrictClick = (district, prof) => {
    setSelectedDistrict(district)
    setSelectedProf(prof)
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - var(--topbar-height))', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
      {/* Page header */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Karnataka Crime Intelligence Map</h1>
          <p className="page-subtitle">District-level crime density — click a district for details</p>
        </div>
      </div>

      {/* Map area */}
      <div style={{ padding: '12px 24px', height: 'calc(100% - 80px)', position: 'relative' }}>
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 4, height: '100%', overflow: 'hidden', position: 'relative' }}>
          <KarnatakaMap
            metric={controls.metric}
            year={controls.year}
            onDistrictClick={handleDistrictClick}
            selectedDistrict={selectedDistrict}
          />

          {/* Floating control panel */}
          <MapControlPanel controls={controls} onChange={setControls} />

          {/* Legend */}
          <MapLegend metric={controls.metric} />
        </div>
      </div>

      {/* District drawer */}
      {selectedDistrict && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedDistrict(null)} />
          <DistrictDrawer
            district={selectedDistrict}
            prof={selectedProf}
            onClose={() => setSelectedDistrict(null)}
          />
        </>
      )}
    </div>
  )
}
