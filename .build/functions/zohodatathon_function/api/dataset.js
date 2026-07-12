const datasetService = require("../services/dataset.service");
const { sendSuccess, sendError } = require("../utils/response");
const dataLayer = require("../data/dataLayer");

async function handleListDatasets(req, res) {
  try {
    const list = await datasetService.listDatasets(req);
    return sendSuccess(res, list);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetDatasetById(req, res) {
  try {
    const { id } = req.params;
    const details = await datasetService.getDatasetById(req, id);
    return sendSuccess(res, details);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleUploadDataset(req, res) {
  try {
    const file = req.file;
    const metadata = {
      dataset_type: req.body.dataset_type,
      year: req.body.year,
      uploaded_by: req.body.uploaded_by
    };

    if (!file) {
      return sendError(res, "No file uploaded. Please upload a valid CSV file using the key 'file'.", 400);
    }
    if (!metadata.dataset_type) {
      return sendError(res, "Missing dataset_type. Valid types: district_stats_2024, sll_categories_2024, ipc_categories_2024, monthly_review, district_stats_2025.", 400);
    }

    const result = await datasetService.uploadDataset(req, file, metadata);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleReplaceDataset(req, res) {
  try {
    const { id } = req.params;
    const file = req.file;
    const metadata = {
      year: req.body.year,
      uploaded_by: req.body.uploaded_by
    };

    if (!file) {
      return sendError(res, "No file uploaded. Please provide a replacement CSV file.", 400);
    }

    const result = await datasetService.replaceDataset(req, id, file, metadata);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleDeleteDataset(req, res) {
  try {
    const { id } = req.params;
    await datasetService.deleteDataset(req, id);
    return sendSuccess(res, { message: `Dataset ${id} deleted successfully.` });
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleRebuildAnalytics(req, res) {
  try {
    const newKpis = await datasetService.rebuildAnalytics(req);
    return sendSuccess(res, {
      message: "Analytics compiled successfully from newest File Store datasets.",
      kpis: newKpis
    });
  } catch (err) {
    return sendError(res, err.message);
  }
}

async function handleGetCompiledAnalytics(req, res) {
  try {
    const data = dataLayer.getCompiledData();
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message, 503);
  }
}

module.exports = {
  handleListDatasets,
  handleGetDatasetById,
  handleUploadDataset,
  handleReplaceDataset,
  handleDeleteDataset,
  handleRebuildAnalytics,
  handleGetCompiledAnalytics
};
