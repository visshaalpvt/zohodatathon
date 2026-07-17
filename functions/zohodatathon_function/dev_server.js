require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const catalyst = require('zcatalyst-sdk-node');

async function startServer() {
  console.log('[Dev Server] Fetching Zoho OAuth Access Token...');
  const tokenUrl = "https://accounts.zoho.in/oauth/v2/token";
  const params = new URLSearchParams({
    refresh_token: process.env.QUICKML_REFRESH_TOKEN,
    client_id: process.env.QUICKML_CLIENT_ID,
    client_secret: process.env.QUICKML_CLIENT_SECRET,
    grant_type: "refresh_token"
  });

  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      throw new Error("Failed to retrieve access token: " + JSON.stringify(tokenData));
    }

    console.log('[Dev Server] Initializing Catalyst SDK locally...');
    const credential = catalyst.credential.accessToken(tokenData.access_token);
    const app = catalyst.initializeApp({
      project_id: "50276000000016025",
      project_key: "50043296508",
      environment: "Development",
      credential
    });

    // Override catalyst.initialize globally to return the locally initialized app
    catalyst.initialize = () => app;
    console.log('[Dev Server] Catalyst SDK successfully initialized locally.');

    // Now import and start index.js Express app
    const appExpress = require('./index');
    const port = 3000;
    appExpress.listen(port, () => {
      console.log(`[Dev Server] Express app listening at http://localhost:${port}`);
    });

  } catch (err) {
    console.error("[Dev Server] Critical startup failure:", err);
    process.exit(1);
  }
}

startServer();
