const { districtStats, hotspots } = require("../data/dataLayer");

const CRIME_KEYS = [
  { key: 'murder', label: 'Murder' },
  { key: 'rape', label: 'Rape' },
  { key: 'theft', label: 'Theft' },
  { key: 'cyberCrime', label: 'Cyber Crime' },
  { key: 'robbery', label: 'Robbery' },
  { key: 'pocso', label: 'POCSO' },
  { key: 'scst', label: 'SC/ST Crimes' },
  { key: 'molestation', label: 'Molestation' },
  { key: 'riots', label: 'Riots' },
  { key: 'burglaryNight', label: 'Burglary (Night)' },
];

function _mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function _std(arr) {
  const m = _mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1))
}

async function runSimulation(req, multipliers = {}, policyMults = {}) {
  // Extract inputs
  const policy = {
    patrolDensity: policyMults.patrolDensity !== undefined ? policyMults.patrolDensity : 0,
    womenPatrol: policyMults.womenPatrol !== undefined ? policyMults.womenPatrol : 0,
    cctvCoverage: policyMults.cctvCoverage !== undefined ? policyMults.cctvCoverage : 0,
    budget: policyMults.budget !== undefined ? policyMults.budget : 0,
    resourceAllocation: policyMults.resourceAllocation !== undefined ? policyMults.resourceAllocation : 0,
    ...policyMults
  };

  const mults = {
    murder: 0, rape: 0, theft: 0, cyberCrime: 0, robbery: 0,
    pocso: 0, scst: 0, molestation: 0, riots: 0, burglaryNight: 0,
    ...multipliers
  };

  // Intervention effects
  const patrolEffect = 1 - (policy.patrolDensity / 100) * 0.45;
  const womenSafetyEffect = 1 - (policy.womenPatrol / 100) * 0.50;
  const cctvEffect = 1 - (policy.cctvCoverage / 100) * 0.35;

  const simulated = districtStats.map(d => {
    const sim = { ...d };

    for (const { key } of CRIME_KEYS) {
      let val = d[key] || 0;
      const m = mults[key] || 0;
      val = val * (1 + m / 100);

      if (key === 'theft' || key === 'robbery' || key === 'burglaryNight') {
        val = val * patrolEffect * cctvEffect;
      } else if (key === 'rape' || key === 'pocso' || key === 'molestation') {
        val = val * womenSafetyEffect;
      } else if (key === 'riots') {
        val = val * patrolEffect;
      }

      sim[key] = Math.max(0, Math.round(val));
    }

    // Recompute total
    sim.total = CRIME_KEYS.reduce((s, { key }) => s + (sim[key] || 0), 0) +
      (sim.attemptToMurder || 0) + (sim.dacoity || 0) + (sim.burglaryDay || 0) +
      (sim.casesOfHurt || 0) + (sim.crueltyByHusband || 0) + (sim.dowryDeaths || 0) +
      (sim.fatalAccidents || 0) + (sim.nonFatalAccidents || 0) + (sim.gambling || 0) + (sim.dpAct || 0) + (sim.pocsoRape || 0);

    // Recompute severity
    sim.severityWeight = sim.murder * 10 + sim.rape * 8 + sim.pocso * 8 + (sim.dowryDeaths || 0) * 7 +
      (sim.dacoity || 0) * 6 + sim.scst * 5 + sim.robbery * 4 + sim.molestation * 4 +
      (sim.crueltyByHusband || 0) * 3 + ((sim.burglaryDay || 0) + (sim.burglaryNight || 0)) * 2 +
      sim.cyberCrime * 2 + sim.theft + sim.riots * 3;

    return sim;
  });

  const tots = simulated.map(d => d.total);
  const sevs = simulated.map(d => d.severityWeight);
  const mt = _mean(tots), st = _std(tots);
  const ms = _mean(sevs), ss = _std(sevs);

  const finalDistricts = simulated.map(d => {
    const zt = st > 0 ? (d.total - mt) / st : 0;
    const zs = ss > 0 ? (d.severityWeight - ms) / ss : 0;
    const raw = zt * 0.4 + zs * 0.6;
    const score = Math.round(Math.max(0, Math.min(100, ((raw + 3) / 6) * 100)));
    return {
      name: d.csvName,
      total: d.total,
      hotspotScore: score,
      severityLevel: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'moderate' : 'low',
    };
  });

  const baseTotal = districtStats.reduce((s, d) => s + d.total, 0);
  const simTotal = finalDistricts.reduce((s, d) => s + d.total, 0);
  const totalDelta = simTotal - baseTotal;
  const projectedReductionPct = baseTotal > 0 ? -((totalDelta / baseTotal) * 100) : 0;

  const baseCritical = hotspots.filter(h => h.severityLevel === 'critical').length;
  const simCritical = finalDistricts.filter(s => s.severityLevel === 'critical').length;

  const rankingChanges = finalDistricts.map((fd, i) => {
    const original = hotspots.find(h => h.csvName === fd.name);
    const baseRank = original ? original.rank : (i + 1);
    const simRank = i + 1;
    return {
      district: fd.name,
      baseRank,
      simulatedRank: simRank,
      rankChange: baseRank - simRank,
      baseScore: original?.hotspotScore || 50,
      simulatedScore: fd.hotspotScore,
      delta: fd.hotspotScore - (original?.hotspotScore || 50)
    };
  }).filter(c => c.delta !== 0).slice(0, 10);

  const recommendation = totalDelta < 0
    ? `Implement the safety policy matrix. Patrolling and women protection forces will yield an estimated crime reduction of ${projectedReductionPct.toFixed(1)}% across critical sectors.`
    : `Current policies do not provide positive crime reduction. Refine resource allocation weights or increase CCTV coverage density.`;

  return {
    updatedRisk: `${simCritical} Critical Hotspots (from baseline ${baseCritical})`,
    projectedReduction: `${projectedReductionPct.toFixed(1)}% drop in statewide reported incidents`,
    forecast: `Projected state total: ${simTotal.toLocaleString('en-IN')} cases (reduction of ${Math.abs(totalDelta).toLocaleString('en-IN')})`,
    impact: `INR ${(policy.budget || 5000000).toLocaleString('en-IN')} budget allocated across high-risk sectors with ${(policy.resourceAllocation || 80)}% deployment concentration`,
    districtRankingChanges: rankingChanges,
    aiRecommendation: recommendation,
    // Maintain backwards compatibility for UI lists
    totalCrimeDelta: totalDelta,
    simulatedTotal: simTotal,
    baseCriticalCount: baseCritical,
    simulatedCriticalCount: simCritical,
    rankings: rankingChanges
  };
}

module.exports = {
  runSimulation
};
