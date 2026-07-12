const { getAllDistricts, getDistrictByName } = require("../services/district.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetDistricts(req, res) {
  try {
    const result = await getAllDistricts(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetDistrictByName(req, res) {
  try {
    const name = req.params && req.params.name;
    if (!name) {
      return sendError(res, "District name parameter is required", 400);
    }
    const result = await getDistrictByName(name);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetDistricts,
  handleGetDistrictByName
};
