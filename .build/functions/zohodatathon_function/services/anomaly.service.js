const { anomalies } = require("../data/dataLayer");
const { generateExplainableAI } = require("../data/recommendationEngine");

async function getAnomalies(req) {
  const result = anomalies.map((a, i) => {
    // Generate evidence dynamically
    const evidence = generateExplainableAI(
      'ANOMALY_DETECTION',
      [a.source || 'f3dc65a9 Monthly Review'],
      ['Statewide'],
      [a.category]
    );

    // AI explanation & Recommended Action based on direction
    const observed = a.current || 0;
    const expected = a.reference || 0;
    const absChange = Math.abs(observed - expected);
    const directionStr = a.direction === "surge" ? "surge" : "decline";
    
    const aiExplanation = `An anomaly of type ${a.type} was detected in ${a.category} with a Z-Score of ${a.zScore}. The observed value is ${observed} vs the baseline expected value of ${expected}, indicating a statistically significant ${directionStr} of ${absChange} cases (${a.changePercent}% delta).`;

    const recommendedAction = a.direction === "surge"
      ? `Deploy immediate tactical patrols, inspect local hot corridors, and allocate specialized task force teams targeting ${a.category} spike zones.`
      : `Analyze if the drop of cases in ${a.category} is due to successful enforcement policies, administrative reporting delays, or systemic underreporting.`;

    return {
      id: a.id || `anomaly-${i}`,
      district: "Statewide HQ",
      crimeCategory: a.category,
      observedValue: observed,
      expectedValue: expected,
      zScore: a.zScore,
      severity: a.severity || "warning",
      reason: a.description || `${a.category} surge detected`,
      aiExplanation: aiExplanation,
      evidence: evidence.sources || [a.source || 'f3dc65a9 Monthly Review'],
      confidence: 0.85,
      recommendedAction: recommendedAction
    };
  });

  return {
    anomalies: result,
    totalCount: result.length,
    criticalCount: result.filter(r => r.severity === 'critical' || r.zScore > 2).length
  };
}

module.exports = {
  getAnomalies
};
