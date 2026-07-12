const { runMultiAgentIntelligence } = require("../services/agents.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleMultiAgent(req, res) {
  try {
    const body = req.body || {};
    const mission = body.mission;
    if (!mission) {
      return sendError(res, "Mission description 'mission' is required", 400);
    }
    const result = await runMultiAgentIntelligence(req, mission);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleMultiAgent
};
