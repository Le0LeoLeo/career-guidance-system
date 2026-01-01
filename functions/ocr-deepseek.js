// functions/ocr-deepseek.js

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

async function createSignedUrl(bucket, path, env, expiresIn = 60) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${path.replace(/^\/+/, "")}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    }
  );

  const text = await res.text();
  if (!res.ok) throw new Error(`sign url failed: ${text}`);
  const data = JSON.parse(text);
  if (!data?.signedURL) throw new Error("missing signedURL");
  return `${SUPABASE_URL}${data.signedURL}`;
}

async function deepseekOcr(imageUrl, env) {
  const endpoint = "https://qianfan.baidubce.com/v2/chat/completions";
  const apiKey = env.QIANFAN_API_KEY; // This should be the bce-v3/... key
  if (!apiKey) throw new Error("Missing env: QIANFAN_API_KEY");

  const body = {
    model: "deepseek-ocr",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "請把這張圖片做 OCR，輸出純文字即可。" },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    stream: false,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`qianfan ocr error: ${text}`);
  const data = JSON.parse(text);
  return String(data?.choices?.[0]?.message?.content || "").trim();
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
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" });
    }

    const bucket = body.bucket || "uploads";
    const filePath = body.file_path;
    if (!filePath || typeof filePath !== "string") return jsonResponse(400, { error: "file_path required" });

    const signed = await createSignedUrl(bucket, filePath, env, 60);
    const ocrText = await deepseekOcr(signed, env);

    return jsonResponse(200, { ok: true, bucket, file_path: filePath, signed_url_expires_in: 60, ocr_text: ocrText });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}

