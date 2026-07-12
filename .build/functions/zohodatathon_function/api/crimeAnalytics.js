const { 
  districtStats, ipcCategories, sllCategories, 
  allCategories, correlations, monthlyComparison,
  hotspots, forecasts, geoStats
} = require("../data/dataLayer");
const { generateRecommendations } = require("../data/recommendationEngine");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetCrimeAnalytics(req, res) {
  try {
    const data = districtStats.map(d => ({
      district: d.csvName,
      total: d.total,
      severity: hotspots.find(h => h.csvName === d.csvName)?.severityLevel || "moderate",
      coordinates: geoStats[d.csvName] || null
    }));
    return sendSuccess(res, {
      districts: data,
      stateTotal: districtStats.reduce((s, d) => s + d.total, 0),
      topDistricts: districtStats.slice(0, 5).map(d => d.csvName)
    });
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetCategories(req, res) {
  try {
    return sendSuccess(res, {
      all: allCategories,
      grandTotal: ipcCategories.grandTotal + sllCategories.grandTotal
    });
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetIPCCategories(req, res) {
  try {
    return sendSuccess(res, ipcCategories);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetSLLCategories(req, res) {
  try {
    return sendSuccess(res, sllCategories);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetTrends(req, res) {
  try {
    return sendSuccess(res, {
      monthlyTrends: monthlyComparison,
      yoyGrowthRates: forecasts.slice(0, 10).map(f => ({
        district: f.district,
        growthRate: f.growthRate
      }))
    });
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetSociological(req, res) {
  try {
    return sendSuccess(res, correlations);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetNetwork(req, res) {
  try {
    // Generate nodes and edges strictly following districts, categories, and forecast trends
    const nodes = [];
    const edges = [];

    // District Nodes
    const topDistricts = districtStats.slice(0, 15);
    topDistricts.forEach((d, idx) => {
      const hot = hotspots.find(h => h.csvName === d.csvName);
      nodes.push({
        id: `d-${d.csvName}`,
        label: d.csvName,
        type: "district",
        size: Math.max(10, Math.round(d.total / 1000)),
        color: hot?.severityLevel === "critical" ? "red" : hot?.severityLevel === "high" ? "orange" : "blue"
      });
    });

    // Category Nodes
    const categories = ["murder", "rape", "theft", "cyberCrime", "pocso"];
    categories.forEach(cat => {
      nodes.push({
        id: `c-${cat}`,
        label: cat.toUpperCase(),
        type: "category",
        size: 15,
        color: "purple"
      });
    });

    // Connect Districts to Categories if they exceed a case count threshold
    topDistricts.forEach(d => {
      categories.forEach(cat => {
        const count = d[cat] || 0;
        if (count > 100) {
          edges.push({
            id: `e-${d.csvName}-${cat}`,
            source: `d-${d.csvName}`,
            target: `c-${cat}`,
            weight: Math.max(1, Math.round(count / 100))
          });
        }
      });
    });

    return sendSuccess(res, { nodes, edges });
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetRecommendations(req, res) {
  try {
    const districtName = req.query.district;
    if (districtName) {
      const d = districtStats.find(ds => ds.csvName.toLowerCase() === districtName.toLowerCase().trim());
      if (!d) return sendError(res, `District "${districtName}" not found`, 404);
      const recs = generateRecommendations(d);
      return sendSuccess(res, recs);
    }

    // Default to state-wide top recommendations compiled from top hotspots
    const topHotspots = hotspots.slice(0, 3);
    const recs = topHotspots.flatMap(h => {
      const d = districtStats.find(ds => ds.csvName === h.csvName);
      return d ? generateRecommendations(d) : [];
    });

    return sendSuccess(res, recs);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetCrimeAnalytics,
  handleGetCategories,
  handleGetIPCCategories,
  handleGetSLLCategories,
  handleGetTrends,
  handleGetSociological,
  handleGetNetwork,
  handleGetRecommendations
};
