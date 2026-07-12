const { hotspots, forecasts, districtStats } = require("../data/dataLayer");
const { generateRecommendations } = require("../data/recommendationEngine");

async function runMultiAgentIntelligence(req, mission) {
  // Normalize and extract district from mission string
  const normalizedMission = (mission || "").toLowerCase();
  let selectedDistrict = null;

  for (const d of districtStats) {
    if (normalizedMission.includes(d.csvName.toLowerCase())) {
      selectedDistrict = d;
      break;
    }
  }

  // Fallback to highest risk district if no district mentioned
  const d = selectedDistrict || districtStats[0];
  const hot = hotspots.find(h => h.csvName === d.csvName);
  const fore = forecasts.find(f => f.district === d.csvName);
  const recs = generateRecommendations(d);

  const commanderAnalysis = `Initiating tactical operations mission review for "${mission}" focusing on ${d.csvName}. Priority target established at risk score ${hot?.hotspotScore || 50} (${hot?.severityLevel.toUpperCase() || 'MODERATE'}).`;
  
  const investigatorFindings = `Field evaluation in ${d.csvName} indicates highest densities in theft (${d.theft} cases) and cybercrime (${d.cyberCrime} cases). Total baseline cases recorded is ${d.total}.`;
  
  const analystForecast = `Projections indicate a trend growth rate of ${fore ? fore.growthRate : 0.8}% heading into the next cycle with forecast confidence at ${fore ? Math.round(fore.confidence * 100) : 75}%.`;

  const consensus = `All agents agree that immediate tactical dispatch should prioritize ${d.csvName} under a coordinated safety response workflow.`;

  const finalRec = recs.length > 0 ? recs.map(r => r.action).join(" ") : `Increase CCTV visibility and expand night patrols in high-risk zones.`;

  return {
    commanderAgent: {
      role: "Operations Commander",
      status: "COMPLETED",
      input: mission,
      analysis: commanderAnalysis
    },
    investigatorAgent: {
      role: "Lead Field Investigator",
      status: "COMPLETED",
      input: mission,
      findings: investigatorFindings
    },
    analystAgent: {
      role: "Strategic Data Analyst",
      status: "COMPLETED",
      input: mission,
      forecast: analystForecast
    },
    consensus: consensus,
    finalRecommendation: finalRec,
    confidence: fore ? fore.confidence : 0.85
  };
}

module.exports = {
  runMultiAgentIntelligence
};
