const { getCurrentUser } = require("../services/system.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleMe(req, res) {
  try {
    const result = await getCurrentUser(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleMe
};
