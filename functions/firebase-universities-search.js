// functions/firebase-universities-search.js

const ALLOWED_DOMAIN = "fct.edu.mo";
const BLOCKED_EMAIL = "iopiopiopiopiopiop9990@gmail.com";

// Helper to create a JSON response with CORS headers
function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

async function verifyAndGetUser(request, env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase env");

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: "Missing token" };

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return { ok: false, status: 401, error: "Invalid token" };

  const user = await userRes.json();
  const email = (user?.email || "").toLowerCase();
  const userId = user?.id;
  if (!email || !userId) return { ok: false, status: 401, error: "Invalid user" };

  if (email === BLOCKED_EMAIL) return { ok: false, status: 403, error: "blocked" };
  const domain = email.split("@")[1] || "";
  if (domain !== ALLOWED_DOMAIN) return { ok: false, status: 403, error: "domain" };

  return { ok: true, user: { id: userId, email } };
}

// Firebase REST API implementation using OAuth2
// Note: This requires JWT signing which is complex in Cloudflare Workers
// For now, we'll use a workaround or migrate to Supabase

async function queryFirestoreViaREST(env, collectionName, searchQuery) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const b64 = env.FIREBASE_SERVICE_ACCOUNT_B64;
  
  if (!projectId || !b64) {
    throw new Error("Missing Firebase configuration");
  }

  // Decode service account
  const svcJson = atob(b64);
  const svc = JSON.parse(svcJson);

  // Get OAuth2 access token using service account
  // This is a simplified version - in production, you'd need proper JWT signing
  const accessToken = await getOAuth2Token(svc);
  
  // Query Firestore using REST API
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;
  
  const response = await fetch(firestoreUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Firestore API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const rows = [];
  const q = searchQuery.toLowerCase();

  // Process documents
  if (data.documents) {
    for (const doc of data.documents) {
      const docData = {};
      if (doc.fields) {
        for (const [key, value] of Object.entries(doc.fields)) {
          // Extract value from Firestore format
          if (value.stringValue !== undefined) docData[key] = value.stringValue;
          else if (value.integerValue !== undefined) docData[key] = parseInt(value.integerValue);
          else if (value.doubleValue !== undefined) docData[key] = parseFloat(value.doubleValue);
          else if (value.booleanValue !== undefined) docData[key] = value.booleanValue === "true";
          else if (value.mapValue?.fields) {
            docData[key] = {};
            for (const [k, v] of Object.entries(value.mapValue.fields)) {
              if (v.stringValue !== undefined) docData[key][k] = v.stringValue;
            }
          }
        }
      }

      const name = String(docData.name || docData.schoolName || docData.title || "");
      if (name.toLowerCase().includes(q)) {
        rows.push({
          id: doc.name.split("/").pop(), // Extract document ID from path
          name,
          data: docData,
        });
      }
    }
  }

  return rows;
}

async function getOAuth2Token(serviceAccount) {
  // Create JWT for OAuth2
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Sign JWT (simplified - in production use a proper JWT library)
  // For Cloudflare Workers, we need to use Web Crypto API
  const jwt = await signJWT(header, payload, serviceAccount.private_key);
  
  // Request token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth2 token request failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function signJWT(header, payload, privateKey) {
  // Use Web Crypto API to sign JWT
  // This is a simplified implementation
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${headerB64}.${payloadB64}`;
  
  // Import private key
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(unsigned)
    );
    
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    
    return `${unsigned}.${sigB64}`;
  } catch (error) {
    throw new Error(`JWT signing failed: ${error.message}`);
  }
}

export async function onRequest(context) {
  try {
    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, content-type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }
    if (context.request.method !== "POST") {
      return jsonResponse(405, { error: "Method Not Allowed" });
    }

    const { request, env } = context;

    const ver = await verifyAndGetUser(request, env);
    if (!ver.ok) return jsonResponse(ver.status, { error: ver.error });

    let body;
    try { body = await request.json(); } catch { return jsonResponse(400, { error: "Invalid JSON" }); }

    const q = (body?.q || "").toString().trim().toLowerCase();
    if (!q) return jsonResponse(200, { ok: true, rows: [] });

    const col = env.FIREBASE_UNI_COLLECTION || "universities";
    const rows = await queryFirestoreViaREST(env, col, q);

    return jsonResponse(200, { ok: true, rows: rows.slice(0, 20) });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}

