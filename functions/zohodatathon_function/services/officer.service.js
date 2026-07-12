const catalyst = require("zcatalyst-sdk-node");

async function getAllOfficers(req) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Officers");
    const rows = await table.getAllRows();
    return rows;
  } catch (err) {
    throw new Error(`Failed to fetch Officers from Data Store: ${err.message}`);
  }
}

async function getOfficerById(req, id) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Officers");
    const row = await table.getRow(id);
    return row;
  } catch (err) {
    throw new Error(`Failed to fetch Officer with ID ${id}: ${err.message}`);
  }
}

async function createOfficer(req, data) {
  if (!data.name || !data.role) {
    throw new Error("Missing required fields: name, role");
  }
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Officers");
    const newRow = await table.insertRow({
      name: data.name,
      role: data.role,
      status: data.status || "Active",
      district: data.district || "State HQ"
    });
    return newRow;
  } catch (err) {
    throw new Error(`Failed to create Officer: ${err.message}`);
  }
}

async function updateOfficer(req, id, data) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Officers");
    const updatedRow = await table.updateRow({
      ROWID: id,
      ...data
    });
    return updatedRow;
  } catch (err) {
    throw new Error(`Failed to update Officer with ID ${id}: ${err.message}`);
  }
}

async function deleteOfficer(req, id) {
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Officers");
    await table.deleteRow(id);
    return true;
  } catch (err) {
    throw new Error(`Failed to delete Officer with ID ${id}: ${err.message}`);
  }
}

module.exports = {
  getAllOfficers,
  getOfficerById,
  createOfficer,
  updateOfficer,
  deleteOfficer
};
