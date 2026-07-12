const { 
  getWorkspace, 
  saveWorkspaceItem, 
  updateWorkspaceItem, 
  deleteWorkspaceItem 
} = require("../services/workspace.service");
const { sendSuccess, sendError } = require("../utils/response");

async function handleGetWorkspace(req, res) {
  try {
    const result = await getWorkspace(req);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleSaveWorkspaceItem(req, res) {
  try {
    const body = req.body;
    if (!body || !body.type || !body.title) {
      return sendError(res, "Fields 'type' and 'title' are required", 400);
    }
    const result = await saveWorkspaceItem(req, body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleUpdateWorkspaceItem(req, res) {
  try {
    const id = req.params && req.params.id;
    const body = req.body;
    if (!id) {
      return sendError(res, "Workspace item ID is required", 400);
    }
    if (!body) {
      return sendError(res, "Payload is required", 400);
    }
    const result = await updateWorkspaceItem(req, id, body);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleDeleteWorkspaceItem(req, res) {
  try {
    const id = req.params && req.params.id;
    if (!id) {
      return sendError(res, "Workspace item ID is required", 400);
    }
    await deleteWorkspaceItem(req, id);
    return sendSuccess(res, { message: "Workspace item deleted successfully" });
  } catch (err) {
    return sendError(res, err.message);
  }
}

module.exports = {
  handleGetWorkspace,
  handleSaveWorkspaceItem,
  handleUpdateWorkspaceItem,
  handleDeleteWorkspaceItem
};
