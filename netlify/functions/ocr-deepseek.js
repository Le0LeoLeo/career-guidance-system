// netlify/functions/ocr-deepseek.js
// Upload image to Supabase Storage then call Qianfan DeepSeek-OCR to extract text.
// POST JSON: { file_path: "bucket/path.ext" }  (expects the file already uploaded)
// OR multipart upload is NOT implemented here (Netlify functions multipart is more work).
// This function signs a short-lived URL for the file, calls deepseek-ocr, returns raw text.

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

async function createSignedUrl(bucket, path, expiresIn = 60) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function deepseekOcr(imageUrl) {
  const endpoint = process.env.QIANFAN_ENDPOINT || "https://qianfan.baidubce.com/v2/chat/completions";
  const apiKey = process.env.WENXIN_FLASH_API_KEY; // reuse same bce-v3 key
  if (!apiKey) throw new Error("Missing env: WENXIN_FLASH_API_KEY");

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

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const ver = await verifyAndGetUser(event);
    if (!ver.ok) return json(ver.status, { error: ver.error });

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const bucket = body.bucket || "uploads";
    const filePath = body.file_path;
    if (!filePath || typeof filePath !== "string") return json(400, { error: "file_path required" });

    const signed = await createSignedUrl(bucket, filePath, 60);
    const ocrText = await deepseekOcr(signed);

    return json(200, { ok: true, bucket, file_path: filePath, signed_url_expires_in: 60, ocr_text: ocrText });
  } catch (e) {
    return json(500, { error: "Server error", details: String(e?.message || e) });
  }
};

