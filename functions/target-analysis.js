// functions/target-analysis.js

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

async function getAssessmentState(userId, env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessment_state?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`assessment_state fetch failed: ${await res.text()}`);
  const rows = await res.json();
  return rows?.[0] || null;
}

async function getLatestGrades(userId, env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const url = `${SUPABASE_URL}/rest/v1/user_grades?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=20`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`user_grades fetch failed: ${await res.text()}`);
  return await res.json();
}

async function callDeepSeekFinalModel(payload, env) {
  const endpoint = "https://api.deepseek.com/chat/completions";
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("Missing env: DEEPSEEK_API_KEY");
  const model = env.DEEPSEEK_CHAT_MODEL || "deepseek-chat";

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
      "Authorization": `Bearer ${apiKey}`,
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
  if (!res.ok) throw new Error(`DeepSeek API error: ${text}`);

  let data;
  try { data = JSON.parse(text); } catch { throw new Error("DeepSeek API returned non-JSON envelope"); }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("DeepSeek API returned empty content");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("DeepSeek API content is not valid JSON");
  }
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
    try { body = await request.json(); } catch { return jsonResponse(400, { error: "Invalid JSON" }); }

    const university = body?.university;
    if (!university || typeof university !== "object") return jsonResponse(400, { error: "university required" });

    const assessment = await getAssessmentState(ver.user.id, env);
    const grades = await getLatestGrades(ver.user.id, env);

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

    const analysis = await callDeepSeekFinalModel(payload, env);
    return jsonResponse(200, { ok: true, analysis });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}

