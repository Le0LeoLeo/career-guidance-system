// Supabase Edge Function: AI 智能助手
// 使用百度文心一言 (ERNIE-4.0/4.5) API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  prompt: string;
  history?: Array<{ role: string; content: string }>;
}

serve(async (req) => {
  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 從環境變數讀取百度 API 配置
    // 方式 1: 直接使用 API Key (千帆平台推薦方式，格式: bce-v3/xxx)
    let BAIDU_API_KEY = Deno.env.get('BAIDU_API_KEY')
    // 方式 2: 使用 OAuth 2.0 (需要 API Key 和 Secret Key)
    let BAIDU_SECRET_KEY = Deno.env.get('BAIDU_SECRET_KEY')

    // 清理 API Key：去除首尾空白和控制字符
    if (BAIDU_API_KEY) {
      BAIDU_API_KEY = BAIDU_API_KEY.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    }
    if (BAIDU_SECRET_KEY) {
      BAIDU_SECRET_KEY = BAIDU_SECRET_KEY.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    }

    console.log('收到請求，方法：', req.method)
    console.log('BAIDU_API_KEY 是否存在：', !!BAIDU_API_KEY)
    console.log('BAIDU_API_KEY 長度：', BAIDU_API_KEY?.length || 0)
    console.log('BAIDU_API_KEY 前20字符：', BAIDU_API_KEY ? JSON.stringify(BAIDU_API_KEY.substring(0, 20)) : '未設置')
    console.log('BAIDU_API_KEY 格式：', BAIDU_API_KEY ? (BAIDU_API_KEY.startsWith('bce-v3/') ? '千帆格式' : '其他格式') : '未設置')

    if (!BAIDU_API_KEY) {
      console.error('❌ BAIDU_API_KEY 未設定')
      return new Response(
        JSON.stringify({ 
          error: '百度 API Key 未設定',
          message: '請檢查環境變數 BAIDU_API_KEY 是否已設置',
          hint: '運行命令：npx supabase secrets set BAIDU_API_KEY=your_key'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 解析請求體
    let requestBody: RequestBody
    try {
      requestBody = await req.json()
      console.log('請求體解析成功：', { prompt: requestBody.prompt?.substring(0, 50) + '...', historyLength: requestBody.history?.length || 0 })
    } catch (jsonError) {
      console.error('❌ JSON 解析失敗：', jsonError)
      return new Response(
        JSON.stringify({ 
          error: '請求格式錯誤',
          message: '無法解析 JSON 請求體',
          details: jsonError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { prompt, history = [] } = requestBody

    if (!prompt || typeof prompt !== 'string') {
      console.error('❌ prompt 無效：', prompt)
      return new Response(
        JSON.stringify({ 
          error: '請提供有效的問題 (prompt)',
          message: 'prompt 必須是非空字符串',
          received: typeof prompt 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 步驟 1: 獲取認證 Token
    // 優先使用直接 API Key (千帆平台方式)
    // 如果 API Key 格式是 bce-v3/xxx，直接使用；否則嘗試 OAuth 2.0
    let authToken: string
    
    if (BAIDU_API_KEY.startsWith('bce-v3/')) {
      // 千帆平台直接使用 API Key
      console.log('✅ 使用千帆平台 API Key 格式')
      authToken = BAIDU_API_KEY
    } else if (BAIDU_SECRET_KEY) {
      // 使用 OAuth 2.0 獲取 Access Token
      console.log('嘗試使用 OAuth 2.0 獲取 Access Token...')
      const accessToken = await getAccessToken(BAIDU_API_KEY, BAIDU_SECRET_KEY)
      if (!accessToken) {
        console.error('❌ 無法獲取百度 Access Token')
        return new Response(
          JSON.stringify({ 
            error: '無法獲取百度 Access Token',
            message: 'OAuth 2.0 認證失敗，請檢查 API Key 和 Secret Key 是否正確'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      console.log('✅ OAuth 2.0 認證成功')
      authToken = accessToken
    } else {
      console.error('❌ API Key 格式不正確且未提供 Secret Key')
      console.error('API Key 原始值（前50字符）：', JSON.stringify(BAIDU_API_KEY.substring(0, 50)))
      console.error('API Key 長度：', BAIDU_API_KEY.length)
      console.error('API Key 是否以 bce-v3/ 開頭：', BAIDU_API_KEY.startsWith('bce-v3/'))
      console.error('API Key 是否包含控制字符：', /[\x00-\x1F\x7F-\x9F]/.test(BAIDU_API_KEY))
      
      return new Response(
        JSON.stringify({ 
          error: 'API Key 格式不正確',
          message: '請設定 BAIDU_API_KEY (千帆格式: bce-v3/xxx) 或同時設定 BAIDU_API_KEY 和 BAIDU_SECRET_KEY (OAuth 2.0)',
          receivedFormat: JSON.stringify(BAIDU_API_KEY.substring(0, 30)),
          receivedLength: BAIDU_API_KEY.length,
          startsWithBceV3: BAIDU_API_KEY.startsWith('bce-v3/'),
          hint: '請確認 API Key 格式正確。千帆平台 API Key 應以 "bce-v3/" 開頭，例如: bce-v3/xxx-xxx-xxx'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 步驟 2: 構建訊息列表
    const messages = buildMessages(prompt, history)

    // 步驟 3: 呼叫百度文心 API
    console.log('正在調用百度文心 API...')
    const aiResponse = await callBaiduErnieAPI(authToken, messages)

    if (!aiResponse || !aiResponse.result) {
      console.error('❌ AI 回應失敗：', aiResponse)
      return new Response(
        JSON.stringify({ 
          error: 'AI 回應失敗',
          message: aiResponse?.error_msg || '未知錯誤',
          details: aiResponse
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ AI 回應成功，長度：', aiResponse.result.length)

    // 返回成功回應
    return new Response(
      JSON.stringify({ 
        response: aiResponse.result,
        usage: aiResponse.usage || null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Edge Function 錯誤：', error)
    console.error('錯誤堆疊：', error.stack)
    return new Response(
      JSON.stringify({ 
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
        type: error.name || 'Error',
        stack: error.stack || null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * 獲取百度 Access Token
 * 使用 OAuth 2.0 客戶端憑證模式
 */
async function getAccessToken(apiKey: string, secretKey: string): Promise<string | null> {
  try {
    const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token'
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: secretKey
    })

    const response = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('獲取 Access Token 失敗：', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.access_token) {
      return data.access_token
    } else {
      console.error('Access Token 回應格式錯誤：', data)
      return null
    }
  } catch (error) {
    console.error('獲取 Access Token 異常：', error)
    return null
  }
}

/**
 * 構建訊息列表
 * 將歷史訊息和當前問題組合成 API 所需的格式
 */
function buildMessages(prompt: string, history: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = []

  // 添加系統提示詞（可選）
  messages.push({
    role: 'user',
    content: '你是一位專業的職涯輔導顧問，擅長幫助學生探索職涯方向、制定學習計劃、準備升學申請等。請用友善、專業的語氣回答學生的問題。'
  })

  // 添加歷史訊息（最多保留最近 10 輪對話）
  const recentHistory = history.slice(-10)
  for (const msg of recentHistory) {
    // 百度 API 使用 user 和 assistant 角色
    const role = msg.role === 'user' ? 'user' : 'assistant'
    messages.push({
      role: role,
      content: msg.content
    })
  }

  // 添加當前問題
  messages.push({
    role: 'user',
    content: prompt
  })

  return messages
}

/**
 * 呼叫百度文心 API
 * 使用 ERNIE-4.0-8K 或 ERNIE-4.5 模型
 */
async function callBaiduErnieAPI(authToken: string, messages: Array<{ role: string; content: string }>): Promise<any> {
  try {
    // 使用千帆平台 API (推薦，支援 ERNIE-4.5)
    const apiUrl = 'https://qianfan.baidubce.com/v2/chat/completions'
    
    const requestBody = {
      model: 'ernie-4.5-turbo-128k', // 或 'ernie-4.0-8k' 根據您的需求
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    }

    // 千帆平台使用 Bearer Token 認證
    // authToken 可能是 bce-v3/xxx 格式的 API Key，或 OAuth 2.0 獲取的 Access Token
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 百度 API 錯誤：', response.status, response.statusText)
      console.error('錯誤詳情：', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText }
      }
      return { 
        error_msg: `API 請求失敗: ${response.status} ${response.statusText}`,
        details: errorData
      }
    }

    const data = await response.json()
    
    // 處理千帆平台的回應格式
    if (data.choices && data.choices.length > 0) {
      return {
        result: data.choices[0].message.content,
        usage: data.usage || null
      }
    }
    
    // 處理舊版 API 的回應格式
    if (data.result) {
      return data
    }

    console.error('未知的 API 回應格式：', data)
    return { error_msg: '未知的 API 回應格式' }

  } catch (error) {
    console.error('呼叫百度 API 異常：', error)
    return { error_msg: error.message }
  }
}

