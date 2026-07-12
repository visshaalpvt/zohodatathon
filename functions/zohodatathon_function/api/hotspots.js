const { getHotspots } = require("../services/hotspot.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetHotspots(req, res) {
  try {
    const result = await getHotspots(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetHotspots
};
