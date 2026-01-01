// netlify/functions/auth-config.js
// 返回前端需要的 Supabase 配置（僅返回公開的 URL，不返回密鑰）

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(204, {});
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const SUPABASE_URL = process.env.SUPABASE_URL;

    if (!SUPABASE_URL) {
      return json(500, { error: "Supabase URL not configured" });
    }

    // 只返回 URL，不返回密鑰（URL 本身是公開的）
    const redirectTo = event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/') || 'https://' + event.headers.host;
    
    return json(200, { 
      supabaseUrl: SUPABASE_URL,
      redirectTo: redirectTo
    });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
