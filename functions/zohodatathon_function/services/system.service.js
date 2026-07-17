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
    console.warn("[System Service] Could not fetch notifications from Data Store:", err.message);
    return {
      notifications: [],
      unreadCount: 0
    };
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
  try {
    const app = catalyst.initialize(req);
    const user = await app.userManagement().getCurrentUser();
    
    if (!user || !user.email) {
      throw new Error("No active authenticated session.");
    }

    const email = user.email;
    
    // Strict format validation
    if (!email || typeof email !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      throw new Error("Invalid email format.");
    }

    // Use Data Store criteria query instead of raw ZCQL to prevent injection
    const table = app.datastore().table("Officers");
    const result = await table.getPagedRows({ where: [{ column: "email", comparator: "=", value: email }] });
    const rows = result.data || [];
    const officersTable = rows.length > 0 ? rows[0] : null;

    let officerProfile;
    
    if (!officersTable) {
      // First login - auto create officer profile
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;
      const table = app.datastore().table("Officers");
      
      officerProfile = await table.insertRow({
        name: fullName,
        email: email,
        role: "Officer", // Default role
        status: "Active",
        district: "Unassigned",
        permissions: ["VIEW_DASHBOARD"],
        login_count: 1,
        last_login: new Date().toISOString()
      });
    } else {
      // Subsequent login - update login stats
      officerProfile = officersTable;
      const table = app.datastore().table("Officers");
      
      await table.updateRow({
        ROWID: officerProfile.ROWID,
        login_count: (Number(officerProfile.login_count) || 0) + 1,
        last_login: new Date().toISOString()
      });
    }

    // Merge Catalyst Authentication properties with Officers profile
    return {
      userId: user.userId,
      email: officerProfile.email || email,
      name: officerProfile.name,
      role: officerProfile.role || "Officer",
      status: user.status, // e.g. "Unverified", "Active"
      district: officerProfile.district || "Unassigned",
      permissions: officerProfile.permissions || [],
      is_verified: user.status === "ACTIVE" // Catalyst auth status
    };

  } catch (err) {
    console.warn("[System Service] Auth sync failed:", err.message);
    // Return null so the frontend handles it as logged out
    return null;
  }
}

module.exports = {
  getHealth,
  getAlerts,
  createAlert,
  getNotifications,
  searchAll,
  getCurrentUser
};
