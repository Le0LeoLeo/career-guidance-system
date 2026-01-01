// functions/ocr-parse.js

const ALLOWED_DOMAIN = "fct.edu.mo";
const BLOCKED_EMAIL = "iopiopiopiopiop9990@gmail.com";

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

function normStr(x, max = 200) {
  if (typeof x !== "string") return "";
  return x.replace(/\s+/g, " ").trim().slice(0, max);
}

function normDate(x) {
  const s = normStr(x, 20);
  // allow YYYY-MM-DD or MM/DD etc.
  return s;
}

function normTime(x) {
  const s = normStr(x, 10);
  // allow HH:mm / 上午 / 下午 / 上 / 下 ... keep as is.
  return s;
}

async function parseWithModel(ocrText, env) {
  const endpoint = "https://qianfan.baidubce.com/v2/chat/completions";
  const apiKey = env.QIANFAN_API_KEY;
  const model = env.QIANFAN_HELPER_MODEL || "ernie-4.5-turbo-128k";
  if (!apiKey) throw new Error("Missing env: QIANFAN_API_KEY");

  const messages = [
    {
      role: "user",
      content: `你是一個資料整理助手。請把以下 OCR 純文字整理成「測驗/考試/活動時間表」的結構化 JSON。\n\n重要要求：\n- 不要輸出多餘文字、不要 markdown，只輸出 JSON\n- 不要遺漏重要內容：只要看起來是測驗/考試/活動/上課安排/假期/無安排，都可以整理成 items\n- 若年份不確定，可用 MM/DD 或保留原樣\n- 時間若只有「上午/下午/上/下」也可保留\n\n輸出格式（只輸出 JSON）：\n{\n  \"items\": [\n    {\n      \"title\": \"事件名稱/科目\",\n      \"date\": \"YYYY-MM-DD 或 MM/DD 或原文\",\n      \"time\": \"HH:mm 或 上午/下午/上/下 或空字串\",\n      \"location\": \"地點(如有)\",\n      \"note\": \"備註(如有)\",\n      \"raw\": \"對應的原文片段\"\n    }\n  ]\n}\n\nOCR 文字如下：\n\"\"\"\n${ocrText}\n\"\"\"`,
    },
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
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("parse model returned non-JSON envelope");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("parse model empty content");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("parse model content not JSON");
  }

  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const normalized = items
    .map((x) => ({
      title: normStr(x?.title, 120),
      date: normDate(x?.date),
      time: normTime(x?.time),
      location: normStr(x?.location, 120),
      note: normStr(x?.note, 200),
      raw: normStr(x?.raw, 500),
    }))
    .filter((x) => x.title || x.date || x.time || x.location || x.note || x.raw);

  return { items: normalized };
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

    const ocrText = body?.ocr_text;
    if (!ocrText || typeof ocrText !== "string") return jsonResponse(400, { error: "ocr_text required" });

    const result = await parseWithModel(ocrText.slice(0, 20000), env);
    return jsonResponse(200, { ok: true, raw_text: ocrText, items: result.items });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}
