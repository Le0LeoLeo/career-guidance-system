// netlify/functions/target-analysis.js
// Combine user grades + assessment weights + selected university data, then ask AI for final guidance.
// POST JSON: { university: { id, name, data }, notes?: string }

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

async function getAssessmentState(userId) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessment_state?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`assessment_state fetch failed: ${text}`);
  const rows = JSON.parse(text);
  return rows?.[0] || null;
}

async function getLatestGrades(userId) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = `${SUPABASE_URL}/rest/v1/user_grades?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=20`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`user_grades fetch failed: ${text}`);
  return JSON.parse(text);
}

async function callFinalModel(payload) {
  const endpoint = process.env.WENXIN_45T_ENDPOINT || process.env.WENXIN_FLASH_ENDPOINT || "https://qianfan.baidubce.com/v2/chat/completions";
  const apiKey = process.env.WENXIN_FLASH_API_KEY;
  const model = process.env.WENXIN_45T_MODEL || "ernie-4.5-t";
  if (!apiKey) throw new Error("Missing env: WENXIN_FLASH_API_KEY");

  const messages = [
    {
      role: "user",
      content:
`你是「校園升學與職涯助手」，請根據輸入資料，輸出清晰可執行的分析。
要求：
- 輸出必須是 JSON（不要多餘文字/markdown）
- JSON 格式：
{
  "score_gap_analysis": "...",
  "improvement_plan": ["..."],
  "alternative_paths": ["..."],
  "fit_summary": "..."
}

輸入資料：
${JSON.stringify(payload)}`
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
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`final model error: ${text}`);

  let data;
  try { data = JSON.parse(text); } catch { throw new Error("final model returned non-JSON envelope"); }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("final model empty content");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("final model content not JSON");
  }
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const ver = await verifyAndGetUser(event);
    if (!ver.ok) return json(ver.status, { error: ver.error });

    let body;
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: "Invalid JSON" }); }

    const university = body?.university;
    if (!university || typeof university !== "object") return json(400, { error: "university required" });

    const assessment = await getAssessmentState(ver.user.id);
    const grades = await getLatestGrades(ver.user.id);

    const payload = {
      user: { id: ver.user.id, email: ver.user.email },
      assessment_state: assessment ? {
        current_stage: assessment.current_stage,
        confidence_score: assessment.confidence_score,
        mbti_weights: assessment.mbti_weights,
        holland_weights: assessment.holland_weights,
      } : null,
      grades: grades.map((g) => ({
        id: g.id,
        source_type: g.source_type,
        extracted_items: g.extracted_items,
        confirmed_items: g.confirmed_items,
        created_at: g.created_at,
      })),
      target_university: university,
      notes: typeof body?.notes === "string" ? body.notes.slice(0, 2000) : "",
    };

    const analysis = await callFinalModel(payload);
    return json(200, { ok: true, analysis });
  } catch (e) {
    return json(500, { error: "Server error", details: String(e?.message || e) });
  }
};

