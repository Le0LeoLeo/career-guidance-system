// netlify/functions/firebase-universities-search.js
// Server-side Firebase Admin read (no frontend admin).
// POST JSON: { q: string }
// Requires env:
//  - FIREBASE_PROJECT_ID
//  - FIREBASE_SERVICE_ACCOUNT_B64 (base64 of service account JSON)
// Reads from Firestore collection path env FIREBASE_UNI_COLLECTION (default: "universities")

const ALLOWED_DOMAIN = "fct.edu.mo";
const BLOCKED_EMAIL = "iopiopiopiopiopiop9990@gmail.com";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

async function verifyAndGetUser(event) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase env");

  const auth = event.headers.authorization || event.headers.Authorization || "";
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
function getFirebaseAdmin() {
  if (_admin) return _admin;
  // eslint-disable-next-line global-require
  const admin = require("firebase-admin");

  if (admin.apps && admin.apps.length) {
    _admin = admin;
    return _admin;
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!b64 || !projectId) throw new Error("Missing Firebase env: FIREBASE_SERVICE_ACCOUNT_B64 / FIREBASE_PROJECT_ID");

  const svc = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(svc),
    projectId,
  });

  _admin = admin;
  return _admin;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const ver = await verifyAndGetUser(event);
    if (!ver.ok) return json(ver.status, { error: ver.error });

    let body;
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: "Invalid JSON" }); }

    const q = (body?.q || "").toString().trim().toLowerCase();
    if (!q) return json(200, { ok: true, rows: [] });

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const col = process.env.FIREBASE_UNI_COLLECTION || "universities";

    // Minimal viable search: fetch limited docs and filter client-side by name fields.
    // (Firestore doesn't support contains without dedicated indexes)
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

    return json(200, { ok: true, rows: rows.slice(0, 20) });
  } catch (e) {
    return json(500, { error: "Server error", details: String(e?.message || e) });
  }
};

