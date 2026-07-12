// List files in the Catalyst File Store folder via direct REST API
require('dotenv').config();

async function main() {
  // 1. Get access token
  const tokenUrl = "https://accounts.zoho.in/oauth/v2/token";
  const params = new URLSearchParams({
    refresh_token: process.env.QUICKML_REFRESH_TOKEN,
    client_id: process.env.QUICKML_CLIENT_ID,
    client_secret: process.env.QUICKML_CLIENT_SECRET,
    grant_type: "refresh_token"
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Read .catalystrc for project/env details
  const catalystrc = JSON.parse(require('fs').readFileSync('c:/Users/LENOVO/Downloads/zohodatathon/.catalystrc', 'utf8'));
  const project = catalystrc.projects[0];
  const projectId = project.id;
  const envId = project.env[0].id;
  const domainKey = project.domain.id;
  const domainName = project.domain.name;
  
  console.log("Project:", project.name, "| ID:", projectId);
  console.log("Domain:", domainName, "| Key:", domainKey);
  console.log("Environment:", envId);
  
  const folderId = process.env.CATALYST_DATASETS_FOLDER_ID;
  console.log("Folder ID:", folderId);

  // 3. List all folders first
  const catalyst = require('zcatalyst-sdk-node');
  const credential = catalyst.credential.accessToken(accessToken);
  const app = catalyst.initializeApp({
    project_id: projectId,
    project_key: domainKey,
    environment: "Development",
    credential
  });

  console.log("\n--- Listing all folders ---");
  const filestore = app.filestore();
  const allFolders = await filestore.getAllFolders();
  console.log("Folders:", allFolders.map(f => ({ name: f._folderDetails?.folder_name || f.toJSON()?.folder_name, id: f._folderDetails?.id || f.toJSON()?.id })));

  // 4. Try listing files in folder via REST API  
  const baseUrl = `https://${domainName}/baas/v1/project/${projectId}/folder/${folderId}/file`;
  console.log("\n--- Listing files via REST API ---");
  console.log("URL:", baseUrl);
  
  const filesRes = await fetch(baseUrl, {
    headers: { 
      "Authorization": `Zoho-oauthtoken ${accessToken}`,
      "ENVIRONMENT": envId
    }
  });
  
  console.log("Status:", filesRes.status);
  const filesBody = await filesRes.text();
  console.log("Response:", filesBody.substring(0, 2000));
}

main().catch(console.error);
