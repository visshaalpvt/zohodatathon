require('dotenv').config();
const catalyst = require('zcatalyst-sdk-node');
const filestoreService = require('./services/filestore.service');

async function test() {
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

  const credential = catalyst.credential.accessToken(tokenData.access_token);
  const app = catalyst.initializeApp({
    project_id: "50276000000016025",
    project_key: "50043296508", // domain ID
    environment: "Development",
    credential
  });
  
  // Override catalyst.initialize to return our initialized app
  catalyst.initialize = () => app;

  console.log("Testing File Store download...");
  try {
    const datasets = await filestoreService.downloadAndNormalizeDatasets({});
    console.log("SUCCESS! Downloaded datasets:");
    for (const [key, data] of Object.entries(datasets)) {
      console.log(`- ${key}: ${data.length} characters`);
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}

test();
