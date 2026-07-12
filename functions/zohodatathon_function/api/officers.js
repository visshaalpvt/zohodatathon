const { 
  getAllOfficers, 
  getOfficerById, 
  createOfficer, 
  updateOfficer, 
  deleteOfficer 
} = require("../services/officer.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetOfficers(req, res) {
  try {
    const result = await getAllOfficers(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetOfficerById(req, res) {
  try {
    const id = req.params && req.params.id;
    if (!id) {
      return sendError(res, "Officer ID is required", 400);
    }
    const result = await getOfficerById(req, id);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 404);
  }
}

async function handleCreateOfficer(req, res) {
  try {
    const body = req.body;
    if (!body || !body.name || !body.role) {
      return sendError(res, "Fields 'name' and 'role' are required", 400);
    }
    const result = await createOfficer(req, body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleUpdateOfficer(req, res) {
  try {
    const id = req.params && req.params.id;
    const body = req.body;
    if (!id) {
      return sendError(res, "Officer ID is required", 400);
    }
    if (!body) {
      return sendError(res, "Payload is required", 400);
    }
    const result = await updateOfficer(req, id, body);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleDeleteOfficer(req, res) {
  try {
    const id = req.params && req.params.id;
    if (!id) {
      return sendError(res, "Officer ID is required", 400);
    }
    await deleteOfficer(req, id);
    return sendSuccess(res, { message: "Officer deleted successfully" });
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetOfficers,
  handleGetOfficerById,
  handleCreateOfficer,
  handleUpdateOfficer,
  handleDeleteOfficer
};
