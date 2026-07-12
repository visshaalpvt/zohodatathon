const catalyst = require("zcatalyst-sdk-node");

function getTableName(type) {
  switch (type) {
    case "bookmark": return "Bookmarks";
    case "saved_report": return "Saved_Reports";
    case "officer_note": return "Officer_Notes";
    case "preference": return "User_Preferences";
    default: return "Bookmarks"; // Fallback to avoid crashes, though PRD prefers strict types
  }
}

async function getWorkspace(req) {
  try {
    const app = catalyst.initialize(req);
    const tables = ["Bookmarks", "Saved_Reports", "Officer_Notes", "User_Preferences"];
    
    const promises = tables.map(async t => {
      try {
        const rows = await app.datastore().table(t).getAllRows();
        // Tag them so the frontend knows what they are if the type isn't stored in the row
        return rows.map(r => ({ ...r, __sourceTable: t }));
      } catch(e) {
        return []; // If one table is empty or fails, return empty array for that segment
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (err) {
    throw new Error(`Failed to fetch workspace items from Data Store: ${err.message}`);
  }
}

async function saveWorkspaceItem(req, data) {
  if (!data.type || !data.title) {
    throw new Error("Missing required fields: type, title");
  }

  const doc = {
    type: data.type,
    title: data.title,
    content: data.content || "",
    link: data.link || "",
    timestamp: new Date().toISOString()
  };

  const tableName = getTableName(data.type);

  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table(tableName);
    const newRow = await table.insertRow(doc);
    return newRow;
  } catch (err) {
    throw new Error(`Failed to save Workspace item to ${tableName}: ${err.message}`);
  }
}

async function updateWorkspaceItem(req, id, data) {
  try {
    const app = catalyst.initialize(req);
    let targetTable = null;

    if (data.type) {
      targetTable = getTableName(data.type);
    } else {
      // If type isn't provided in the update payload, try all tables until one succeeds
      const tables = ["Bookmarks", "Saved_Reports", "Officer_Notes", "User_Preferences"];
      for (const t of tables) {
        try {
          // Verify existence
          await app.datastore().table(t).getRow(id);
          targetTable = t;
          break;
        } catch(e) {}
      }
    }

    if (!targetTable) {
      throw new Error("Workspace item not found in any valid table.");
    }

    const table = app.datastore().table(targetTable);
    const updatedRow = await table.updateRow({
      ROWID: id,
      ...data
    });
    return updatedRow;
  } catch (err) {
    throw new Error(`Failed to update Workspace item with ID ${id}: ${err.message}`);
  }
}

async function deleteWorkspaceItem(req, id) {
  try {
    const app = catalyst.initialize(req);
    const tables = ["Bookmarks", "Saved_Reports", "Officer_Notes", "User_Preferences"];
    
    let deletedCount = 0;
    for (const t of tables) {
      try {
        await app.datastore().table(t).deleteRow(id);
        deletedCount++;
        break; // If deleted successfully, we can stop searching
      } catch(e) {
        // ignore if not found in this table
      }
    }
    
    if (deletedCount === 0) {
      throw new Error("Workspace item not found in any table");
    }
    return true;
  } catch (err) {
    throw new Error(`Failed to delete Workspace item with ID ${id}: ${err.message}`);
  }
}

module.exports = {
  getWorkspace,
  saveWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem
};
