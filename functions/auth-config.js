// functions/auth-config.js
// 返回前端需要的 Supabase 配置（僅返回公開的 URL，不返回密鑰）

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
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
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      });
    }

    if (context.request.method !== "GET") {
      return jsonResponse(405, { error: "Method Not Allowed" });
    }

    const { env } = context;
    const SUPABASE_URL = env.SUPABASE_URL;

    if (!SUPABASE_URL) {
      return jsonResponse(500, { error: "Supabase URL not configured" });
    }

    // 只返回 URL，不返回密鑰（URL 本身是公開的）
    const url = new URL(context.request.url);
    const redirectTo = `${url.protocol}//${url.host}`;
    
    return jsonResponse(200, { 
      supabaseUrl: SUPABASE_URL,
      redirectTo: redirectTo
    });
  } catch (e) {
    return jsonResponse(500, { error: e.message || String(e) });
  }
}

