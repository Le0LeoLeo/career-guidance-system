// netlify/functions/ocr-parse.js
// Takes OCR plain text (from deepseek-ocr) and normalizes into structured JSON.
// POST JSON: { ocr_text: string }
// Returns: { items: [{ subject, date, score }], raw_text }

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

async function parseWithModel(ocrText) {
  const endpoint = process.env.QIANFAN_ENDPOINT || "https://qianfan.baidubce.com/v2/chat/completions";
  const apiKey = process.env.WENXIN_FLASH_API_KEY;
  const model = process.env.OCR_PARSE_MODEL || "ernie-4.5-flash";
  if (!apiKey) throw new Error("Missing env: WENXIN_FLASH_API_KEY");

  const messages = [
    {
      role: "user",
      content:
`你是一個資料整理助手。請把以下 OCR 純文字整理成結構化 JSON。
需求：
- 不要輸出多餘文字、不要 markdown，只輸出 JSON
- 盡量辨識：科目(subject)、日期(date)、分數(score)
- date 盡量轉成 YYYY-MM-DD（不確定可留空字串）
- score 若沒有就留 null
- items 是陣列

輸出格式：
{"items":[{"subject":"...","date":"YYYY-MM-DD","score":123}, ...]}

OCR 文字如下：
"""
${ocrText}
"""`
    }
  ];

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`parse model error: ${text}`);

  let data;
  try { data = JSON.parse(text); } catch { throw new Error("parse model returned non-JSON envelope"); }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("parse model empty content");

  let parsed;
  try { parsed = JSON.parse(content); } catch { throw new Error("parse model content not JSON"); }

  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const normalized = items.map((x) => ({
    subject: typeof x?.subject === "string" ? x.subject.slice(0, 80) : "",
    date: typeof x?.date === "string" ? x.date.slice(0, 20) : "",
    score: (typeof x?.score === "number" && Number.isFinite(x.score)) ? x.score : null,
  })).filter((x) => x.subject || x.date || x.score !== null);

  return { items: normalized };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const ver = await verifyAndGetUser(event);
    if (!ver.ok) return json(ver.status, { error: ver.error });

    let body;
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: "Invalid JSON" }); }

    const ocrText = body?.ocr_text;
    if (!ocrText || typeof ocrText !== "string") return json(400, { error: "ocr_text required" });

    const result = await parseWithModel(ocrText.slice(0, 20000));
    return json(200, { ok: true, raw_text: ocrText, items: result.items });
  } catch (e) {
    return json(500, { error: "Server error", details: String(e?.message || e) });
  }
};
