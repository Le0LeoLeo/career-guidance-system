// netlify/functions/auth-verify.js
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

exports.handler = async (event) => {
  console.log("--- auth-verify execution ---");
  console.log("SUPABASE_URL exists:", !!process.env.SUPABASE_URL);
  console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("All available env keys:", Object.keys(process.env));

  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Missing server env" });
    }

    const auth = event.headers.authorization || event.headers.Authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return json(401, { error: "Missing token" });

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!userRes.ok) return json(401, { error: "Invalid token" });
    const user = await userRes.json();
    const email = (user?.email || "").toLowerCase();
    const userId = user?.id;
    if (!email || !userId) return json(401, { error: "Invalid user" });

    if (email === BLOCKED_EMAIL) return json(403, { error: "blocked" });
    const domain = email.split("@")[1] || "";
    if (domain !== ALLOWED_DOMAIN) return json(403, { error: "domain" });

    const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!adminRes.ok) return json(500, { error: "admin fetch failed" });
    const adminUser = await adminRes.json();
    const providers = (adminUser?.identities || []).map((i) => (i?.provider || "").toLowerCase());
    if (providers.length && !providers.includes("google")) return json(403, { error: "google only" });

    return json(200, { ok: true, user: { id: userId, email } });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};

