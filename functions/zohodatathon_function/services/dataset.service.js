const catalyst = require("zcatalyst-sdk-node");
const stream = require("stream");
const dataLayer = require("../data/dataLayer");

function parseCSVText(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.replace(/\r\n/g,'\n').replace(/\r/g,'\n')
    .split('\n').filter(l => l.trim()).map(line => {
      const res = []; let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ;
        } else if (c === ',' && !inQ) { res.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      res.push(cur.trim());
      return res;
    });
}

async function listDatasets(req) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Datasets");
    const rows = await table.getAllRows();
    return rows;
  } catch (err) {
    throw new Error(`Failed to list datasets from Data Store: ${err.message}`);
  }
}

async function getDatasetById(req, id) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Datasets");
    const row = await table.getRow(id);
    
    // Download first 20 rows from File Store for preview
    const fileId = row.file_id;
    let previewRows = [];
    if (fileId && process.env.CATALYST_DATASETS_FOLDER_ID) {
      try {
        const folder = app.filestore().folder(process.env.CATALYST_DATASETS_FOLDER_ID);
        const buffer = await folder.downloadFile(Number(fileId));
        const csvContent = buffer.toString("utf8");
        const parsed = parseCSVText(csvContent);
        previewRows = parsed.slice(0, 21); // Header + 20 data rows
      } catch (dlErr) {
        console.warn("[Dataset Service] File Store download failed for preview:", dlErr.message);
      }
    }
    
    return {
      metadata: row,
      preview: previewRows
    };
  } catch (err) {
    throw new Error(`Failed to fetch dataset with ID ${id} from Data Store: ${err.message}`);
  }
}

async function uploadDataset(req, file, metadata) {
  if (!file) {
    throw new Error("CSV File is required for upload.");
  }
  const folderId = process.env.CATALYST_DATASETS_FOLDER_ID;
  if (!folderId) {
    throw new Error("CATALYST_DATASETS_FOLDER_ID environment variable is missing.");
  }

  const csvContent = file.buffer.toString("utf8");
  const parsed = parseCSVText(csvContent);
  const recordCount = parsed.length > 0 ? parsed.length - 1 : 0; 
  let uploaderName = metadata.uploaded_by || "Admin";

  let fileId = null;
  const app = catalyst.initialize(req);
  const folder = app.filestore().folder(folderId);

  // 1. Upload to Catalyst File Store
  try {
    const fileStream = stream.Readable.from(file.buffer);
    const uploadResult = await folder.uploadFile({
      code: fileStream,
      name: file.originalname
    });
    
    fileId = uploadResult.id || (uploadResult.content && uploadResult.content.id);
    if (!fileId) {
      throw new Error("Catalyst File Store upload succeeded but did not return a valid file ID.");
    }
  } catch (err) {
    throw new Error(`Catalyst File Store upload failed: ${err.message}`);
  }

  // Determine next version number for this dataset type
  const existing = await listDatasets(req);
  const typeMatches = existing.filter(d => d.dataset_type === metadata.dataset_type);
  const maxVersion = typeMatches.reduce((max, d) => Math.max(max, Number(d.version || 0)), 0);
  const nextVersion = maxVersion + 1;

  const doc = {
    filename: file.originalname,
    file_id: String(fileId),
    uploaded_by: uploaderName,
    upload_date: new Date().toISOString(),
    year: String(metadata.year || new Date().getFullYear()),
    records: Number(recordCount),
    status: "active",
    version: Number(nextVersion),
    dataset_type: metadata.dataset_type
  };

  // 2. Write metadata to Catalyst Data Store
  const table = app.datastore().table("Datasets");
  try {
    // Mark previous active versions as inactive if needed
    for (const item of typeMatches) {
      if (item.status === "active") {
        try {
          await table.updateRow({ ROWID: item.ROWID, status: "inactive" });
        } catch (updErr) {
          console.warn("[Dataset Service] Failed to deactivate old dataset version:", updErr.message);
        }
      }
    }

    const inserted = await table.insertRow(doc);
    return inserted;
  } catch (err) {
    // Rollback: delete the uploaded file if metadata insertion fails
    try {
      await folder.deleteFile(Number(fileId));
    } catch (delErr) {
      console.warn(`[Dataset Service] Failed to rollback orphaned File Store object ${fileId}:`, delErr.message);
    }
    throw new Error(`Failed to insert dataset metadata into Data Store: ${err.message}`);
  }
}

async function replaceDataset(req, id, file, metadata) {
  if (!file) {
    throw new Error("Replacement CSV File is required.");
  }
  const folderId = process.env.CATALYST_DATASETS_FOLDER_ID;
  if (!folderId) {
    throw new Error("CATALYST_DATASETS_FOLDER_ID environment variable is missing.");
  }
  
  const app = catalyst.initialize(req);
  const folder = app.filestore().folder(folderId);
  const table = app.datastore().table("Datasets");

  // 1. Fetch current dataset details to get existing file_id
  const current = await getDatasetById(req, id);
  const currentMetadata = current.metadata;
  const oldFileId = currentMetadata.file_id;

  // 2. Upload new file to Catalyst File Store
  const csvContent = file.buffer.toString("utf8");
  const parsed = parseCSVText(csvContent);
  const recordCount = parsed.length > 0 ? parsed.length - 1 : 0;

  let newFileId = null;
  try {
    const fileStream = stream.Readable.from(file.buffer);
    const uploadResult = await folder.uploadFile({
      code: fileStream,
      name: file.originalname
    });
    newFileId = uploadResult.id || (uploadResult.content && uploadResult.content.id);
    if (!newFileId) {
      throw new Error("Did not return a valid file ID.");
    }
  } catch (err) {
    throw new Error(`Catalyst File Store replacement upload failed: ${err.message}`);
  }

  const updatedDoc = {
    filename: file.originalname,
    file_id: String(newFileId),
    uploaded_by: metadata.uploaded_by || currentMetadata.uploaded_by,
    upload_date: new Date().toISOString(),
    year: String(metadata.year || currentMetadata.year),
    records: Number(recordCount),
    status: "active",
    version: Number(currentMetadata.version) + 1,
    dataset_type: currentMetadata.dataset_type
  };

  // 3. Update Data Store row
  try {
    const updated = await table.updateRow({
      ROWID: id,
      ...updatedDoc
    });

    // 4. Cleanup old file from File Store
    if (oldFileId) {
      try {
        await folder.deleteFile(Number(oldFileId));
      } catch (delErr) {
        console.warn(`[Dataset Service] Old File Store object deletion failed:`, delErr.message);
      }
    }

    return updated;
  } catch (err) {
    // Rollback new file if DB update fails
    try {
      await folder.deleteFile(Number(newFileId));
    } catch (delErr) {
      console.warn(`[Dataset Service] Failed to rollback orphaned File Store object ${newFileId}:`, delErr.message);
    }
    throw new Error(`Failed to update dataset metadata in Data Store: ${err.message}`);
  }
}

async function deleteDataset(req, id) {
  const app = catalyst.initialize(req);
  const folderId = process.env.CATALYST_DATASETS_FOLDER_ID;
  
  // 1. Fetch dataset details to get file_id
  let currentMetadata = null;
  try {
    const current = await getDatasetById(req, id);
    currentMetadata = current.metadata;
  } catch (err) {
    throw new Error(`Cannot delete: ${err.message}`);
  }

  const fileId = currentMetadata.file_id;

  // 2. Delete file from File Store
  if (fileId && folderId) {
    try {
      const folder = app.filestore().folder(folderId);
      await folder.deleteFile(Number(fileId));
    } catch (delErr) {
      console.warn(`[Dataset Service] File Store deletion failed for ID ${fileId}:`, delErr.message);
    }
  }

  // 3. Delete metadata from Data Store
  try {
    const table = app.datastore().table("Datasets");
    await table.deleteRow(id);
    return true;
  } catch (err) {
    throw new Error(`Failed to delete metadata from Data Store: ${err.message}`);
  }
}

async function rebuildAnalytics(req) {
  const newKpis = await dataLayer.recompile(req);
  return newKpis;
}

module.exports = {
  listDatasets,
  getDatasetById,
  uploadDataset,
  replaceDataset,
  deleteDataset,
  rebuildAnalytics
};
