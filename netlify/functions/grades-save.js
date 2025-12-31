// netlify/functions/grades-save.js
// Save OCR result + extracted items into public.user_grades
// POST JSON: { storage_bucket, storage_path, ocr_text, extracted_items, source_type, note }

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

function safeArray(a) {
  return Array.isArray(a) ? a : [];
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

async function insertGrade(row) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_grades`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`insert failed: ${text}`);
  const rows = JSON.parse(text);
  return rows?.[0] || null;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const ver = await verifyAndGetUser(event);
    if (!ver.ok) return json(ver.status, { error: ver.error });

    let body;
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: "Invalid JSON" }); }

    const storage_bucket = typeof body.storage_bucket === "string" && body.storage_bucket ? body.storage_bucket : "uploads";
    const storage_path = body.storage_path;
    if (!storage_path || typeof storage_path !== "string") return json(400, { error: "storage_path required" });

    const ocr_text = typeof body.ocr_text === "string" ? body.ocr_text : "";
    const extracted_items = safeArray(body.extracted_items);
    const source_type = typeof body.source_type === "string" && body.source_type ? body.source_type : "unknown";
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

    const saved = await insertGrade({
      user_id: ver.user.id,
      storage_bucket,
      storage_path,
      ocr_text,
      extracted_items,
      confirmed_items: [],
      source_type,
      note,
    });

    return json(200, { ok: true, row: saved });
  } catch (e) {
    return json(500, { error: "Server error", details: String(e?.message || e) });
  }
};

