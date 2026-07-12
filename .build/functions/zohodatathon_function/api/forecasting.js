const { getForecasts } = require("../services/forecasting.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetForecasts(req, res) {
  try {
    const result = await getForecasts(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetForecasts
};
