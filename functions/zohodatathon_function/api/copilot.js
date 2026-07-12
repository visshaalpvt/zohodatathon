const { askCopilot } = require("../services/copilot.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleCopilot(req, res) {
  try {
    const queryText = req.body && req.body.query;
    if (!queryText) {
      return sendError(res, "Query payload 'query' is required", 400);
    }
    const result = await askCopilot(req, queryText);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleCopilot
};
