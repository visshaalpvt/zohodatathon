const catalyst = require("zcatalyst-sdk-node");

// Helper to parse CSV line
function parseCSVLine(line) {
  const res = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === ',' && !inQ) {
      res.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  res.push(cur.trim());
  return res;
}

// Helper to parse CSV text
function parseCSVText(raw) {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').filter(l => l.trim()).map(parseCSVLine);
}

/**
 * Downloads and parses each active CSV file from Catalyst File Store.
 * Returns normalized datasets in memory.
 */
async function downloadAndNormalizeDatasets(req) {
  const folderId = process.env.DATASETS_FOLDER_ID || process.env.CATALYST_DATASETS_FOLDER_ID;
  if (!folderId) {
    throw new Error("DATASETS_FOLDER_ID or CATALYST_DATASETS_FOLDER_ID environment variable is not set.");
  }

  const app = catalyst.initialize(req);
  const datastore = app.datastore();
  const table = datastore.table('Datasets');

  // 1. Get active datasets mapping from Datastore
  let rows = [];
  try {
    rows = await table.getAllRows();
  } catch(e) {
    throw new Error(`Catalyst Data Store query failed for Datasets table: ${e.message}`);
  }

  if (!rows || rows.length === 0) {
    throw new Error("No active datasets found in Catalyst Data Store. Please upload datasets via the Dataset Manager.");
  }

  // Filter active datasets and get the latest version for each type
  const activeRows = rows.filter(r => r.status === 'active');
  const byType = {};
  for (const row of activeRows) {
    const type = row.dataset_type;
    if (!type) continue;
    const existing = byType[type];
    if (!existing || (row.version && existing.version && Number(row.version) > Number(existing.version))) {
      byType[type] = row;
    }
  }

  const folder = app.filestore().folder(folderId);
  const typeToKey = {
    'district_stats_2024': 'districtStats',
    'sll_categories_2024': 'sllCategories',
    'ipc_categories_2024': 'ipcCategories',
    'monthly_review':      'monthlyReview',
    'district_stats_2025': 'district2025',
  };

  const normalized = {};

  // 3. Download and parse each active type
  for (const [type, key] of Object.entries(typeToKey)) {
    const row = byType[type];
    if (!row) {
      console.warn(`[FileStore] Skipping missing dataset type: ${type}`);
      continue;
    }
    const fileId = row.file_id;
    if (!fileId) {
      console.warn(`[FileStore] No file_id specified in Datastore for dataset type: ${type}`);
      continue;
    }


    try {
      const buffer = await folder.downloadFile(Number(fileId));
      const csvText = buffer.toString('utf8');
      normalized[key] = csvText;
    } catch (dlErr) {
      throw new Error(`Failed to download dataset type ${type} (File ID: ${fileId}) from File Store: ${dlErr.message}`);
    }
  }

  return normalized;
}

module.exports = {
  downloadAndNormalizeDatasets,
  parseCSVText
};
