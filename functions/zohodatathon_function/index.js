'use strict';

// Environment variables are injected by Catalyst at deploy time via catalyst-config.json env_variables.
// For local development, set variables in your shell or use the Catalyst CLI.

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
app.set('trust proxy', true);

// ─── Security Headers (BUG-009) ───────────────────────────────────────────────
// CSP disabled because the app loads Google Fonts and Catalyst SDK from external CDNs
app.use(helmet({ contentSecurityPolicy: false }));

// ─── CORS Configuration (BUG-004) ────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/(?:[a-z0-9-]+\.)*(?:onslate\.in|catalystappexecutor\.in)$/i.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    callback(null, false);
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
app.use(cors(corsOptions));

// ─── Rate Limiting (BUG-011) ─────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: (req) => ['/', '/health', '/me'].includes(req.path),
  message: { success: false, error: "Too many requests. Please try again later." }
});
const copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { success: false, error: "Copilot rate limit exceeded. Please wait before sending more queries." }
});
app.use(generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || "No Origin";
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = safeHeaders.authorization.startsWith("Bearer")
      ? "Bearer <MASKED>"
      : "Zoho-oauthtoken <MASKED>";
  }
  
  console.log(`[API Log] ${new Date().toISOString()} | ${req.method} ${req.originalUrl || req.url} | Origin: ${origin} | Headers: ${JSON.stringify(safeHeaders)}`);
  next();
});

app.use(express.json());

// ─── Authentication Middleware (BUG-005) ──────────────────────────────────────
// requireAuth: Ensures the user has a valid Catalyst session (any role)
async function requireAuth(req, res, next) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.email) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please log in.",
        timestamp: new Date().toISOString()
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed: " + err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// requireAdminAuth: Ensures the user has admin privileges (used on mutation routes)
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

function shouldBypassInitialization(req) {
  // Strip Catalyst Advanced I/O route prefix if present (e.g. /server/zohodatathon_function)
  const cleanPath = (p) => {
    if (!p) return '';
    return p.replace(/^\/server\/[a-zA-Z0-9_]+/, '');
  };

  const path = cleanPath(req.path);
  const originalUrl = cleanPath(req.originalUrl);

  // Direct bypasses
  if (path === '/' || path === '/health' || path === '/me') return true;
  if (originalUrl === '/' || originalUrl === '/health' || originalUrl === '/me') return true;

  // Path prefix / pattern bypasses
  const checkPath = (p) => {
    if (p.startsWith('/officers') || 
        p.startsWith('/workspace') || 
        p.startsWith('/alerts') || 
        p.startsWith('/notifications')) {
      return true;
    }
    // Datasets routes: bypass all except '/datasets/compiled' and '/datasets/rebuild'
    if (p.startsWith('/datasets')) {
      if (p.includes('/compiled') || p.includes('/rebuild')) {
        return false;
      }
      return true;
    }
    return false;
  };

  return checkPath(path) || checkPath(originalUrl);
}

// DataLayer lazy initialization middleware — forces File Store usage on first request
app.use(async (req, res, next) => {
  const isBypass = shouldBypassInitialization(req);
  console.log('[DataLayer Middleware Debug] Path:', req.path, 'OriginalUrl:', req.originalUrl, 'isBypass:', isBypass);
  if (isBypass) {
    return next();
  }

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

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — Public (no auth required)
// ═══════════════════════════════════════════════════════════════════════════════
app.get("/", handleRoot);
app.get("/health", handleHealth);

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — Authenticated (requireAuth)
// ═══════════════════════════════════════════════════════════════════════════════

// Session / Identity
app.get("/me", requireAuth, handleMe);
app.get("/search", requireAuth, handleSearch);

// Dashboard
app.get("/dashboard", requireAuth, dashboard);

// Officers CRUD (read = requireAuth, write = requireAdminAuth kept below)
app.get("/officers", requireAuth, handleGetOfficers);
app.get("/officers/:id", requireAuth, handleGetOfficerById);
app.post("/officers", requireAdminAuth, handleCreateOfficer);
app.put("/officers/:id", requireAdminAuth, handleUpdateOfficer);
app.delete("/officers/:id", requireAdminAuth, handleDeleteOfficer);

// District Intelligence
app.get("/districts", requireAuth, handleGetDistricts);
app.get("/districts/:name", requireAuth, handleGetDistrictByName);

// Crime Analytics & Categories
app.get("/crime-analytics", requireAuth, handleGetCrimeAnalytics);
app.get("/categories", requireAuth, handleGetCategories);
app.get("/categories/ipc", requireAuth, handleGetIPCCategories);
app.get("/categories/sll", requireAuth, handleGetSLLCategories);

// Analytics Modules
app.get("/hotspots", requireAuth, handleGetHotspots);
app.get("/forecast", requireAuth, handleGetForecasts);
app.get("/anomalies", requireAuth, handleGetAnomalies);
app.get("/recommendations", requireAuth, handleGetRecommendations);
app.get("/trends", requireAuth, handleGetTrends);
app.get("/sociological", requireAuth, handleGetSociological);
app.get("/network", requireAuth, handleGetNetwork);

// AI & Simulation (copilot gets stricter rate limit)
app.post("/copilot", requireAuth, copilotLimiter, handleCopilot);
// Defensive GET handler — surfaces a clear 405 instead of a generic 404
app.get("/copilot", (req, res) => {
  res.status(405).json({
    success: false,
    error: "Method Not Allowed. The /copilot endpoint requires a POST request with JSON body { \"query\": \"...\" }.",
    hint: "Use: POST /server/zohodatathon_function/copilot with Content-Type: application/json",
    timestamp: new Date().toISOString()
  });
});
app.post("/simulation", requireAuth, handleSimulation);
app.post("/agents", requireAuth, handleMultiAgent);

// Reports
app.post("/reports/generate", requireAuth, handleGenerateReport);
app.get("/reports", requireAuth, handleGetReports);
app.get("/reports/:id", requireAuth, handleGetReportById);

// Workspace CRUD
app.get("/workspace", requireAuth, handleGetWorkspace);
app.post("/workspace", requireAuth, handleSaveWorkspaceItem);
app.put("/workspace/:id", requireAuth, handleUpdateWorkspaceItem);
app.delete("/workspace/:id", requireAuth, handleDeleteWorkspaceItem);

// Alerts & Notifications
app.get("/alerts", requireAuth, handleGetAlerts);
app.post("/alerts", requireAuth, handleCreateAlert);
app.get("/notifications", requireAuth, handleGetNotifications);

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — Admin (requireAdminAuth for mutations)
// ═══════════════════════════════════════════════════════════════════════════════

// Dataset Management (reads are auth-only, writes are admin-only)
app.get("/datasets", requireAuth, handleListDatasets);
app.get("/datasets/compiled", requireAuth, handleGetCompiledAnalytics);
app.get("/datasets/:id", requireAuth, handleGetDatasetById);
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