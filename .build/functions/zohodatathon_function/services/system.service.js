const catalyst = require("zcatalyst-sdk-node");
const { districtStats, hotspots, anomalies, forecasts } = require("../data/dataLayer");
const { getAllOfficers } = require("./officer.service");

async function getHealth(req) {
  let dbStatus = "Connected";
  try {
    const app = catalyst.initialize(req);
    await app.datastore().table("Officers").getAllRows();
  } catch (err) {
    dbStatus = "Degraded (Table check skipped)";
  }

  return {
    version: "1.2.0",
    deployment: "Zoho Catalyst Advanced I/O Function",
    uptime: process.uptime(),
    dbStatus,
    serverTimestamp: new Date().toISOString(),
    catalystProject: {
      projectId: "50276000000016025",
      projectName: "ZOHODATATHON",
      env: "Production"
    }
  };
}

async function getAlerts(req) {
  let customAlerts = [];
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("alerts");
    customAlerts = await table.getAllRows();
  } catch (err) {
    console.warn("[System Service] Could not fetch alerts from Data Store:", err.message);
  }

  // Read baseline anomalies as system-generated alerts dynamically
  const systemAlerts = anomalies.slice(0, 8).map((a, i) => ({
    id: `sys-alert-${i}`,
    district: a.category,
    severity: a.direction === "surge" ? "critical" : "high",
    message: a.description,
    timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
    resolved: false
  }));

  return [...customAlerts, ...systemAlerts];
}

async function createAlert(req, data) {
  if (!data.district || !data.message) {
    throw new Error("Missing required fields: district, message");
  }
  
  const newAlert = {
    district: data.district,
    severity: data.severity || "high",
    message: data.message,
    timestamp: new Date().toISOString(),
    resolved: false
  };

  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("alerts");
    const inserted = await table.insertRow(newAlert);

    // Also push a notification for this alert
    await createNotification(req, inserted.message, inserted.severity);
    
    return inserted;
  } catch (err) {
    throw new Error(`Failed to create alert in Data Store: ${err.message}`);
  }
}

async function createNotification(req, message, severity) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Notifications");
    await table.insertRow({
      title: "Intelligence Alert Raised",
      message,
      severity: severity || "high",
      unread: true,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("[System Service] Failed to push notification to Data Store:", err.message);
  }
}

async function getNotifications(req) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Notifications");
    const notifications = await table.getAllRows();
    
    return {
      notifications,
      unreadCount: notifications.filter(n => String(n.unread) === "true" || n.unread === true).length
    };
  } catch (err) {
    throw new Error(`Failed to fetch notifications from Data Store: ${err.message}`);
  }
}

async function searchAll(req, q) {
  if (!q || !q.trim()) {
    return { districts: [], officers: [], hotspots: [], matchingCasesCount: 0 };
  }

  const query = q.toLowerCase().trim();
  
  const matchedDistricts = districtStats
    .filter(d => d.csvName.toLowerCase().includes(query) || d.geoName.toLowerCase().includes(query))
    .map(d => d.csvName);

  let officers = [];
  try {
    officers = await getAllOfficers(req);
  } catch(e) {}
  
  const matchedOfficers = officers
    .filter(o => o.name.toLowerCase().includes(query) || o.role.toLowerCase().includes(query))
    .map(o => ({ name: o.name, role: o.role, district: o.district }));

  const matchedHotspots = hotspots
    .filter(h => h.csvName.toLowerCase().includes(query) || h.severityLevel.toLowerCase().includes(query))
    .map(h => ({ district: h.csvName, score: h.hotspotScore, severity: h.severityLevel }));

  return {
    districts: matchedDistricts,
    officers: matchedOfficers,
    hotspots: matchedHotspots,
    matchingCasesCount: matchedDistricts.length + matchedOfficers.length + matchedHotspots.length
  };
}

async function getCurrentUser(req) {
  let userDetails = {
    userId: "usr-948194",
    email: "ips-hq.ksp@karnataka.gov.in",
    name: "Alok Kumar",
    role: "Director General of Police",
    district: "State HQ, Bengaluru",
    permissions: [
      "ACCESS_COMMAND_CENTER",
      "COMPILE_STATE_BRIEFINGS",
      "MODIFY_OFFICER_REGISTRY",
      "RUN_TACTICAL_SIMULATIONS",
      "VIEW_SENSITIVE_HOTSPOTS"
    ]
  };

  try {
    const app = catalyst.initialize(req);
    const user = await app.auth().getCurrentUser();
    if (user && user.email) {
      userDetails.email = user.email;
      userDetails.name = `${user.lastName || ''} ${user.firstName || ''}`.trim() || user.email;
      userDetails.userId = user.userId;
    }
  } catch (err) {
    // Normal fallback when running locally without a browser session
  }

  return userDetails;
}

module.exports = {
  getHealth,
  getAlerts,
  createAlert,
  getNotifications,
  searchAll,
  getCurrentUser
};
