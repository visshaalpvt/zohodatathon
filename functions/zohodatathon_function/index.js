'use strict';

// Environment variables are injected by Catalyst at deploy time via catalyst-config.json env_variables.
// For local development, set variables in your shell or use the Catalyst CLI.

const express = require("express");
const cors = require("cors");

// Import controllers
const { dashboard } = require("./api/dashboard");
const { handleRoot, handleHealth, handleGetAlerts, handleCreateAlert, handleGetNotifications, handleSearch } = require("./api/system");
const { handleGetOfficers, handleGetOfficerById, handleCreateOfficer, handleUpdateOfficer, handleDeleteOfficer } = require("./api/officers");
const { handleGetDistricts, handleGetDistrictByName } = require("./api/districts");
const { handleGetCrimeAnalytics, handleGetCategories, handleGetIPCCategories, handleGetSLLCategories, handleGetTrends, handleGetSociological, handleGetNetwork, handleGetRecommendations } = require("./api/crimeAnalytics");
const { handleGetHotspots } = require("./api/hotspots");
const { handleGetForecasts } = require("./api/forecasting");
const { handleGetAnomalies } = require("./api/anomaly");
const { handleCopilot } = require("./api/copilot");
const { handleSimulation } = require("./api/simulation");
const { handleMultiAgent } = require("./api/agents");
const { handleGenerateReport, handleGetReportById, handleGetReports } = require("./api/reports");
const { handleGetWorkspace, handleSaveWorkspaceItem, handleUpdateWorkspaceItem, handleDeleteWorkspaceItem } = require("./api/workspace");
const { handleMe } = require("./api/auth");
const {
  handleListDatasets,
  handleGetDatasetById,
  handleUploadDataset,
  handleReplaceDataset,
  handleDeleteDataset,
  handleRebuildAnalytics,
  handleGetCompiledAnalytics
} = require("./api/dataset");

const dataLayer = require("./data/dataLayer");
const { getCurrentUser } = require("./services/system.service");
const multer = require("multer");

// Configure Multer for in-memory file storage (up to 100 MB limits)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

const app = express();

// Configure CORS Options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requesting origin dynamically to support localhost and production frontend domains
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "CATALYST-ORG",
    "Accept",
    "Origin"
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Mount CORS middleware
app.use(cors(corsOptions));

// Request logging & Preflight middleware (OPTIONS handler)
app.use((req, res, next) => {
  const origin = req.headers.origin || "No Origin";
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = safeHeaders.authorization.startsWith("Bearer")
      ? "Bearer <MASKED>"
      : "Zoho-oauthtoken <MASKED>";
  }
  
  console.log(`[API Log] ${new Date().toISOString()} | ${req.method} ${req.originalUrl || req.url} | Origin: ${origin} | Headers: ${JSON.stringify(safeHeaders)}`);
  
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, CATALYST-ORG, Accept, Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Admin authorization middleware using Catalyst User Auth (Option B)
async function requireAdminAuth(req, res, next) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.email) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized access. This action requires authenticated administrator privileges.",
        timestamp: new Date().toISOString()
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized access: " + err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// DataLayer lazy initialization middleware — forces File Store usage on first request
app.use(async (req, res, next) => {
  try {
    if (!dataLayer.__debugLogDone) {
      const catalystHeaders = Object.entries(req.headers)
        .filter(([k]) => k.startsWith('x-zc-') || k.startsWith('x-zoho-'))
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.substring(0, 40) : v}`);
      console.log('[DataLayer Init Debug] Catalyst headers on first request:', catalystHeaders.length ? catalystHeaders : 'NONE');
      dataLayer.__debugLogDone = true;
    }
    await dataLayer.ensureInitialized(req);
    next();
  } catch (err) {
    console.error("[DataLayer Lazy Init Error] Full stack trace:", err);
    return res.status(503).json({
      success: false,
      error: "Catalyst File Store is temporarily unavailable: " + err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System and Health
app.get("/", handleRoot);
app.get("/health", handleHealth);
app.get("/me", handleMe);
app.get("/search", handleSearch);

// Dashboard
app.get("/dashboard", dashboard);

// Officers CRUD
app.get("/officers", handleGetOfficers);
app.get("/officers/:id", handleGetOfficerById);
app.post("/officers", handleCreateOfficer);
app.put("/officers/:id", handleUpdateOfficer);
app.delete("/officers/:id", handleDeleteOfficer);

// District Intelligence
app.get("/districts", handleGetDistricts);
app.get("/districts/:name", handleGetDistrictByName);

// Crime Analytics & Categories
app.get("/crime-analytics", handleGetCrimeAnalytics);
app.get("/categories", handleGetCategories);
app.get("/categories/ipc", handleGetIPCCategories);
app.get("/categories/sll", handleGetSLLCategories);

// Analytics Modules
app.get("/hotspots", handleGetHotspots);
app.get("/forecast", handleGetForecasts);
app.get("/anomalies", handleGetAnomalies);
app.get("/recommendations", handleGetRecommendations);
app.get("/trends", handleGetTrends);
app.get("/sociological", handleGetSociological);
app.get("/network", handleGetNetwork);

// AI & Simulation
app.post("/copilot", handleCopilot);
// Defensive GET handler — surfaces a clear 405 instead of a generic 404
// (debug log showed accidental GET /copilot requests during testing)
app.get("/copilot", (req, res) => {
  res.status(405).json({
    success: false,
    error: "Method Not Allowed. The /copilot endpoint requires a POST request with JSON body { \"query\": \"...\" }.",
    hint: "Use: POST /server/zohodatathon_function/copilot with Content-Type: application/json",
    timestamp: new Date().toISOString()
  });
});
app.post("/simulation", handleSimulation);
app.post("/agents", handleMultiAgent);


// Reports
app.post("/reports/generate", handleGenerateReport);
app.get("/reports", handleGetReports);
app.get("/reports/:id", handleGetReportById);


// Workspace CRUD
app.get("/workspace", handleGetWorkspace);
app.post("/workspace", handleSaveWorkspaceItem);
app.put("/workspace/:id", handleUpdateWorkspaceItem);
app.delete("/workspace/:id", handleDeleteWorkspaceItem);

// Alerts & Notifications
app.get("/alerts", handleGetAlerts);
app.post("/alerts", handleCreateAlert);
app.get("/notifications", handleGetNotifications);

// Dataset Management
app.get("/datasets", handleListDatasets);
app.get("/datasets/compiled", handleGetCompiledAnalytics);
app.get("/datasets/:id", handleGetDatasetById);
app.post("/datasets/upload", requireAdminAuth, upload.single("file"), handleUploadDataset);
app.put("/datasets/:id", requireAdminAuth, upload.single("file"), handleReplaceDataset);
app.delete("/datasets/:id", requireAdminAuth, handleDeleteDataset);
app.post("/datasets/rebuild", requireAdminAuth, handleRebuildAnalytics);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[API Error]", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString()
  });
});

module.exports = app;