const catalyst = require("zcatalyst-sdk-node");
const { processQuery } = require("../data/crimeIntelEngine");
const { districtStats } = require("../data/dataLayer");
const { generateRecommendations, generateExplainableAI } = require("../data/recommendationEngine");

const ANALYTICS_KEYWORDS = /count|stats?|total|trend|forecast|hotspot|compare|rank|highest|lowest|percent|growth|charts?|top/i;
const LEGAL_KEYWORDS = /law|legal|court|act\b|ipc|bns|bnss|crpc|procedure|arrest|warrant|bail|section|bailable|complaint|police manual|chapter/i;
const PROCEDURE_KEYWORDS = /procedure|process|arrest|bail|warrant|complaint|manual|fir|charge\s*sheet|investigation/i;

function classifyEnterpriseIntent(queryText) {
  const q = queryText.toLowerCase().trim();
  const isAnalytics = ANALYTICS_KEYWORDS.test(q);
  const isLegal = LEGAL_KEYWORDS.test(q) || PROCEDURE_KEYWORDS.test(q);

  if (isAnalytics && isLegal) {
    return "MIXED";
  }
  if (isLegal) {
    if (PROCEDURE_KEYWORDS.test(q)) {
      return "PROCEDURE";
    }
    return "LEGAL";
  }

  // Otherwise, use base parser
  const baseResult = processQuery(queryText);
  if (!baseResult || baseResult.title === "Query could not be parsed") {
    return "GENERAL";
  }

  const baseIntent = baseResult.intent;
  if (baseIntent === "FORECAST") return "FORECAST";
  if (baseIntent === "HOTSPOT") return "HOTSPOTS";
  if (baseIntent === "DISTRICT_PROFILE") return "DISTRICT_ANALYSIS";
  if (baseIntent === "RECOMMENDATION") return "RECOMMENDATION";
  
  return "CRIME_ANALYTICS";
}

async function getQuickMLAccessToken() {
  const clientId = process.env.QUICKML_CLIENT_ID;
  const clientSecret = process.env.QUICKML_CLIENT_SECRET;
  const refreshToken = process.env.QUICKML_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push("QUICKML_CLIENT_ID");
    if (!clientSecret) missing.push("QUICKML_CLIENT_SECRET");
    if (!refreshToken) missing.push("QUICKML_REFRESH_TOKEN");
    const errorMsg = `QuickML OAuth credentials are not fully configured. Missing env variables: ${missing.join(", ")}`;
    console.error(`[OAuth Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const tokenUrl = "https://accounts.zoho.in/oauth/v2/token";
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token"
  });

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let maskedError = errorBody;
      if (clientId) maskedError = maskedError.split(clientId).join("<CLIENT_ID>");
      if (clientSecret) maskedError = maskedError.split(clientSecret).join("<CLIENT_SECRET>");
      if (refreshToken) maskedError = maskedError.split(refreshToken).join("<REFRESH_TOKEN>");
      
      const errorMsg = `Zoho OAuth token refresh failed with status ${res.status} ${res.statusText}. details: ${maskedError}`;
      console.error(`[OAuth Error] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (!data.access_token) {
      const errorMsg = `Zoho OAuth response did not contain access_token.`;
      console.error(`[OAuth Error] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    return data.access_token;
  } catch (err) {
    if (!err.message.includes("[OAuth Error]")) {
      console.error(`[OAuth Error] Exception during token refresh: ${err.message}`);
    }
    throw err;
  }
}

async function queryQuickMLRAG(queryText, intent = "UNKNOWN", documentIds = null) {
  const endpoint = process.env.QUICKML_ENDPOINT_URL || "https://api.catalyst.zoho.in/quickml/v1/project/50276000000016025/rag/answer";
  const orgHeader = "60074947232";

  const token = await getQuickMLAccessToken();

  const headers = {
    "Authorization": `Zoho-oauthtoken ${token}`,
    "CATALYST-ORG": orgHeader,
    "Content-Type": "application/json"
  };

  const body = { query: queryText };
  if (documentIds && Array.isArray(documentIds)) {
    body.documents = documentIds;
  }

  const startTime = Date.now();
  
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });

    const latency = Date.now() - startTime;
    
    if (!res.ok) {
      const errorBody = await res.text();
      const errorMsg = `QuickML RAG query failed with status ${res.status} ${res.statusText}. details: ${errorBody}`;
      console.error(`[Copilot Router Log] Intent: ${intent} | QuickML: YES | Analytics: NO | Status: FAILED | Latency: ${latency}ms | Reason: ${res.status} ${res.statusText}`);
      const err = new Error(errorMsg);
      err.isQuickMLError = true; // Flag for upstream handling
      throw err;
    }

    const data = await res.json();
    const responseLength = JSON.stringify(data).length;
    console.log(`[Copilot Router Log] Intent: ${intent} | QuickML: YES | Analytics: ${intent === 'MIXED' ? 'YES' : 'NO'} | Status: SUCCESS | Latency: ${latency}ms | Response Length: ${responseLength} bytes`);
    
    return data;
  } catch (err) {
    if (!err.isQuickMLError) {
      const latency = Date.now() - startTime;
      console.error(`[Copilot Router Log] Intent: ${intent} | QuickML: YES | Analytics: NO | Status: FAILED | Latency: ${latency}ms | Reason: Network/Parse Error - ${err.message}`);
      err.isQuickMLError = true;
    }
    throw err;
  }
}

// NOTE: No offline fallback. All legal queries MUST go through the real QuickML RAG service.
// If QuickML fails, the error propagates to the API handler which returns a proper HTTP error
// response. This ensures no hardcoded or mock data is ever served to the user.

async function askCopilot(req, queryText) {
  if (!queryText || !queryText.trim()) {
    throw new Error("Query text is required");
  }

  const intent = classifyEnterpriseIntent(queryText);
  console.log(`[Copilot] Intent: ${intent}`);

  let finalResult = {
    intent,
    entities: { districts: [], crimeFields: [], year: null },
    answer: "",
    confidence: 85,
    sources: [],
    retrievedDocuments: [],
    recommendations: [],
    relatedDistricts: [],
    suggestedFollowUpQuestions: []
  };

  let analyticsResult = null;
  let legalResult = null;

  if (intent === "MIXED") {
    // Run both in parallel
    const analyticsPromise = (async () => {
      try {
        const res = processQuery(queryText);
        if (res && res.title !== "Query could not be parsed") {
          const districts = res.extractedEntities?.districts || [];
          const d = districts.length > 0 ? districtStats.find(ds => ds.csvName === districts[0]) : districtStats[0];
          
          const recs = d ? generateRecommendations(d) : [];
          const xai = generateExplainableAI(res.intent, res.sources || [], districts, res.extractedEntities?.crimeFields || []);

          res.recommendations = recs;
          res.explainableAI = xai;
          return res;
        }
      } catch (err) {
        console.error("Parallel analytics query failed:", err);
      }
      return null;
    })();

    const legalPromise = (async () => {
      try {
        const ragResponse = await queryQuickMLRAG(queryText, intent);
        const retrievedNodes = ragResponse.retrieved_nodes || [];
        const retrievedDocuments = [...new Set(retrievedNodes.map(n => 
          n.node?.metadata?.file_name || 
          n.node?.metadata?.fileName || 
          n.node?.metadata?.name || 
          n.node?.metadata?.document_name
        ).filter(Boolean))];

        const sources = retrievedNodes.map(n => {
          const file = n.node?.metadata?.file_name || n.node?.metadata?.fileName || n.node?.metadata?.name || "QuickML RAG Document";
          const page = n.node?.metadata?.page_label || n.node?.metadata?.pageNumber || n.node?.metadata?.page || "";
          return page ? `${file} (Page ${page})` : file;
        }).filter(Boolean);

        return {
          answer: ragResponse.response || "",
          sources: sources.length > 0 ? sources : ["QuickML RAG Engine"],
          retrievedDocuments: retrievedDocuments,
          confidence: 85,
          recommendations: []
        };
      } catch (err) {
        console.error("[Copilot] QuickML RAG call failed in MIXED intent parallel branch:", err.message);
        err.isQuickMLError = true;
        throw err;
      }
    })();

    const [aRes, lRes] = await Promise.all([analyticsPromise, legalPromise]);
    analyticsResult = aRes;
    legalResult = lRes;

  } else if (["LEGAL", "PROCEDURE"].includes(intent)) {
    // QuickML only
    try {
      const ragResponse = await queryQuickMLRAG(queryText, intent);
      const retrievedNodes = ragResponse.retrieved_nodes || [];
      const retrievedDocuments = [...new Set(retrievedNodes.map(n => 
        n.node?.metadata?.file_name || 
        n.node?.metadata?.fileName || 
        n.node?.metadata?.name || 
        n.node?.metadata?.document_name
      ).filter(Boolean))];

      const sources = retrievedNodes.map(n => {
        const file = n.node?.metadata?.file_name || n.node?.metadata?.fileName || n.node?.metadata?.name || "QuickML RAG Document";
        const page = n.node?.metadata?.page_label || n.node?.metadata?.pageNumber || n.node?.metadata?.page || "";
        return page ? `${file} (Page ${page})` : file;
      }).filter(Boolean);

      legalResult = {
        answer: ragResponse.response || "",
        sources: sources.length > 0 ? sources : ["QuickML RAG Engine"],
        retrievedDocuments: retrievedDocuments,
        confidence: 85,
        recommendations: []
      };
    } catch (err) {
      console.error("[Copilot] QuickML RAG call failed for LEGAL/PROCEDURE intent:", err.message);
      err.isQuickMLError = true;
      throw err;
    }

  } else if (["CRIME_ANALYTICS", "DISTRICT_ANALYSIS", "FORECAST", "RECOMMENDATION", "HOTSPOTS"].includes(intent)) {
    // Analytics only (processQuery)
    const res = processQuery(queryText);
    if (res && res.title !== "Query could not be parsed") {
      analyticsResult = res;
      const districts = res.extractedEntities?.districts || [];
      const d = districts.length > 0 ? districtStats.find(ds => ds.csvName === districts[0]) : districtStats[0];
      
      const recs = d ? generateRecommendations(d) : [];
      const xai = generateExplainableAI(res.intent, res.sources || [], districts, res.extractedEntities?.crimeFields || []);

      analyticsResult.recommendations = recs;
      analyticsResult.explainableAI = xai;
    }

  } else {
    // GENERAL intent fallback
    const res = processQuery(queryText);
    if (res && res.title !== "Query could not be parsed") {
      analyticsResult = res;
      const districts = res.extractedEntities?.districts || [];
      const d = districts.length > 0 ? districtStats.find(ds => ds.csvName === districts[0]) : districtStats[0];
      
      const recs = d ? generateRecommendations(d) : [];
      const xai = generateExplainableAI(res.intent, res.sources || [], districts, res.extractedEntities?.crimeFields || []);

      analyticsResult.recommendations = recs;
      analyticsResult.explainableAI = xai;
    }

    // Removed hidden QuickML RAG fallback to strictly enforce intent routing
  }

  // 3. Merge Responses or Select Primary Answer
  if (intent === "MIXED" && analyticsResult && legalResult) {
    finalResult.answer = `### Statistical Analytics\n${analyticsResult.summary}\n\n### Legal & Procedural Directives\n${legalResult.answer}`;
    finalResult.confidence = Math.round((analyticsResult.confidence + legalResult.confidence) / 2);
    finalResult.sources = [...new Set([...(analyticsResult.sources || []), ...(legalResult.sources || [])])];
    finalResult.retrievedDocuments = legalResult.retrievedDocuments;
    finalResult.recommendations = [...(legalResult.recommendations || []), ...(analyticsResult.recommendations || [])].slice(0, 5);
    finalResult.entities = analyticsResult.extractedEntities || { districts: [], crimeFields: [], year: null };
  } else if (legalResult) {
    finalResult.answer = legalResult.answer;
    finalResult.confidence = legalResult.confidence;
    finalResult.sources = legalResult.sources;
    finalResult.retrievedDocuments = legalResult.retrievedDocuments;
    finalResult.recommendations = legalResult.recommendations;
  } else if (analyticsResult) {
    finalResult.answer = analyticsResult.summary;
    finalResult.confidence = analyticsResult.confidence;
    finalResult.sources = analyticsResult.sources;
    finalResult.recommendations = analyticsResult.recommendations || [];
    finalResult.entities = analyticsResult.extractedEntities || { districts: [], crimeFields: [], year: null };
    finalResult.analytics = {
      comparisonData: analyticsResult.comparisonData || null,
      rankings: analyticsResult.rankings || null,
      rankField: analyticsResult.rankField || null,
      explainableAI: analyticsResult.explainableAI || null
    };
  } else {
    finalResult.answer = "I could not resolve an analytical or legal response for your query. Please rephrase your question.";
    finalResult.confidence = 40;
  }

  // Deduplicate and enrich entities, related districts, follow ups
  const matchedDistricts = finalResult.entities?.districts || [];
  if (matchedDistricts.length > 0) {
    const d = districtStats.find(ds => ds.csvName === matchedDistricts[0]);
    if (d) {
      finalResult.relatedDistricts = districtStats
        .filter(ds => ds.csvName !== d.csvName)
        .slice(0, 3)
        .map(ds => ds.csvName);
    }
  } else {
    finalResult.relatedDistricts = [districtStats[0]?.csvName, districtStats[1]?.csvName].filter(Boolean);
  }

  // Add follow-up questions dynamically based on intent
  if (intent === "FORECAST") {
    finalResult.suggestedFollowUpQuestions = [
      "What methodology is used for these forecast projections?",
      "Which district has the highest crime drop?"
    ];
  } else if (intent === "HOTSPOTS") {
    finalResult.suggestedFollowUpQuestions = [
      "How are hotspot scores calculated?",
      "What patrols are advised for Bengaluru City?"
    ];
  } else if (["LEGAL", "PROCEDURE"].includes(intent)) {
    finalResult.suggestedFollowUpQuestions = [
      "Explain the arrest procedures under BNSS Section 35.",
      "What are the bailable guidelines under the new code?"
    ];
  } else {
    finalResult.suggestedFollowUpQuestions = [
      "Compare Bengaluru City and Mysuru City crime profiles.",
      "What is the projected trend for cybercrime?"
    ];
  }

  // 4. Log conversation to Catalyst Data Store
  try {
    const app = catalyst.initialize(req);
    const table = app.datastore().table("Copilot_History");
    await table.insertRow({
      query: queryText,
      intent: finalResult.intent || intent,
      answer_summary: finalResult.answer.substring(0, 500),
      confidence: finalResult.confidence,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("[Copilot Service] Failed to log chat history to Data Store:", err.message);
    // Non-blocking: We don't want to crash the copilot response just because logging failed.
  }

  return finalResult;
}

module.exports = {
  askCopilot
};
