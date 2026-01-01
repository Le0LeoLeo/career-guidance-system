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

let _admin = null;
function getFirebaseAdmin(env) {
  if (_admin) return _admin;
  // eslint-disable-next-line global-require
  const admin = require("firebase-admin");

  if (admin.apps && admin.apps.length) {
    _admin = admin;
    return _admin;
  }

  const b64 = env.FIREBASE_SERVICE_ACCOUNT_B64;
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!b64 || !projectId) throw new Error("Missing Firebase env: FIREBASE_SERVICE_ACCOUNT_B64 / FIREBASE_PROJECT_ID");

  // Use atob for Base64 decoding in Cloudflare environment
  const svcJson = atob(b64);
  const svc = JSON.parse(svcJson);

  admin.initializeApp({
    credential: admin.credential.cert(svc),
    projectId,
  });

  _admin = admin;
  return _admin;
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

    const admin = getFirebaseAdmin(env);
    const db = admin.firestore();
    const col = env.FIREBASE_UNI_COLLECTION || "universities";

    const snap = await db.collection(col).limit(200).get();
    const rows = [];
    snap.forEach((doc) => {
      const d = doc.data() || {};
      const name = String(d.name || d.schoolName || d.title || "");
      const nameLower = name.toLowerCase();
      if (nameLower.includes(q)) {
        rows.push({
          id: doc.id,
          name,
          data: d,
        });
      }
    });

    return jsonResponse(200, { ok: true, rows: rows.slice(0, 20) });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}

