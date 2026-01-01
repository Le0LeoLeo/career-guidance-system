// functions/grades-list.js

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

async function listGrades(userId, env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  const url = `${SUPABASE_URL}/rest/v1/user_grades?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=50`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`list failed: ${text}`);
  return JSON.parse(text);
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

    const rows = await listGrades(ver.user.id, env);
    return jsonResponse(200, { ok: true, rows });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}

