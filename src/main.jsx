import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CrimeDataProvider } from "./context/CrimeDataContext.jsx";

import "./index.css";

// Global fetch interceptor for Zoho Catalyst deployment
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  let url = input;
  if (typeof input === 'string' && input.startsWith('/server/zohodatathon_function')) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      url = 'https://zohodatathon-60074947232.development.catalystserverless.in' + input;
    }
  }
  
  console.log(`[Global Fetch] Request: ${url}`);
  try {
    const response = await originalFetch(url, init);
    const originalJson = response.json.bind(response);
    
    response.json = async function () {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        console.error('[Global Fetch] Expected JSON but received HTML:', {
          url,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          bodyPreview: text.slice(0, 500)
        });
        throw new SyntaxError(`Expected JSON response from ${url} but received HTML (Status ${response.status})`);
      }
      return originalJson();
    };
    
    return response;
  } catch (err) {
    console.error(`[Global Fetch] Network or parsing error for ${url}:`, err);
    throw err;
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/app">
      <AuthProvider>
        <CrimeDataProvider>
          <App />
        </CrimeDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);