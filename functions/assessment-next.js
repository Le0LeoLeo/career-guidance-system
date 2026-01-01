// functions/assessment-next.js

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeObj(o) {
  return o && typeof o === "object" && !Array.isArray(o) ? o : {};
}

function computeMbtiConverged(mbtiWeights, confidence) {
  const w = safeObj(mbtiWeights);
  const dims = [
    { key: "EI", a: "E", b: "I" },
    { key: "SN", a: "S", b: "N" },
    { key: "TF", a: "T", b: "F" },
    { key: "JP", a: "J", b: "P" },
  ];
  const out = {};
  for (const d of dims) {
    const diff = Math.abs((Number(w[d.a]) || 0) - (Number(w[d.b]) || 0));
    out[d.key] = diff >= 3 && confidence >= 0.8;
  }
  return out;
}

function computeHollandConverged(hollandWeights, confidence) {
  const w = safeObj(hollandWeights);
  const keys = ["R", "I", "A", "S", "E", "C"];
  const arr = keys.map((k) => ({ k, v: Number(w[k]) || 0 })).sort((x, y) => y.v - x.v);
  const top1 = arr[0]?.v ?? 0;
  const top2 = arr[1]?.v ?? 0;
  return (top1 - top2) >= 3 && confidence >= 0.8;
}

function decideStage(state) {
  const history = Array.isArray(state.question_history) ? state.question_history : [];
  const qCount = history.length;

  const mbtiConv = computeMbtiConverged(state.mbti_weights, state.confidence_score);
  const hollandConv = computeHollandConverged(state.holland_weights, state.confidence_score);

  const allMbti = Object.values(mbtiConv).every(Boolean);
  const allDone = allMbti && hollandConv;

  if (allDone) return "done";
  if (qCount < 2) return "icebreaker";
  if (qCount < 6) return "behavior";
  return "scenario";
}

function mergeWeights(base, delta) {
  const b = safeObj(base);
  const d = safeObj(delta);
  const out = { ...b };
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = (Number(out[k]) || 0) + v;
    }
  }
  return out;
}

function calcConfidence(state) {
  const history = Array.isArray(state.question_history) ? state.question_history : [];
  const qCount = history.length;

  const wM = safeObj(state.mbti_weights);
  const wH = safeObj(state.holland_weights);

  const mbtiDiffs = [
    Math.abs((Number(wM.E) || 0) - (Number(wM.I) || 0)),
    Math.abs((Number(wM.S) || 0) - (Number(wM.N) || 0)),
    Math.abs((Number(wM.T) || 0) - (Number(wM.F) || 0)),
    Math.abs((Number(wM.J) || 0) - (Number(wM.P) || 0)),
  ];
  const mbtiScore = mbtiDiffs.reduce((a, b) => a + b, 0) / 16;

  const keys = ["R", "I", "A", "S", "E", "C"];
  const arr = keys.map((k) => Number(wH[k]) || 0).sort((a, b) => b - a);
  const hollandGap = ((arr[0] || 0) - (arr[1] || 0)) / 6;

  const qScore = clamp(qCount / 10, 0, 1);
  return clamp(0.25 * qScore + 0.45 * clamp(mbtiScore, 0, 1) + 0.3 * clamp(hollandGap, 0, 1), 0, 0.99);
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

  const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!adminRes.ok) return { ok: false, status: 500, error: "admin fetch failed" };
  const adminUser = await adminRes.json();
  const providers = (adminUser?.identities || []).map((i) => (i?.provider || "").toLowerCase());
  if (providers.length && !providers.includes("google")) return { ok: false, status: 403, error: "google only" };

  return { ok: true, user: { id: userId, email } };
}

async function supabaseSelectState(userId, env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessment_state?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return rows[0] || null;
}

async function supabaseUpsertState(payload, env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessment_state`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return rows[0] || null;
}

async function callWenxinFlashGenerateQuestion(input, env) {
  const endpoint = "https://qianfan.baidubce.com/v2/chat/completions";
  const apiKey = env.QIANFAN_API_KEY; // This should be the bce-v3/... key
  if (!apiKey) throw new Error("Missing Qianfan API env: QIANFAN_API_KEY");
  const model = env.QIANFAN_CHAT_MODEL || "ernie-speed-128k";

  const messages = [
    {
      role: "user",
      content:
`你是校園輔導助手。請根據使用者目前狀態，產生下一題「生活化/校園情境」選擇題。
規則：
- 不可在題目/選項中提及「MBTI」「Holland」「性格測試」「人格測驗」等字眼
- 題目需由淺入深（破冰 → 行為 → 情境），依 current_stage 調整
- 必須針對尚未收斂的維度出題（state.unconverged）
- 回傳必須是 JSON（不要加任何多餘文字、不要 markdown）
- 每題提供 4 個選項，每個選項需提供對應權重變化（mbti_delta, holland_delta）
- 權重變化數值範圍建議 -2..+2（整數）

回傳 JSON 格式範例（僅示意，請輸出同樣結構）：
{"question_id":"q_xxx","prompt":"...","options":[{"text":"...","mbti_delta":{"E":1,"I":0},"holland_delta":{"R":1}}, ... 共4個]}

輸入 state JSON：
${JSON.stringify(input)}`
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
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  });

  const dataText = await res.text();
  if (!res.ok) {
    throw new Error(`Qianfan error: ${dataText}`);
  }

  let data;
  try { data = JSON.parse(dataText); } catch { throw new Error("Qianfan returned non-JSON response envelope"); }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    if (data?.error_code) {
      throw new Error(`Qianfan API error: ${data.error_msg} (code: ${data.error_code})`);
    }
    throw new Error("Qianfan returned empty or invalid content");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Model content is not valid JSON");
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

    let body = {};
    try { body = await request.json(); } catch { 
      // If body is empty, it's a request for the first question.
    }

    const userId = ver.user.id;

    let state = await supabaseSelectState(userId, env);
    if (!state) {
      state = await supabaseUpsertState({
        user_id: userId,
        current_stage: "icebreaker",
        confidence_score: 0,
        mbti_weights: { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 },
        holland_weights: { R:0,I:0,A:0,S:0,E:0,C:0 },
        question_history: [],
      }, env);
    }

    const answer = body?.answer || null;
    if (answer) {
      const mbtiDelta = safeObj(answer?.selected_option?.mbti_delta);
      const hollandDelta = safeObj(answer?.selected_option?.holland_delta);

      const nextMbti = mergeWeights(state.mbti_weights, mbtiDelta);
      const nextHolland = mergeWeights(state.holland_weights, hollandDelta);

      const history = Array.isArray(state.question_history) ? state.question_history : [];
      history.push({
        at: new Date().toISOString(),
        question_id: answer.question_id || null,
        selected_index: Number.isFinite(answer.selected_index) ? answer.selected_index : null,
        selected_text: answer?.selected_option?.text || null,
        mbti_delta: mbtiDelta,
        holland_delta: hollandDelta,
        user_text: typeof answer.user_text === "string" ? answer.user_text.slice(0, 500) : null,
      });

      const tempState = { ...state, mbti_weights: nextMbti, holland_weights: nextHolland, question_history: history };
      const nextConf = calcConfidence(tempState);
      const nextStage = decideStage({ ...tempState, confidence_score: nextConf });

      state = await supabaseUpsertState({
        user_id: userId,
        mbti_weights: nextMbti,
        holland_weights: nextHolland,
        question_history: history,
        confidence_score: nextConf,
        current_stage: nextStage,
      }, env);
    }

    const mbtiConv = computeMbtiConverged(state.mbti_weights, state.confidence_score);
    const hollandConv = computeHollandConverged(state.holland_weights, state.confidence_score);

    const unconverged = {
      mbti: Object.fromEntries(Object.entries(mbtiConv).map(([k, v]) => [k, !v])),
      holland: !hollandConv,
    };

    if (state.current_stage === "done") {
      return jsonResponse(200, { ok: true, done: true, state: { ...state, unconverged } });
    }

    const aiInput = {
      current_stage: state.current_stage,
      confidence_score: state.confidence_score,
      mbti_weights: state.mbti_weights,
      holland_weights: state.holland_weights,
      unconverged,
      question_history_tail: (Array.isArray(state.question_history) ? state.question_history : []).slice(-6),
      constraints: { options_count: 4, delta_range: [-2, 2], language: "zh-Hant" },
    };

    const q = await callWenxinFlashGenerateQuestion(aiInput, env);

    if (!q || typeof q !== "object" || !Array.isArray(q.options) || q.options.length !== 4) {
      return jsonResponse(500, { error: "AI question invalid" });
    }

    const question = {
      question_id: q.question_id || `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      stage: state.current_stage,
      prompt: q.prompt || q.question || q.content || "",
      options: q.options.map((opt) => ({
        text: String(opt.text || opt.option || ""),
        mbti_delta: safeObj(opt.mbti_delta),
        holland_delta: safeObj(opt.holland_delta),
      })),
    };

    if (!question.prompt || question.options.some((o) => !o.text)) {
      return jsonResponse(500, { error: "AI returned empty prompt/options" });
    }

    const history = Array.isArray(state.question_history) ? state.question_history : [];
    history.push({
      at: new Date().toISOString(),
      question_id: question.question_id,
      prompt: question.prompt,
      options: question.options.map((o) => ({ text: o.text, mbti_delta: o.mbti_delta, holland_delta: o.holland_delta })),
      asked_stage: state.current_stage,
      asked_confidence: state.confidence_score,
    });

    state = await supabaseUpsertState({ user_id: userId, question_history: history.slice(-60) }, env);

    return jsonResponse(200, {
      ok: true,
      done: false,
      question,
      state: {
        current_stage: state.current_stage,
        confidence_score: state.confidence_score,
        mbti_weights: state.mbti_weights,
        holland_weights: state.holland_weights,
        unconverged,
      },
    });
  } catch (e) {
    return jsonResponse(500, { error: "Server error", details: String(e?.message || e) });
  }
}
