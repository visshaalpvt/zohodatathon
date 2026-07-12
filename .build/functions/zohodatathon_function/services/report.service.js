const catalyst = require("zcatalyst-sdk-node");

async function generateReport(req, reportData) {
  const title = reportData.title || "State Crime Analysis Briefing";
  const content = reportData.content || {};

  const doc = {
    title,
    reportType: reportData.reportType || "Executive Summary",
    generatedBy: reportData.officerName || "Intelligence Officer",
    timestamp: new Date().toISOString(),
    content: JSON.stringify(content)
  };

  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("reports");
    const newRow = await table.insertRow(doc);
    return newRow;
  } catch (err) {
    throw new Error(`Failed to insert report into Data Store: ${err.message}`);
  }
}

async function getReportById(req, id) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("reports");
    const row = await table.getRow(id);
    if (row.content && typeof row.content === 'string') {
      try {
        row.content = JSON.parse(row.content);
      } catch (e) {
        // ignore parse error if content is plain text
      }
    }
    return row;
  } catch (err) {
    throw new Error(`Failed to fetch report with ID ${id} from Data Store: ${err.message}`);
  }
}

async function getAllReports(req) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("reports");
    const rows = await table.getPagedRows();
    const result = rows.data || [];
    return result.map(row => {
      if (row.content && typeof row.content === 'string') {
        try { row.content = JSON.parse(row.content); } catch (e) {}
      }
      return row;
    });
  } catch (err) {
    throw new Error(`Failed to list reports from Data Store: ${err.message}`);
  }
}

module.exports = {
  generateReport,
  getReportById,
  getAllReports
};
