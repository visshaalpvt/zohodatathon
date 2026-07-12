const { generateReport, getReportById, getAllReports } = require("../services/report.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGenerateReport(req, res) {
  try {
    const body = req.body;
    if (!body || !body.content) {
      return sendError(res, "Report payload 'content' is required", 400);
    }
    const result = await generateReport(req, body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetReportById(req, res) {
  try {
    const id = req.params && req.params.id;
    if (!id) {
      return sendError(res, "Report ID is required", 400);
    }
    const result = await getReportById(req, id);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 404);
  }
}

async function handleGetReports(req, res) {
  try {
    const result = await getAllReports(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGenerateReport,
  handleGetReportById,
  handleGetReports
};

