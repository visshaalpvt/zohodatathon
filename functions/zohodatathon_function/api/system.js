const { 
  getHealth, 
  getAlerts, 
  createAlert, 
  getNotifications, 
  searchAll 
} = require("../services/system.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleRoot(req, res) {
  return sendSuccess(res, {
    message: "CrimeVision Intelligence Operating System Backend Running 🚀",
    apiScope: "Karnataka State Police HQ Data Integration Layer",
    authProvider: "Zoho Catalyst Integration"
  });
}

async function handleHealth(req, res) {
  return res.json({
    success: true,
    status: "ok",
    reqPath: req.path,
    reqOriginalUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}

async function handleGetAlerts(req, res) {
  try {
    const result = await getAlerts(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleCreateAlert(req, res) {
  try {
    const body = req.body;
    if (!body || !body.district || !body.message) {
      return sendError(res, "Fields 'district' and 'message' are required", 400);
    }
    const result = await createAlert(req, body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetNotifications(req, res) {
  try {
    const result = await getNotifications(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleSearch(req, res) {
  try {
    const queryText = req.query && req.query.q;
    const result = await searchAll(req, queryText);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleRoot,
  handleHealth,
  handleGetAlerts,
  handleCreateAlert,
  handleGetNotifications,
  handleSearch
};
