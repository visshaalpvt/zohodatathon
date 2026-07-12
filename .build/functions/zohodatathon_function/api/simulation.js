const { runSimulation } = require("../services/simulation.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleSimulation(req, res) {
  try {
    const body = req.body || {};
    const result = await runSimulation(req, body.multipliers, body.policyMults);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleSimulation
};
