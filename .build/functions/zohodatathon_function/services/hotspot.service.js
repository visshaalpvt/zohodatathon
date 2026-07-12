const { hotspots, districtStats } = require("../data/dataLayer");
const { generateRecommendations } = require("../data/recommendationEngine");

async function getHotspots() {
  const result = hotspots.map((h, i) => {
    const d = districtStats.find(ds => ds.csvName === h.csvName);
    const recommendations = d ? generateRecommendations(d) : [];
    return {
      rank: i + 1,
      district: h.csvName,
      totalCrimes: h.total,
      hotspotScore: h.hotspotScore,
      severityLevel: h.severityLevel,
      recommendation: recommendations[0]?.action || "Establish regular policing patrols.",
      recommendationCategory: recommendations[0]?.category || "General Patrol",
      impactEstimate: recommendations[0]?.impact || "Stabilize crime rates",
      confidence: recommendations[0]?.confidence || 75
    };
  });

  return {
    hotspots: result,
    summary: {
      criticalCount: hotspots.filter(h => h.severityLevel === "critical").length,
      highCount: hotspots.filter(h => h.severityLevel === "high").length,
      moderateCount: hotspots.filter(h => h.severityLevel === "moderate").length,
      lowCount: hotspots.filter(h => h.severityLevel === "low").length
    }
  };
}

module.exports = {
  getHotspots
};
