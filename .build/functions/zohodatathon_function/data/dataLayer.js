/**
 * DATA LAYER — KSP SCRB Crime Intelligence Platform
 * =========================================================
 * PRIMARY SOURCE: Catalyst File Store (datasets folder)
 * FALLBACK:       Local CSV files in data/ directory
 *
 * Architecture:
 *   1. On first request, ensureInitialized(req) downloads CSVs
 *      from Catalyst File Store → Data Store lookup → download by file_id
 *   2. Parsed data is cached in-memory for fast sync access
 *   3. invalidateCache() + recompile(req) forces re-download + re-parse
 *   4. All 10+ consumer services use sync getters (unchanged API)
 *
 * Dataset Types (mapped to parsers):
 *   district_stats_2024 → parseDistrictStats()
 *   sll_categories_2024 → parseSLLCategories()
 *   ipc_categories_2024 → parseIPCCategories()
 *   monthly_review      → parseMonthlyReview()
 *   district_stats_2025 → parseDistrict2025()
 */

const path = require('path');
const filestoreService = require('../services/filestore.service');

// =============================================================================
// PERSISTENT DATA CONTAINERS (mutated in-place for CommonJS destructuring)
// =============================================================================

const districtStats = [];
const ipcCategories = {};
const sllCategories = {};
const monthlyReview = [];
const district2025Data = {};
const geoStats = {};
const hotspots = [];
const anomalies = [];
const forecasts = [];
const correlations = [];
const kpis = {};
const allCategories = [];
const monthlyComparison = [];
const districtRankings = [];

let csvSources = {
  districtStats: null,
  sllCategories: null,
  ipcCategories: null,
  monthlyReview: null,
  district2025:  null,
};

let cachedData = null;
let initialized = false;

// =============================================================================
// CATALYST FILE STORE INTEGRATION
// =============================================================================

/**
 * Download all datasets from Catalyst File Store.
 */
async function loadDatasetsFromFileStore(req) {
  console.log('[DataLayer] Loading datasets from Catalyst File Store...');
  const datasets = await filestoreService.downloadAndNormalizeDatasets(req);
  csvSources.districtStats = datasets.districtStats;
  csvSources.sllCategories = datasets.sllCategories;
  csvSources.ipcCategories = datasets.ipcCategories;
  csvSources.monthlyReview = datasets.monthlyReview;
  csvSources.district2025  = datasets.district2025;
  console.log('[DataLayer] All datasets successfully loaded from File Store.');
}

// =============================================================================
// PUBLIC INITIALIZATION API
// =============================================================================

/**
 * Ensure data is loaded. Call this in Express middleware before any route handler.
 * Safe to call multiple times — only downloads on first call (or after invalidation).
 */
async function ensureInitialized(req) {
  if (initialized && cachedData) return;
  await loadDatasetsFromFileStore(req);
  compileAnalytics();
  initialized = true;
}

/**
 * Invalidate cache — next ensureInitialized() call will re-download from File Store.
 */
function invalidateCache() {
  cachedData = null;
  csvSources = {
    districtStats: null,
    sllCategories: null,
    ipcCategories: null,
    monthlyReview: null,
    district2025:  null,
  };
  initialized = false;
  console.log('[DataLayer] Cache invalidated — next request will re-download from File Store');
}

/**
 * Force re-download from File Store and recompile analytics. Returns new KPIs.
 */
async function recompile(req) {
  invalidateCache();
  await ensureInitialized(req);
  return kpis;
}

// =============================================================================
// HELPERS
// =============================================================================

function parseCSVLine(line) {
  const res = []; let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++ } else inQ = !inQ
    } else if (c === ',' && !inQ) { res.push(cur.trim()); cur = '' }
    else cur += c
  }
  res.push(cur.trim()); return res
}

function parseCSVText(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.replace(/\r\n/g,'\n').replace(/\r/g,'\n')
    .split('\n').filter(l => l.trim()).map(parseCSVLine)
}

function n(v) {
  const x = parseInt(String(v ?? '').replace(/,/g,''), 10)
  return isNaN(x) ? 0 : x
}

function _mean(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0 }

function _std(arr) {
  const m = _mean(arr)
  return Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/(arr.length||1))
}

function _z(v, m, s) { return s > 0 ? (v-m)/s : 0 }

function shortName(full='') {
  return full
    .replace(/\s*\(Sec\..*?\)/gi,'').replace(/\s*\(IPC.*?\)/gi,'')
    .replace(/\s*\(BNS.*?\)/gi,'').replace(/\s*\/.*?\d+.*?BNS\)/gi,'')
    .replace(/,\s*$/,'').replace(/\s+/g,' ').trim().substring(0,42)
}

function pearson(x, y) {
  const m = _mean(x), my = _mean(y)
  const num = x.reduce((s,xi,i)=>s+(xi-m)*(y[i]-my),0)
  const den = Math.sqrt(x.reduce((s,xi)=>s+(xi-m)**2,0)*y.reduce((s,yi)=>s+(yi-my)**2,0))
  return den > 0 ? +(num/den).toFixed(3) : 0
}

// =============================================================================
// DISTRICT NAME TABLES
// =============================================================================

const CSV_TO_GEO = {
  'Bengaluru City':       'Bengaluru Urban',
  'Bengaluru Dist':       'Bengaluru Rural',
  'Mysuru City':          'Mysuru',
  'Mysuru Dist':          'Mysuru',
  'Hubballi Dharwad City':'Dharwad',
  'Dharwad':              'Dharwad',
  'Mangaluru City':       'Dakshina Kannada',
  'Dakshina Kannada':     'Dakshina Kannada',
  'Belagavi City':        'Belagavi',
  'Belagavi Dist':        'Belagavi',
  'Kalaburagi City':      'Kalaburagi',
  'Kalaburagi':           'Kalaburagi',
  'Ramanagara':           'Ramanagara',
  'Tumakuru':             'Tumakuru',
  'Kolar':                'Kolar',
  'Chickballapura':       'Chikkaballapur',
  'K.G.F':               'Kolar',
  'Chitradurga':          'Chitradurga',
  'Davanagere':           'Davanagere',
  'Shivamogga':           'Shivamogga',
  'Haveri':               'Haveri',
  'Udupi':                'Udupi',
  'Chikkamagaluru':       'Chikkamagaluru',
  'Uttara Kannada':       'Uttara Kannada',
  'Bagalkot':             'Bagalkote',
  'Vijayapur':            'Vijayapura',
  'Gadag':                'Gadag',
  'Bidar':                'Bidar',
  'Yadgir':               'Yadgir',
  'Mandya':               'Mandya',
  'Chamarajanagar':       'Chamarajanagar',
  'Hassan':               'Hassan',
  'Kodagu':               'Kodagu',
  'Ballari':              'Ballari',
  'Koppal':               'Koppal',
  'Raichur':              'Raichur',
  'Vijayanagara':         'Vijayanagara',
}

const DISTRICT_SKIP = new Set([
  'Commissionerates','Central Range','Eastern Range','Western Range',
  'Northern Range','North Eastern Range','Southern Range','Ballari Range',
  'Karnataka Railways','Coastal Security Police','CID','Total','DISTRICT/UNITS',
])

// =============================================================================
// PARSER 1 — DISTRICT STATS 2024 (reads from csvSources.districtStats)
// =============================================================================

function parseDistrictStats() {
  const rows = parseCSVText(csvSources.districtStats).slice(1)
  const districts = []
  for (const row of rows) {
    const nm = row[1]?.trim()
    if (!nm || DISTRICT_SKIP.has(nm)) continue
    const d = {
      csvName:          nm,
      geoName:          CSV_TO_GEO[nm] || nm,
      murder:           n(row[2]),
      attemptToMurder:  n(row[3]),
      rape:             n(row[4]),
      dacoity:          n(row[5]),
      robbery:          n(row[6]),
      burglaryDay:      n(row[7]),
      burglaryNight:    n(row[8]),
      theft:            n(row[9]),
      riots:            n(row[10]),
      casesOfHurt:      n(row[11]),
      crueltyByHusband: n(row[12]),
      dowryDeaths:      n(row[13]),
      fatalAccidents:   n(row[14]),
      nonFatalAccidents:n(row[15]),
      molestation:      n(row[16]),
      scst:             n(row[17]),
      gambling:         n(row[18]),
      dpAct:            n(row[19]),
      cyberCrime:       n(row[20]),
      pocso:            n(row[21]),
      pocsoRape:        n(row[22]),
    }
    d.total = d.murder + d.attemptToMurder + d.rape + d.dacoity + d.robbery +
      d.burglaryDay + d.burglaryNight + d.theft + d.riots + d.casesOfHurt +
      d.crueltyByHusband + d.dowryDeaths + d.fatalAccidents + d.nonFatalAccidents +
      d.molestation + d.scst + d.gambling + d.dpAct + d.cyberCrime + d.pocso + d.pocsoRape

    // Weighted severity score (violent crimes carry heavier weight)
    d.severityWeight = d.murder*10 + d.rape*8 + d.pocso*8 + d.dowryDeaths*7 +
      d.dacoity*6 + d.scst*5 + d.robbery*4 + d.molestation*4 +
      d.crueltyByHusband*3 + (d.burglaryDay+d.burglaryNight)*2 +
      d.cyberCrime*2 + d.theft*1 + d.riots*3

    districts.push(d)
  }
  return districts.sort((a,b) => b.total - a.total)
}

// =============================================================================
// PARSER 2 — GEOGRAPHIC AGGREGATION
// =============================================================================

const GEO_NUMERIC_KEYS = [
  'murder','attemptToMurder','rape','dacoity','robbery','burglaryDay','burglaryNight',
  'theft','riots','casesOfHurt','crueltyByHusband','dowryDeaths','fatalAccidents',
  'nonFatalAccidents','molestation','scst','gambling','dpAct','cyberCrime',
  'pocso','pocsoRape','total','severityWeight',
]

function buildGeoStats(districtStats) {
  const geo = {}
  for (const d of districtStats) {
    const g = d.geoName
    if (!geo[g]) { geo[g] = { ...d, csvNames: [d.csvName] }; continue }
    for (const k of GEO_NUMERIC_KEYS) geo[g][k] += d[k]
    geo[g].csvNames.push(d.csvName)
  }
  const vals = Object.values(geo).map(g => g.total)
  const maxV = Math.max(...vals)
  for (const g of Object.values(geo)) g.crimeRate = +(g.total / maxV * 100).toFixed(1)
  return geo
}

// =============================================================================
// PARSER 3 — IPC CATEGORIES (reads from csvSources.ipcCategories)
// =============================================================================

function parseIPCCategories() {
  const rows = parseCSVText(csvSources.ipcCategories).slice(1)
  const cats = []; let curHead = null

  for (const row of rows) {
    const head = row[1]?.trim()
    const val  = row[2]?.trim()
    if (!head) continue

    if (head === 'Sub Total' && val) {
      if (curHead) { cats.push({ name: shortName(curHead), fullName: curHead, total: n(val), type: 'IPC' }) }
      curHead = null
    } else if (!val) {
      if (head !== 'A - IPC Crime' && !head.startsWith('Total')) curHead = head
    }
  }

  const totalRow = rows.find(r => r[1]?.includes('Total Cognizable Crime'))
  const grandTotal = totalRow ? n(totalRow[2]) : cats.reduce((s,c)=>s+c.total,0)

  return {
    grandTotal,
    categories: cats
      .map(c => ({ ...c, pct: +(c.total/grandTotal*100).toFixed(1) }))
      .sort((a,b) => b.total - a.total),
  }
}

// =============================================================================
// PARSER 4 — SLL CATEGORIES (reads from csvSources.sllCategories)
// =============================================================================

function parseSLLCategories() {
  const rows = parseCSVText(csvSources.sllCategories).slice(1)
  const cats = []; const seen = new Set(); let curHead = null

  for (const row of rows) {
    const slNo = row[0]?.trim()
    const head = row[1]?.trim()
    const val  = row[2]?.trim()
    if (!head) continue

    if (head === 'Sub Total' && val) {
      if (curHead && !seen.has(curHead)) {
        cats.push({ name: shortName(curHead), fullName: curHead, total: n(val), type: 'SLL' })
        seen.add(curHead)
      }
      curHead = null
    } else if (slNo && !val) {
      curHead = head
    } else if (slNo && val && !isNaN(parseInt(val)) && head !== 'Sub Total') {
      if (!seen.has(head)) {
        cats.push({ name: shortName(head), fullName: head, total: n(val), type: 'SLL' })
        seen.add(head)
      }
      curHead = null
    }
  }

  const totalRow = rows.find(r => r[1]?.includes('Total (Item'))
  const grandTotal = totalRow ? n(totalRow[2]) : cats.reduce((s,c)=>s+c.total,0)

  return {
    grandTotal,
    categories: cats
      .map(c => ({ ...c, pct: +(c.total/grandTotal*100).toFixed(1) }))
      .sort((a,b) => b.total - a.total),
  }
}

// =============================================================================
// PARSER 5 — MONTHLY REVIEW (reads from csvSources.monthlyReview)
// =============================================================================

function parseMonthlyReview() {
  const rows = parseCSVText(csvSources.monthlyReview).slice(1)
  const heads = {}
  for (const row of rows) {
    const section   = row[1]?.trim()
    const majorHead = row[2]?.trim()
    if (!majorHead || majorHead === 'MAJOR HEADS') continue
    const key = shortName(majorHead)
    if (!heads[key]) heads[key] = { name: key, fullName: majorHead, section, ytd:0, prevYrMonth:0, prevMonth:0, curMonth:0, rowCount:0 }
    heads[key].ytd         += n(row[4])
    heads[key].prevYrMonth += n(row[5])
    heads[key].prevMonth   += n(row[6])
    heads[key].curMonth    += n(row[7])
    heads[key].rowCount++
  }
  return Object.values(heads).sort((a,b) => b.ytd - a.ytd)
}

// =============================================================================
// PARSER 6 — DISTRICT 2025 (reads from csvSources.district2025)
// =============================================================================

const SKIP_2025 = new Set([
  'Commissionerates','Central Range','Eastern Range','Western Range',
  'Northern Range','North Eastern Range','Southern Range','Ballari Range',
  'Karnataka Railways','Districts/Units',
])

function parseDistrict2025() {
  const rows = parseCSVText(csvSources.district2025).slice(1)
  let stateIPC = 0, stateSLL = 0
  const districts = []
  for (const row of rows) {
    const nm  = row[1]?.trim()
    if (!nm) continue
    if (nm === 'STATE') { stateIPC = n(row[2]); stateSLL = n(row[3]); continue }
    if (SKIP_2025.has(nm)) continue
    const ipc = n(row[2]), sll = n(row[3])
    if (ipc === 0 && sll === 0) continue
    districts.push({ name: nm, ipc, sll, total: ipc + sll })
  }
  return { districts: districts.sort((a,b) => b.total-a.total), stateIPC, stateSLL }
}

// =============================================================================
// ANALYTICS 1 — HOTSPOT SCORES (composite weighted Z-score)
// =============================================================================

function computeHotspots(districtStats) {
  const tots = districtStats.map(d => d.total)
  const sevs = districtStats.map(d => d.severityWeight)
  const mt = _mean(tots), st = _std(tots)
  const ms = _mean(sevs), ss = _std(sevs)

  return districtStats
    .map(d => {
      const zt = _z(d.total, mt, st)
      const zs = _z(d.severityWeight, ms, ss)
      const raw = zt * 0.4 + zs * 0.6
      const score = Math.round(Math.max(0, Math.min(100, ((raw + 3)/6)*100)))
      return {
        ...d,
        hotspotScore:  score,
        severityLevel: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'moderate' : 'low',
        riskLabel:     score >= 80 ? 'CRITICAL'  : score >= 60 ? 'HIGH'  : score >= 40 ? 'MODERATE'  : 'LOW',
      }
    })
    .sort((a,b) => b.hotspotScore - a.hotspotScore)
    .map((d,i) => ({ ...d, rank: i+1 }))
}

// =============================================================================
// ANALYTICS 2 — ANOMALY DETECTION (Z-score, |Z| ≥ 1.96)
// =============================================================================

function computeAnomalies(monthlyReview) {
  const anomalies = []

  // Month-over-month spikes
  const mom = monthlyReview.filter(m => m.prevMonth > 0 && m.curMonth > 0)
  if (mom.length > 3) {
    const changes = mom.map(m => ((m.curMonth - m.prevMonth) / m.prevMonth) * 100)
    const mm = _mean(changes), ms = _std(changes)
    mom.forEach((m, i) => {
      const pct = changes[i]; const z = _z(pct, mm, ms)
      if (Math.abs(z) >= 1.96) {
        anomalies.push({
          id: `MOM-${i}`, type: 'Month-over-Month', category: m.name,
          zScore: +z.toFixed(2), changePercent: +pct.toFixed(1),
          current: m.curMonth, reference: m.prevMonth, refLabel: 'Previous Month',
          severity: Math.abs(z) >= 3 ? 'critical' : 'warning',
          direction: pct > 0 ? 'surge' : 'drop',
          source: 'Monthly Review',
          description: `${m.name}: ${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs prev month (Z=${z.toFixed(2)})`,
        })
      }
    })
  }

  // Year-over-year (current month vs same month last year)
  const yoy = monthlyReview.filter(m => m.prevYrMonth > 0 && m.curMonth > 0)
  if (yoy.length > 3) {
    const changes = yoy.map(m => ((m.curMonth - m.prevYrMonth) / m.prevYrMonth) * 100)
    const mm = _mean(changes), ms = _std(changes)
    yoy.forEach((m, i) => {
      const pct = changes[i]; const z = _z(pct, mm, ms)
      if (Math.abs(z) >= 1.96) {
        anomalies.push({
          id: `YOY-${i}`, type: 'Year-on-Year', category: m.name,
          zScore: +z.toFixed(2), changePercent: +pct.toFixed(1),
          current: m.curMonth, reference: m.prevYrMonth, refLabel: 'Same Month Last Year',
          severity: Math.abs(z) >= 3 ? 'critical' : 'warning',
          direction: pct > 0 ? 'surge' : 'drop',
          source: 'Monthly Review',
          description: `${m.name}: ${pct > 0 ? '+' : ''}${pct.toFixed(1)}% YoY (Z=${z.toFixed(2)})`,
        })
      }
    })
  }

  return anomalies.sort((a,b) => Math.abs(b.zScore) - Math.abs(a.zScore))
}

// =============================================================================
// ANALYTICS 3 — FORECASTING (2025→2026 using observed growth rates)
// =============================================================================

function computeForecasts(districtStats, d2025, hotspots) {
  const { districts: dist25, stateIPC: si25 } = d2025
  const ipc24Total = districtStats.reduce((s,d) => s + d.total, 0)
  const stateGrowth = si25 > 0 && ipc24Total > 0 ? (si25 - ipc24Total) / ipc24Total : 0.01

  const d25map = {}
  for (const d of dist25) d25map[d.name.toLowerCase().replace(/[^a-z]/g,'').substring(0,10)] = d

  const hotMap = {}
  for (const h of hotspots) hotMap[h.csvName] = h

  return districtStats.map(d => {
    const nk = d.csvName.toLowerCase().replace(/[^a-z]/g,'').substring(0,10)
    const d25 = d25map[nk]
    const distShare = ipc24Total > 0 ? d.total / ipc24Total : 0
    let growthRate = stateGrowth
    let confidence = 0.65

    if (d25 && d25.ipc > 0) {
      const est24 = ipc24Total * distShare
      const gr = est24 > 0 ? (d25.ipc - est24) / est24 : stateGrowth
      growthRate = Math.max(-0.3, Math.min(0.5, gr))
      confidence = 0.80
    }

    const projected2025 = Math.round(d.total * (1 + growthRate))
    const projected2026 = Math.round(projected2025 * (1 + growthRate * 0.85))
    const hot = hotMap[d.csvName]

    return {
      district: d.csvName, geoName: d.geoName,
      current2024: d.total, projected2025, projected2026,
      growthRate: +(growthRate * 100).toFixed(1),
      confidence: +confidence.toFixed(2),
      hotspotScore: hot?.hotspotScore || 0,
      severityLevel: hot?.severityLevel || 'low',
      topConcerns: [
        d.cyberCrime > 3000 ? `Cyber crime: ${d.cyberCrime.toLocaleString('en-IN')}` : null,
        d.murder > 40      ? `Murder: ${d.murder}` : null,
        d.pocso > 150      ? `POCSO: ${d.pocso}` : null,
        d.rape > 40        ? `Rape cases: ${d.rape}` : null,
        d.scst > 400       ? `SC/ST: ${d.scst}` : null,
      ].filter(Boolean).slice(0,3),
    }
  }).sort((a,b) => b.hotspotScore - a.hotspotScore)
}

// =============================================================================
// ANALYTICS 4 — CROSS-CATEGORY CORRELATIONS (for Sociological Intelligence)
// =============================================================================

function computeCorrelations(districtStats) {
  const pairs = [
    { x: 'cyberCrime',       y: 'theft',           label: 'Cyber Crime vs Theft' },
    { x: 'crueltyByHusband', y: 'dowryDeaths',      label: 'Domestic Violence vs Dowry Deaths' },
    { x: 'pocso',            y: 'rape',             label: 'POCSO vs Rape' },
    { x: 'scst',             y: 'riots',            label: 'SC/ST Crimes vs Riots' },
    { x: 'burglaryNight',    y: 'theft',            label: 'Burglary vs Theft' },
    { x: 'murder',           y: 'attemptToMurder',  label: 'Murder vs Attempt to Murder' },
  ]
  return pairs.map(p => {
    const xs = districtStats.map(d => d[p.x])
    const ys = districtStats.map(d => d[p.y])
    const r  = pearson(xs, ys)
    const points = districtStats.map(d => ({
      district: d.csvName, x: d[p.x], y: d[p.y]
    }))
    return { ...p, correlation: r, strength: Math.abs(r) >= 0.7 ? 'Strong' : Math.abs(r) >= 0.4 ? 'Moderate' : 'Weak', points }
  })
}

function clearObject(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      delete obj[key];
    }
  }
}

// =============================================================================
// COMPILE ANALYTICS — produces all derived data from CSV sources
// =============================================================================

function compileAnalytics() {
  const start = Date.now();
  console.log("[CrimeVision DataLayer] Initializing analytics compilation...");

  const distStats = parseDistrictStats();
  const ipcCat = parseIPCCategories();
  const sllCat = parseSLLCategories();
  const monReview = parseMonthlyReview();
  const dist2025 = parseDistrict2025();

  const gStats = buildGeoStats(distStats);
  const hspots = computeHotspots(distStats);
  const anoms = computeAnomalies(monReview);
  const fcasts = computeForecasts(distStats, dist2025, hspots);
  const corrs = computeCorrelations(distStats);

  // State-level KPI summary (all values from parsed CSV data — no hardcoding)
  const calculatedKPIs = (() => {
    const ipc24 = ipcCat.grandTotal;
    const sll24 = sllCat.grandTotal;
    const total24 = ipc24 + sll24;
    const ipc25 = dist2025.stateIPC;
    const sll25 = dist2025.stateSLL;
    const total25 = ipc25 + sll25;
    return {
      totalIPC2024:     ipc24,
      totalSLL2024:     sll24,
      total2024:        total24,
      totalIPC2025:     ipc25,
      totalSLL2025:     sll25,
      total2025:        total25,
      growthRateIPC:    ipc24 > 0 ? +((ipc25-ipc24)/ipc24*100).toFixed(1) : 0,
      growthRateTotal:  total24 > 0 ? +((total25-total24)/total24*100).toFixed(1) : 0,
      topDistrictTotal: distStats[0]?.csvName || '—',
      topDistrictCyber: [...distStats].sort((a,b)=>b.cyberCrime-a.cyberCrime)[0]?.csvName || '—',
      topDistrictMurder:[...distStats].sort((a,b)=>b.murder-a.murder)[0]?.csvName || '—',
      criticalHotspots: hspots.filter(h=>h.severityLevel==='critical').length,
      totalDistricts:   distStats.length,
      totalAnomalies:   anoms.length,
      totalForecasts:   fcasts.length,
      dataSource:       'Catalyst File Store',
    };
  })();

  const allCat = [
    ...ipcCat.categories,
    ...sllCat.categories,
  ].sort((a,b) => b.total - a.total);

  const monComparison = monReview.slice(0,14);
  const distRankings = distStats.map((d,i) => ({ ...d, rank: i+1 }));

  // In-place updates to keep module destructuring references intact
  districtStats.length = 0;
  districtStats.push(...distStats);

  clearObject(ipcCategories);
  Object.assign(ipcCategories, ipcCat);

  clearObject(sllCategories);
  Object.assign(sllCategories, sllCat);

  monthlyReview.length = 0;
  monthlyReview.push(...monReview);

  clearObject(district2025Data);
  Object.assign(district2025Data, dist2025);

  clearObject(geoStats);
  Object.assign(geoStats, gStats);

  hotspots.length = 0;
  hotspots.push(...hspots);

  anomalies.length = 0;
  anomalies.push(...anoms);

  forecasts.length = 0;
  forecasts.push(...fcasts);

  correlations.length = 0;
  correlations.push(...corrs);

  clearObject(kpis);
  Object.assign(kpis, calculatedKPIs);

  allCategories.length = 0;
  allCategories.push(...allCat);

  monthlyComparison.length = 0;
  monthlyComparison.push(...monComparison);

  districtRankings.length = 0;
  districtRankings.push(...distRankings);

  cachedData = {
    districtStats,
    ipcCategories,
    sllCategories,
    monthlyReview,
    district2025Data,
    geoStats,
    hotspots,
    anomalies,
    forecasts,
    correlations,
    kpis,
    allCategories,
    monthlyComparison,
    districtRankings
  };

  console.log(`[CrimeVision DataLayer] Analytics compilation completed in ${Date.now() - start}ms.`);
  return cachedData;
}

function getCompiledData() {
  if (!cachedData) {
    throw new Error("Analytics cache is not initialized. Please ensure the app has loaded datasets first.");
  }
  return cachedData;
}

// =============================================================================
// EXPORTS — sync references (CommonJS compatible)
// =============================================================================

module.exports = {
  districtStats,
  ipcCategories,
  sllCategories,
  monthlyReview,
  district2025Data,
  geoStats,
  hotspots,
  anomalies,
  forecasts,
  correlations,
  kpis,
  allCategories,
  monthlyComparison,
  districtRankings,
  shortName,
  ensureInitialized,
  invalidateCache,
  recompile,
  getCompiledData
};
