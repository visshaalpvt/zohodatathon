import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CrimeDataProvider } from './context/CrimeDataContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

// Global Fetch Interceptor to ensure Catalyst Session Cookies are always sent and trace every API call
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/server/zohodatathon_function')) {
    const BACKEND_URL = 'https://zohodatathon-60074947232.development.catalystserverless.in';
    resource = BACKEND_URL + resource;
    
    config = config || {};
    config.headers = config.headers || {};
    
    // Generate auth token for cross-origin authentication
    try {
      if (window.catalyst && window.catalyst.auth && await window.catalyst.auth.isUserAuthenticated()) {
        const authResponse = await window.catalyst.auth.generateAuthToken();
        if (authResponse && authResponse.access_token) {
          config.headers['Authorization'] = `Zoho-oauthtoken ${authResponse.access_token}`;
        }
      }
    } catch (e) {
      console.warn('[API TRACE] Failed to attach auth token:', e);
    }
    
    console.log(`[API TRACE] Request URL: ${resource}`);
    
    try {
      const response = await originalFetch(resource, config);
      const clonedResponse = response.clone();
      
      const contentType = response.headers.get('content-type') || '';
      console.log(`[API TRACE] Request URL: ${resource} | Status: ${response.status} | Content-Type: ${contentType}`);
      
      if (contentType.includes('text/html')) {
        const text = await clonedResponse.text();
        console.error(`[API TRACE ERROR] Expected JSON but received HTML for ${resource}.`);
        console.error(`[API TRACE ERROR] Response Body (First 500 chars):`, text.substring(0, 500));
      } else if (contentType.includes('application/json')) {
        const json = await clonedResponse.json().catch(() => null);
        console.log(`[API TRACE] Response Body (JSON) for ${resource}:`, json);
      } else {
        const text = await clonedResponse.text();
        console.log(`[API TRACE] Response Body (Other) for ${resource}:`, text.substring(0, 500));
      }
      
      return response;
    } catch (err) {
      console.error(`[API TRACE ERROR] Network request failed for ${resource}`, err);
      throw err;
    }
  }
  return originalFetch(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/app">
      <AuthProvider>
        <CrimeDataProvider>
          <App />
        </CrimeDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
