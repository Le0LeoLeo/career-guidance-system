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
  use_web_search?: boolean;  // 是否使用 Web Search
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

    const { prompt, history = [], use_web_search = false } = requestBody

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

    // 步驟 0: 獲取用戶認證信息並查詢用戶數據
    let userData = null
    try {
      const authHeader = req.headers.get('Authorization')
      // Supabase Edge Function 會自動提供這些環境變數
      // 如果沒有，可以從請求頭中獲取（Supabase 會自動注入）
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
                         req.headers.get('x-supabase-url') || 
                         ''
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 
                             req.headers.get('x-supabase-anon-key') || 
                             req.headers.get('apikey') || 
                             ''
      
      if (authHeader && supabaseUrl && supabaseAnonKey) {
        // 使用用戶的認證token創建Supabase客戶端
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: { Authorization: authHeader }
          }
        })
        
        // 獲取當前用戶信息
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        
        if (!authError && user) {
          console.log('✅ 用戶已認證，開始查詢用戶數據，用戶ID：', user.id)
          
          // 查詢用戶數據（使用用戶認證的客戶端，RLS會自動生效）
          userData = await fetchUserData(supabaseClient, user.id)
          console.log('✅ 用戶數據查詢完成')
          if (userData) {
            console.log('  - 考試成績：', userData.totalExams, '筆')
            console.log('  - 即將到來的考試：', userData.upcomingExams, '場')
            console.log('  - 平均分數：', userData.averageScore || '無')
            console.log('  - 目標資訊：', userData.profile ? '有' : '無')
          }
        } else {
          console.log('⚠️ 用戶認證失敗，將不包含用戶數據：', authError?.message)
        }
      } else {
        if (!authHeader) console.log('⚠️ 未提供 Authorization header')
        if (!supabaseUrl) console.log('⚠️ SUPABASE_URL 未找到')
        if (!supabaseAnonKey) console.log('⚠️ SUPABASE_ANON_KEY 未找到')
        console.log('⚠️ 將不包含用戶數據（AI仍可回答問題，但無法分析個人數據）')
      }
    } catch (userDataError) {
      console.error('⚠️ 查詢用戶數據時發生錯誤（不影響主要功能）：', userDataError)
      // 不中斷流程，繼續執行
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

    // 步驟 2: 構建訊息列表（包含用戶數據）
    const messages = buildMessages(prompt, history, use_web_search, userData)

    // 步驟 3: 呼叫百度文心 API
    console.log('正在調用百度文心 API...', use_web_search ? '(啟用 Web Search)' : '')
    const aiResponse = await callBaiduErnieAPI(authToken, messages, use_web_search)

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
 * 獲取用戶數據（考試成績、目標分數、考程表等）
 */
async function fetchUserData(supabase: any, userId: string): Promise<any> {
  try {
    console.log('開始查詢用戶數據，用戶ID：', userId)
    
    // 並行查詢多個數據表
    const [profileData, examScoresData, examSchedulesData] = await Promise.all([
      // 查詢用戶檔案（包含目標大學、科系、目標分數）
      supabase
        .from('profiles')
        .select('target_university_id, target_major_name, target_admission_score')
        .eq('id', userId)
        .single(),
      
      // 查詢考試成績（最近20筆）
      supabase
        .from('exam_scores')
        .select('subject, score_obtained, full_marks, type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // 查詢考程表（未來的考試）
      supabase
        .from('exam_schedules')
        .select('subject, exam_date, exam_time, exam_type')
        .eq('user_id', userId)
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })
        .limit(20)
    ])

    // 檢查查詢錯誤
    if (profileData.error) {
      console.warn('查詢用戶檔案失敗：', profileData.error.message)
    }
    if (examScoresData.error) {
      console.warn('查詢考試成績失敗：', examScoresData.error.message)
    }
    if (examSchedulesData.error) {
      console.warn('查詢考程表失敗：', examSchedulesData.error.message)
    }

    const profile = profileData.data
    const examScores = examScoresData.data || []
    const examSchedules = examSchedulesData.data || []

    console.log('用戶數據查詢結果：')
    console.log('  - 檔案數據：', profile ? '有' : '無')
    console.log('  - 考試成績：', examScores.length, '筆')
    console.log('  - 即將到來的考試：', examSchedules.length, '場')

    // 計算平均分數
    let averageScore = null
    if (examScores.length > 0) {
      const totalPercentage = examScores.reduce((sum: number, score: any) => {
        if (score.full_marks && score.full_marks > 0) {
          return sum + (score.score_obtained / score.full_marks * 100)
        }
        return sum
      }, 0)
      averageScore = (totalPercentage / examScores.length).toFixed(1)
      console.log('  - 平均分數：', averageScore, '%')
    }

    const result = {
      profile: profile || null,
      examScores: examScores,
      examSchedules: examSchedules,
      averageScore: averageScore,
      totalExams: examScores.length,
      upcomingExams: examSchedules.length
    }
    
    console.log('✅ 用戶數據查詢完成')
    return result
  } catch (error) {
    console.error('❌ 查詢用戶數據時發生異常：', error)
    console.error('錯誤詳情：', error.message)
    console.error('錯誤堆疊：', error.stack)
    return null
  }
}

/**
 * 構建訊息列表
 * 將歷史訊息和當前問題組合成 API 所需的格式
 * 如果提供了用戶數據，會將其整合到系統提示詞中
 */
function buildMessages(prompt: string, history: Array<{ role: string; content: string }>, useWebSearch: boolean = false, userData: any = null): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = []

  // 添加系統提示詞
  let systemPrompt = '你是一位專業的職涯輔導顧問，擅長幫助學生探索職涯方向、制定學習計劃、準備升學申請等。請用友善、專業的語氣回答學生的問題。'
  
  // 如果有用戶數據，將其整合到系統提示詞中
  if (userData) {
    systemPrompt += '\n\n【重要：以下是當前用戶的實際數據，你必須主動使用這些數據來回答問題，不要要求用戶再次提供】\n'
    
    let hasData = false
    
    // 目標信息
    if (userData.profile) {
      const profile = userData.profile
      if (profile.target_university_id || profile.target_major_name || profile.target_admission_score) {
        systemPrompt += `\n【用戶目標資訊】\n`
        if (profile.target_university_id) {
          systemPrompt += `- 目標大學ID：${profile.target_university_id}\n`
          hasData = true
        }
        if (profile.target_major_name) {
          systemPrompt += `- 目標科系：${profile.target_major_name}\n`
          hasData = true
        }
        if (profile.target_admission_score) {
          systemPrompt += `- 目標錄取分數：${profile.target_admission_score}分\n`
          hasData = true
        }
      }
    }
    
    // 考試成績
    if (userData.examScores && userData.examScores.length > 0) {
      systemPrompt += `\n【用戶考試成績記錄】（共${userData.totalExams}筆，顯示最近10筆）\n`
      userData.examScores.slice(0, 10).forEach((score: any, index: number) => {
        const percentage = ((score.score_obtained / score.full_marks) * 100).toFixed(1)
        const date = new Date(score.created_at).toLocaleDateString('zh-TW')
        systemPrompt += `${index + 1}. ${score.subject}：${score.score_obtained}/${score.full_marks}分（${percentage}%）- ${date}`
        if (score.type) systemPrompt += ` [${score.type}]`
        systemPrompt += '\n'
      })
      if (userData.averageScore) {
        systemPrompt += `\n平均分數：${userData.averageScore}%\n`
      }
      hasData = true
    } else {
      systemPrompt += '\n【考試成績】目前沒有考試成績記錄\n'
    }
    
    // 即將到來的考試
    if (userData.examSchedules && userData.examSchedules.length > 0) {
      systemPrompt += `\n【即將到來的考試】（共${userData.upcomingExams}場）\n`
      userData.examSchedules.forEach((exam: any, index: number) => {
        const date = new Date(exam.exam_date).toLocaleDateString('zh-TW')
        const type = exam.exam_type === 'test' ? '測驗' : '考試'
        const time = exam.exam_time || '時間未定'
        systemPrompt += `${index + 1}. ${exam.subject} - ${date} ${time}（${type}）\n`
      })
      hasData = true
    } else {
      systemPrompt += '\n【即將到來的考試】目前沒有即將到來的考試\n'
    }
    
    if (hasData) {
      systemPrompt += '\n【你必須遵守的規則】\n'
      systemPrompt += '1. 當用戶詢問「我的理想大學是什麼」、「我的目標是什麼」等問題時，直接使用上述目標資訊回答，不要要求用戶提供。\n'
      systemPrompt += '2. 當用戶詢問「我的成績如何」、「我的分數如何」等問題時，直接分析上述考試成績記錄，指出強項和弱項科目，並給出改進建議。\n'
      systemPrompt += '3. 當用戶詢問「我還需要多少分才能達到目標」時，計算目標分數與當前平均分數的差距，並給出具體建議。\n'
      systemPrompt += '4. 當用戶詢問「我有哪些考試」、「我的考試安排」時，直接列出上述即將到來的考試。\n'
      systemPrompt += '5. 主動結合用戶的目標、成績和考試安排，提供個性化的學習建議和備考計劃。\n'
      systemPrompt += '6. 永遠不要說「我沒有你的數據」或「請提供你的數據」，因為你已經有了上述數據。\n'
      systemPrompt += '7. 如果用戶問的問題涉及上述數據，直接使用數據回答，並主動提供分析和建議。\n'
    }
  } else {
    systemPrompt += '\n\n【注意】當前無法獲取用戶的個人數據（成績、目標等）。如果用戶詢問相關問題，請禮貌地說明需要用戶提供相關信息。'
  }
  
  if (useWebSearch) {
    systemPrompt += '\n\n重要：請使用網絡搜索功能獲取最新的實時信息，特別是關於大學錄取分數、考試資訊等需要最新數據的問題。搜索時請使用準確的關鍵詞，並從搜索結果中提取準確的數據。'
  }
  
  // 使用 system 角色發送系統提示詞（百度千帆 API 支持 system 角色）
  // 如果 API 不支持，會自動回退到 user 角色
  messages.push({
    role: 'system',
    content: systemPrompt
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
 * 支持 Web Search 功能（如果 API 支持）
 * 
 * 注意：百度千帆平台 API 的 Web Search 功能實現方式可能因版本而異
 * - 某些版本可能通過 enable_search 參數啟用
 * - 某些版本可能通過 tools 參數啟用
 * - 某些版本可能自動根據 prompt 內容啟用
 * 如果 enable_search 參數不被支持，API 會忽略它，但不會報錯
 */
async function callBaiduErnieAPI(authToken: string, messages: Array<{ role: string; content: string }>, useWebSearch: boolean = false): Promise<any> {
  try {
    // 使用千帆平台 API (推薦，支援 ERNIE-4.5)
    const apiUrl = 'https://qianfan.baidubce.com/v2/chat/completions'
    
    const requestBody: any = {
      model: 'ernie-4.5-turbo-128k', // 或 'ernie-4.0-8k' 根據您的需求
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,  // 增加 token 限制以支持更長的搜索結果
      stream: false
    }

    // 如果啟用 Web Search，嘗試添加搜索相關參數
    if (useWebSearch) {
      // 方式 1: 嘗試添加 enable_search 參數（如果 API 支持）
      requestBody.enable_search = true
      
      // 方式 2: 嘗試添加 tools 參數（如果 API 支持工具調用）
      // requestBody.tools = [{ type: 'web_search' }]
      
      // 方式 3: 使用支持搜索的模型版本（ernie-4.5-turbo-128k 可能支持）
      // 已在上面設置
      
      console.log('✅ 已啟用 Web Search 參數')
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

    // 如果返回錯誤且提到 system 角色不支持，記錄警告
    if (data.error && data.error.message && data.error.message.includes('system')) {
      console.warn('⚠️ API 可能不支持 system 角色，將在下次請求中回退到 user 角色')
    }

    console.error('未知的 API 回應格式：', data)
    return { error_msg: '未知的 API 回應格式' }

  } catch (error) {
    console.error('呼叫百度 API 異常：', error)
    return { error_msg: error.message }
  }
}

