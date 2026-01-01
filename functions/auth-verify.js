// functions/auth-verify.js

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

export async function onRequest(context) {
  try {
    // Handle CORS preflight requests
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

    const { env } = context;
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(500, { error: "Missing server env" });
    }

    const auth = context.request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return jsonResponse(401, { error: "Missing token" });
    }

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!userRes.ok) {
      return jsonResponse(401, { error: "Invalid token" });
    }

    const user = await userRes.json();
    const email = (user?.email || "").toLowerCase();
    const userId = user?.id;
    if (!email || !userId) {
      return jsonResponse(401, { error: "Invalid user" });
    }

    if (email === BLOCKED_EMAIL) {
      return jsonResponse(403, { error: "blocked" });
    }
    const domain = email.split("@")[1] || "";
    if (domain !== ALLOWED_DOMAIN) {
      return jsonResponse(403, { error: "domain" });
    }

    const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!adminRes.ok) {
      return jsonResponse(500, { error: "admin fetch failed" });
    }
    const adminUser = await adminRes.json();
    const providers = (adminUser?.identities || []).map((i) => (i?.provider || "").toLowerCase());
    if (providers.length && !providers.includes("google")) {
      return jsonResponse(403, { error: "google only" });
    }

    // Prefer Google profile name from Admin API identities (more reliable than user_metadata)
    const identities = Array.isArray(adminUser?.identities) ? adminUser.identities : [];
    const googleIdentity = identities.find((i) => (i?.provider || "").toLowerCase() === "google") || identities[0];
    const identityData = googleIdentity?.identity_data || {};

    const fullName =
      identityData?.full_name ||
      identityData?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "";

    return jsonResponse(200, { ok: true, user: { id: userId, email, full_name: fullName } });
  } catch (e) {
    return jsonResponse(500, { error: e.message || String(e) });
  }
}




