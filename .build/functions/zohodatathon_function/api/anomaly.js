const { getAnomalies } = require("../services/anomaly.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetAnomalies(req, res) {
  try {
    const result = await getAnomalies(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetAnomalies
};
