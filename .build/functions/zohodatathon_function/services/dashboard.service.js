const catalyst = require("zcatalyst-sdk-node");
const { kpis, anomalies, hotspots, districtStats } = require("../data/dataLayer");
const { generateRecommendations } = require("../data/recommendationEngine");

async function getDashboard(req) {
  let officers = [];
  try {
    const app = catalyst.initialize(req);
    const datastore = app.datastore();
    const table = datastore.table("Officers");
    officers = await table.getAllRows();
  } catch (err) {
    // Fallback if table doesn't exist
    officers = [
      { ROWID: "1", name: "DGP Alok Kumar", role: "Director General", status: "Active", district: "State HQ" },
      { ROWID: "2", name: "SP N. Shashi Kumar", role: "Superintendent of Police", status: "Active", district: "Bengaluru City" },
      { ROWID: "3", name: "ASP Harish Pandey", role: "Assistant Superintendent", status: "Active", district: "Mysuru City" }
    ];
  }

  // Active alerts from raw anomalies
  const activeAlerts = anomalies.slice(0, 5).map((a, i) => ({
    id: `alert-${i}`,
    district: a.category,
    severity: a.direction === "surge" ? "CRITICAL" : "HIGH",
    message: a.description,
    timestamp: new Date().toISOString()
  }));

  // Today's top recommendations
  const topDistrict = districtStats[0];
  const recommendations = topDistrict ? generateRecommendations(topDistrict) : [];

  return {
    success: true,
    data: {
      kpis: {
        totalIPC: kpis.totalIPC2024,
        totalSLL: kpis.totalSLL2024,
        totalCrimes: kpis.total2024,
        projected2025: kpis.total2025,
        growthRate: kpis.growthRateTotal,
        criticalHotspots: kpis.criticalHotspots,
        activeAnomalies: kpis.totalAnomalies
      },
      operationalStatus: {
        status: "Operational",
        threatLevel: kpis.criticalHotspots > 3 ? "Elevated" : "Normal",
        activeOfficersCount: officers.filter(o => o.status === "Active").length,
        totalOfficersCount: officers.length
      },
      intelligenceSummary: `Karnataka State Crime Index shows a ${kpis.growthRateTotal}% projected YoY change for 2025. ${kpis.criticalHotspots} districts require critical tactical monitoring.`,
      activeAlerts,
      officers: officers.slice(0, 5),
      todaysRecommendations: recommendations.slice(0, 3),
      topDistricts: districtStats.slice(0, 5).map(d => ({
        name: d.csvName,
        total: d.total,
        severity: hotspots.find(h => h.csvName === d.csvName)?.severityLevel || "moderate"
      })),
      lastUpdated: new Date().toISOString()
    }
  };
}

module.exports = {
  getDashboard
};