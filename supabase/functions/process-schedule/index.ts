// Supabase Edge Function: 處理考程表圖片 OCR 和整理
// 使用 PaddleOCR-VL 和文心一言 API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  image: string; // Base64 編碼的圖片（不含 data:image/... 前綴）
  stream?: 'science' | 'arts' | 'general'; // 組別：理組、文組、不分組
}

interface PaddleOCRResponse {
  id: string;
  result: {
    layoutParsingResults: Array<{
      markdown: {
        text: string;
        images?: Record<string, string>;
      };
      prunedResult?: {
        parsing_res_list?: Array<{
          block_label: string;
          block_content: string;
          block_bbox: number[];
        }>;
      };
    }>;
    dataInfo: {
      type: string;
      width: number;
      height: number;
    };
  };
}

// 為了向後兼容，保留舊的 OCRResponse 接口
interface OCRResponse {
  words_result: Array<{ words: string }>;
  words_result_num: number;
}

interface ScheduleItem {
  subject: string;
  exam_date: string; // YYYY-MM-DD
  exam_time: string; // HH:MM (必須有值，如果沒有則使用 "00:00")
  exam_type: 'test' | 'exam';
}

serve(async (req) => {
  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 從環境變數讀取百度千帆平台 API Key
    // PaddleOCR-VL 和文心一言都使用相同的千帆平台 API Key（bce-v3/...格式）
    const BAIDU_API_KEY = Deno.env.get('BAIDU_API_KEY')?.trim()

    if (!BAIDU_API_KEY) {
      console.error('❌ 百度千帆平台 API Key 未設定')
      return new Response(
        JSON.stringify({ 
          error: '百度千帆平台 API Key 未設定',
          message: '請檢查環境變數 BAIDU_API_KEY 是否已設置（千帆平台格式：bce-v3/...）',
          hint: '運行命令：npx supabase secrets set BAIDU_API_KEY=bce-v3/your_key'
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
      console.log('請求體解析成功，圖片長度：', requestBody.image?.length || 0)
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

    const { image, stream = 'general' } = requestBody

    if (!image || typeof image !== 'string') {
      console.error('❌ 圖片數據無效')
      return new Response(
        JSON.stringify({ 
          error: '請提供有效的圖片數據 (Base64)',
          message: 'image 必須是非空字符串'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 驗證 Base64 格式（移除可能的 data URL 前綴）
    let imageBase64 = image.trim()
    if (imageBase64.includes(',')) {
      imageBase64 = imageBase64.split(',')[1]
    }
    
    // 驗證 Base64 長度（至少應該有一些數據）
    if (imageBase64.length < 100) {
      console.error('❌ Base64 圖片數據太短：', imageBase64.length, '字符')
      return new Response(
        JSON.stringify({ 
          error: '圖片數據無效',
          message: 'Base64 圖片數據長度不足，請確認圖片已正確上傳'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // 檢查圖片大小（PaddleOCR-VL 限制單圖片 10MB，Base64 約 13.3MB）
    // Base64 編碼會增加約 33% 的大小，所以 Base64 長度約 13.3MB 對應原始圖片 10MB
    const estimatedSizeMB = (imageBase64.length * 3) / 4 / 1024 / 1024
    const base64SizeMB = imageBase64.length / 1024 / 1024
    const maxBase64Length = 13.3 * 1024 * 1024 // 約 13.3MB 的 Base64 長度
    
    if (imageBase64.length > maxBase64Length) {
      console.error('❌ 圖片過大：', estimatedSizeMB.toFixed(2), 'MB，超過 10MB 限制')
      return new Response(
        JSON.stringify({ 
          error: '圖片過大',
          message: `圖片大小約 ${estimatedSizeMB.toFixed(2)}MB，超過 PaddleOCR-VL API 的 10MB 限制`,
          hint: '請壓縮圖片或使用較小的圖片文件（建議小於 10MB）',
          image_size_mb: estimatedSizeMB.toFixed(2),
          base64_size_mb: base64SizeMB.toFixed(2),
          max_size_mb: '10'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ 圖片數據驗證通過')
    console.log('- Base64 長度：', imageBase64.length, '字符')
    console.log('- Base64 大小：', base64SizeMB.toFixed(2), 'MB')
    console.log('- 估算原始大小：', estimatedSizeMB.toFixed(2), 'MB')

    // 步驟 A: 呼叫 PaddleOCR-VL API
    console.log('正在呼叫 PaddleOCR-VL API...')
    const ocrResult = await callPaddleOCR(BAIDU_API_KEY, imageBase64)
    
    // 檢查是否是錯誤響應
    if (!ocrResult || (ocrResult as any).error) {
      const errorInfo = ocrResult as any
      console.error('❌ OCR 識別失敗')
      
      // 構建詳細的錯誤信息
      let errorMessage = '無法從圖片中識別文字'
      let hints: string[] = []
      
      // 計算圖片大小信息
      const estimatedSizeMB = (imageBase64.length * 3) / 4 / 1024 / 1024
      const base64SizeMB = imageBase64.length / 1024 / 1024
      
      if (errorInfo.status === 500) {
        errorMessage = 'PaddleOCR-VL API 服務器錯誤 (500)'
        
        // 檢查是否為空響應
        if (errorInfo.errorData?.error_code === 'EMPTY_RESPONSE' || !errorInfo.responseText) {
          errorMessage = 'PaddleOCR-VL API 返回空響應，服務器可能無法處理請求'
          hints.push('⚠️ 這通常表示百度服務器內部錯誤或網絡問題')
          hints.push('1. 請稍後重試，可能是服務器暫時不可用')
          hints.push('2. 檢查網絡連接是否正常')
          hints.push('3. 確認千帆平台 PaddleOCR-VL 服務已正常開通')
        } else {
          hints.push('1. 檢查圖片大小是否超過 10MB 限制')
          hints.push('2. 確認圖片格式正確（支持 JPG、PNG）')
          hints.push('3. 檢查千帆平台 PaddleOCR-VL 服務是否正常開通')
          hints.push('4. 確認 API 配額是否充足')
          hints.push('5. 圖片分辨率可能過高，嘗試降低分辨率')
        }
        
        // 添加圖片大小信息
        if (estimatedSizeMB > 10) {
          hints.push(`❌ 當前圖片大小約 ${estimatedSizeMB.toFixed(2)}MB，超過 10MB 限制`)
        } else if (base64SizeMB > 13) {
          hints.push(`⚠️ Base64 編碼後大小約 ${base64SizeMB.toFixed(2)}MB，可能導致問題`)
        } else {
          hints.push(`✅ 圖片大小約 ${estimatedSizeMB.toFixed(2)}MB，在限制內`)
        }
      } else if (errorInfo.status === 401 || errorInfo.status === 403) {
        errorMessage = 'OCR API 認證失敗'
        hints.push('1. 檢查 BAIDU_API_KEY 是否正確（應為 bce-v3/... 格式）')
        hints.push('2. 確認 API Key 是否有效且未過期')
        hints.push('3. 確認 API Key 是否有使用 PaddleOCR-VL 的權限')
      } else if (errorInfo.status === 400) {
        errorMessage = 'OCR API 請求參數錯誤'
        hints.push('1. 檢查圖片 Base64 編碼是否正確')
        hints.push('2. 確認圖片格式是否支持（JPG、PNG）')
        hints.push('3. 確認圖片未損壞')
        hints.push('4. 檢查 fileType 參數是否正確設置為 1（圖像文件）')
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'OCR 識別失敗',
          message: errorMessage,
          status: errorInfo.status || 'unknown',
          statusText: errorInfo.statusText || 'unknown',
          error_code: errorInfo.errorData?.error_code || 'UNKNOWN',
          error_msg: errorInfo.errorData?.error_msg || '無詳細錯誤信息',
          hints: errorInfo.hints || hints,
          image_size_mb: errorInfo.image_size_mb || estimatedSizeMB.toFixed(2),
          base64_size_mb: errorInfo.base64_size_mb || base64SizeMB.toFixed(2),
          details: errorInfo.errorData || errorInfo.responseText || '無詳細信息'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 從 PaddleOCR 響應中提取文字
    const ocrText = extractTextFromPaddleOCR(ocrResult)
    
    if (!ocrText || ocrText.trim().length === 0) {
      console.error('❌ OCR 識別無結果')
      console.error('OCR 響應數據：', JSON.stringify(ocrResult).substring(0, 500))
      return new Response(
        JSON.stringify({ 
          error: 'OCR 識別無結果',
          message: '無法從圖片中識別文字，請確認圖片清晰且包含考試時間表',
          hint: '請確認圖片包含清晰的文字內容，建議使用高解析度圖片',
          ocr_response: ocrResult
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ OCR 識別成功')
    console.log('OCR 識別文字（前200字符）：', ocrText.substring(0, 200))

    // 步驟 C: 使用文心一言整理 OCR 結果
    console.log('正在使用文心一言整理考程表...')
    console.log('組別設定：', stream)
    const scheduleData = await organizeScheduleWithErnie(BAIDU_API_KEY, ocrText, stream)
    
    if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0) {
      console.error('❌ 文心一言整理失敗：', scheduleData)
      return new Response(
        JSON.stringify({ 
          error: '考程表整理失敗',
          message: '無法將 OCR 結果整理成結構化數據，請確認圖片包含完整的考試時間表',
          details: scheduleData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    console.log('✅ 考程表整理成功，共', scheduleData.length, '項考試')

    // 返回整理好的考程表數據
    return new Response(
      JSON.stringify({ 
        success: true,
        schedules: scheduleData,
        ocr_text: ocrText.substring(0, 500) // 僅返回前500字符供調試
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
 * 呼叫 PaddleOCR-VL API
 */
async function callPaddleOCR(apiKey: string, imageBase64: string): Promise<PaddleOCRResponse | any> {
  try {
    const ocrUrl = 'https://qianfan.baidubce.com/v2/ocr/paddleocr'
    
    // 構建請求體（根據 PaddleOCR-VL API 文檔）
    const requestBody = {
      model: 'paddleocr-vl-0.9b',
      file: imageBase64, // Base64 編碼的圖片
      fileType: 1, // 1 表示圖像文件
      useDocOrientationClassify: true, // 圖片方向矯正
      useDocUnwarping: true, // 圖片扭曲矯正
      useLayoutDetection: true, // 版面分析
      useChartRecognition: false, // 圖表識別（考程表不需要）
      layoutNms: true, // NMS 後處理
      repetitionPenalty: 1.0,
      temperature: 0,
      topP: 1.0,
      minPixels: 147384,
      maxPixels: 2822400,
      visualize: false // 不需要可視化圖像
    }

    console.log('調用 PaddleOCR-VL API，參數：')
    console.log('- model: paddleocr-vl-0.9b')
    console.log('- file: [base64 data, length:', imageBase64.length, ']')
    console.log('- fileType: 1 (圖像文件)')
    console.log('- useLayoutDetection: true')
    console.log('- useDocOrientationClassify: true')
    console.log('- useDocUnwarping: true')

    const response = await fetch(ocrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()
    console.log('OCR API 響應狀態:', response.status, response.statusText)
    console.log('OCR API 響應長度:', responseText.length, '字符')

    if (!response.ok) {
      console.error('❌ PaddleOCR-VL API HTTP 錯誤：', response.status, response.statusText)
      
      // 計算圖片大小信息
      const estimatedSizeMB = (imageBase64.length * 3) / 4 / 1024 / 1024
      const base64SizeMB = imageBase64.length / 1024 / 1024
      
      // 檢查響應是否為空
      if (responseText.length === 0) {
        console.error('⚠️ OCR API 返回空響應（0 字符）')
        console.error('這通常表示：')
        console.error('1. 百度服務器內部錯誤，無法處理請求')
        console.error('2. 網絡連接問題或超時')
        console.error('3. API 服務暫時不可用')
        console.error('圖片信息：')
        console.error('- Base64 長度：', imageBase64.length, '字符 (', base64SizeMB.toFixed(2), 'MB)')
        console.error('- 估算原始大小：', estimatedSizeMB.toFixed(2), 'MB')
        console.error('- 圖片大小狀態：', estimatedSizeMB > 10 ? '❌ 超過 10MB 限制' : '✅ 在限制內')
        
        // 返回詳細錯誤信息
        return {
          error: true,
          status: response.status,
          statusText: response.statusText,
          errorData: {
            error_code: 'EMPTY_RESPONSE',
            error_msg: 'PaddleOCR-VL API 返回空響應，可能是服務器內部錯誤或網絡問題'
          },
          responseText: '',
          image_size_mb: estimatedSizeMB.toFixed(2),
          base64_size_mb: base64SizeMB.toFixed(2),
          hints: [
            estimatedSizeMB > 10 ? '圖片大小超過 10MB 限制，請壓縮圖片' : '圖片大小在限制內',
            '請檢查網絡連接是否正常',
            '請稍後重試，可能是百度服務器暫時不可用',
            '請確認千帆平台 PaddleOCR-VL 服務已正常開通',
            '請檢查 API 配額是否充足'
          ]
        } as any
      }
      
      console.error('錯誤詳情：', responseText.substring(0, 1000))
      
      // 嘗試解析錯誤 JSON
      let errorData: any = null
      try {
        if (responseText.trim().length > 0) {
          errorData = JSON.parse(responseText)
          if (errorData.error?.code || errorData.error_code) {
            console.error('錯誤代碼：', errorData.error?.code || errorData.error_code)
            console.error('錯誤訊息：', errorData.error?.message || errorData.error_msg)
          }
        }
      } catch (e) {
        console.error('無法解析錯誤響應為 JSON，原始響應：', responseText.substring(0, 500))
        errorData = {
          error_code: 'PARSE_ERROR',
          error_msg: '無法解析錯誤響應',
          raw_response: responseText.substring(0, 500)
        }
      }
      
      // 針對 500 錯誤的特殊處理
      if (response.status === 500) {
        console.error('⚠️ PaddleOCR-VL API 返回 500 內部服務器錯誤')
        console.error('可能原因：')
        console.error('1. 圖片文件過大（Base64 長度：', imageBase64.length, '字符，約', base64SizeMB.toFixed(2), 'MB）')
        console.error('2. API 服務器暫時不可用')
        console.error('3. API 配額已用完或服務未開通')
        console.error('4. 圖片格式不支持或損壞')
        console.error('5. 圖片分辨率過高')
        
        console.error('圖片信息：')
        console.error('- Base64 長度：', imageBase64.length, '字符')
        console.error('- Base64 大小：', base64SizeMB.toFixed(2), 'MB')
        console.error('- 估算原始大小：', estimatedSizeMB.toFixed(2), 'MB')
        
        if (estimatedSizeMB > 10) {
          console.error('❌ 圖片過大，超過 10MB 限制')
        } else if (base64SizeMB > 13) {
          console.error('⚠️ Base64 編碼後大小超過 13MB，可能導致問題')
        } else {
          console.error('✅ 圖片大小在限制內，可能是其他原因導致 500 錯誤')
        }
      }
      
      // 返回包含詳細錯誤信息的對象
      return {
        error: true,
        status: response.status,
        statusText: response.statusText,
        errorData: errorData || {
          error_code: 'UNKNOWN_ERROR',
          error_msg: '未知錯誤'
        },
        responseText: responseText.substring(0, 1000),
        image_size_mb: estimatedSizeMB.toFixed(2),
        base64_size_mb: base64SizeMB.toFixed(2)
      } as any
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ OCR API 響應 JSON 解析失敗：', parseError)
      console.error('響應內容（前500字符）：', responseText.substring(0, 500))
      return {
        error: true,
        status: 500,
        statusText: 'Parse Error',
        errorData: {
          error_code: 'JSON_PARSE_ERROR',
          error_msg: '無法解析 API 響應為 JSON'
        },
        responseText: responseText.substring(0, 500)
      } as any
    }
    
    // 檢查是否有錯誤（千帆平台錯誤格式）
    if (data.error) {
      console.error('❌ OCR API 返回錯誤：', data.error.message || '未知錯誤')
      console.error('錯誤代碼：', data.error.code)
      console.error('完整錯誤響應：', JSON.stringify(data))
      return {
        error: true,
        status: 500,
        statusText: 'API Error',
        errorData: {
          error_code: data.error.code || 'API_ERROR',
          error_msg: data.error.message || '未知錯誤'
        },
        responseText: JSON.stringify(data)
      } as any
    }

    // 記錄識別結果統計
    console.log('✅ PaddleOCR-VL 識別成功')
    if (data.result?.dataInfo) {
      console.log('- 圖片尺寸：', data.result.dataInfo.width, 'x', data.result.dataInfo.height)
    }
    if (data.result?.layoutParsingResults?.length) {
      console.log('- 版面分析結果數：', data.result.layoutParsingResults.length)
    }

    return data as PaddleOCRResponse

  } catch (error) {
    console.error('呼叫 PaddleOCR-VL API 異常：', error)
    return {
      error: true,
      status: 500,
      statusText: 'Exception',
      errorData: {
        error_code: 'EXCEPTION',
        error_msg: error.message || '調用 API 時發生異常'
      }
    } as any
  }
}

/**
 * 從 PaddleOCR 響應中提取文字
 */
function extractTextFromPaddleOCR(ocrResult: PaddleOCRResponse): string {
  try {
    if (!ocrResult?.result?.layoutParsingResults || ocrResult.result.layoutParsingResults.length === 0) {
      console.error('❌ PaddleOCR 響應格式錯誤：無 layoutParsingResults')
      return ''
    }

    // 從 markdown 文本中提取純文字
    // markdown.text 可能包含 HTML 標籤和圖片引用，需要清理
    const markdownText = ocrResult.result.layoutParsingResults[0]?.markdown?.text || ''
    
    if (!markdownText) {
      // 如果沒有 markdown，嘗試從 prunedResult 中提取
      const prunedResult = ocrResult.result.layoutParsingResults[0]?.prunedResult
      if (prunedResult?.parsing_res_list) {
        const texts = prunedResult.parsing_res_list
          .filter(item => item.block_label !== 'image' && item.block_content)
          .map(item => item.block_content)
        return texts.join('\n')
      }
      return ''
    }

    // 清理 markdown 文本：移除 HTML 標籤和圖片引用，但保留表格結構
    let cleanText = markdownText
      // 移除 HTML 標籤
      .replace(/<[^>]+>/g, '')
      // 移除圖片引用格式 [alt text](image_url)
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // 移除圖片標籤
      .replace(/<img[^>]*>/gi, '')
      // 保留表格分隔符（|）和換行，這些有助於理解表格結構
      // 將多個空格壓縮為單個空格，但保留換行
      .replace(/[ \t]+/g, ' ')
      // 移除多餘的空白行（保留最多兩個連續換行）
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      // 清理行首行尾空白
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0) // 移除空行
      .join('\n')
      .trim()

    console.log('從 PaddleOCR markdown 中提取文字，長度：', cleanText.length)
    
    return cleanText

  } catch (error) {
    console.error('提取 PaddleOCR 文字異常：', error)
    return ''
  }
}

/**
 * 使用文心一言整理考程表
 * 使用百度千帆平台文心一言 API (chat/completions)
 */
/**
 * 根據組別過濾科目
 */
function filterSubjectsByStream(schedules: ScheduleItem[], stream: 'science' | 'arts' | 'general'): ScheduleItem[] {
  if (stream === 'general') {
    // 不分組：保留所有科目
    return schedules
  }
  
  // 定義需要過濾的科目關鍵字（僅限選修）
  const scienceElectiveSubjects = ['物選', '化選', '生選', '物理選修', '化學選修', '生物選修']
  const artsElectiveSubjects = ['歷選', '地選', '文選', '歷史選修', '地理選修', '文學選修']
  const commonSubjects = ['中文', '英文', '數學', '公民', '社會', '資訊', '人工智能', '文法', '英讀', '數閱']
  
  return schedules.filter(schedule => {
    const subject = schedule.subject || ''
    
    // 共同科目：所有組別都保留
    if (commonSubjects.some(common => subject.includes(common))) {
      return true
    }
    
    // 檢查是否為選修科目（包含"選"、"選修"等關鍵字）
    const isElective = subject.includes('選修') || 
                       subject.includes('選') ||
                       scienceElectiveSubjects.some(elective => subject.includes(elective)) ||
                       artsElectiveSubjects.some(elective => subject.includes(elective))
    
    // 檢查是否為必修科目（明確標註"必修"）
    const isRequired = subject.includes('必修')
    
    // 如果明確標註為必修，保留（文理組都要考）
    if (isRequired) {
      console.log(`✅ 保留必修科目 "${subject}"（文理組都要考）`)
      return true
    }
    
    // 如果既不是明確的必修，也不是明確的選修，可能是必修（預設為必修），保留
    if (!isElective && !isRequired) {
      // 可能是必修科目（沒有明確標註），保留
      return true
    }
    
    // 處理選修科目：根據組別過濾
    if (stream === 'science') {
      // 理組：過濾文組選修科目，保留理組選修科目
      const isArtsElective = artsElectiveSubjects.some(art => subject.includes(art))
      
      if (isArtsElective) {
        console.log(`⚠️ 理組過濾：移除文組選修科目 "${subject}"`)
        return false
      }
      
      // 保留理組選修科目
      return true
    } else if (stream === 'arts') {
      // 文組：過濾理組選修科目，保留文組選修科目
      const isScienceElective = scienceElectiveSubjects.some(sci => subject.includes(sci))
      
      if (isScienceElective) {
        console.log(`⚠️ 文組過濾：移除理組選修科目 "${subject}"`)
        return false
      }
      
      // 保留文組選修科目
      return true
    }
    
    return true
  })
}

async function organizeScheduleWithErnie(apiKey: string, ocrText: string, stream: 'science' | 'arts' | 'general' = 'general'): Promise<ScheduleItem[] | null> {
  try {
    // 根據組別構建科目過濾規則
    let subjectFilterRules = '';
    if (stream === 'science') {
      subjectFilterRules = `
**規則 1：科目過濾（理組）- 極其重要！**
- **必須保留的科目：**
  - 共同核心科目：中文、英文、數學、公民/社會
  - 理組選修科目：物選、化選、生選、物理選修、化學選修、生物選修
  - **必修科目（文理組都要考）：** 物理必修、化學必修、生物必修、歷史必修、地理必修等所有必修科目
  
- **必須完全刪除/忽略的科目（絕對不能出現在結果中）：**
  - 文組選修科目：歷選、地選、文選、歷史選修、地理選修、文學選修
  - 其他不相關科目：視藝、音樂、體育等（除非是共同必修）
  
- **⚠️ 極其嚴格的要求：**
  1. **必修科目必須保留**：無論是"物理必修"、"化學必修"、"歷史必修"、"地理必修"等，所有必修科目都必須保留，因為文理組都要考
  2. 如果 OCR 結果中包含"歷選"、"地選"、"文選"、"歷史選修"、"地理選修"等文組選修科目，必須完全忽略，絕對不要出現在最終 JSON 結果中
  3. 只返回理組選修科目、共同科目和所有必修科目
  4. 這是硬性規則，沒有任何例外！`;
    } else if (stream === 'arts') {
      subjectFilterRules = `
**規則 1：科目過濾（文組）- 極其重要！**
- **必須保留的科目：**
  - 共同核心科目：中文、英文、數學、公民/社會
  - 文組選修科目：歷選、地選、文選、歷史選修、地理選修、文學選修
  - **必修科目（文理組都要考）：** 物理必修、化學必修、生物必修、歷史必修、地理必修等所有必修科目
  
- **必須完全刪除/忽略的科目（絕對不能出現在結果中）：**
  - 理組選修科目：物選、化選、生選、物理選修、化學選修、生物選修
  - 其他不相關科目：視藝、音樂、體育等（除非是共同必修）
  
- **⚠️ 極其嚴格的要求：**
  1. **必修科目必須保留**：無論是"物理必修"、"化學必修"、"歷史必修"、"地理必修"等，所有必修科目都必須保留，因為文理組都要考
  2. 如果 OCR 結果中包含"物選"、"化選"、"生選"、"物理選修"、"化學選修"、"生物選修"等理組選修科目，必須完全忽略，絕對不要出現在最終 JSON 結果中
  3. 只返回文組選修科目、共同科目和所有必修科目
  4. 這是硬性規則，沒有任何例外！`;
    } else {
      subjectFilterRules = `
**規則 1：科目過濾（不分組）**
- **保留所有科目：** 中文、英文、數學、物理、化學、生物、歷史、地理、公民、資訊、人工智能等
- 不分組模式適用於初中或高一，保留所有科目。`;
    }

    // 構建改進的提示詞，專門處理表格格式的考程表
    const prompt = `你是一個專業的教務助理，擅長解析考試時間表。請根據 OCR 文字識別結果和用戶的組別 (stream: ${stream}) 整理考試時間表。

${subjectFilterRules}

**規則 2：區分測驗與考試（嚴格分類）**
- **exam_type: 'test'（測驗）** - 必須包含以下關鍵字之一：
  - "測驗"、"小測"、"大測"、"默書"、"UT"、"Quiz"、"測"
  - **重要：** "大測" 必須歸類為 'test'（測驗），不是考試
  - 如果文字中包含這些關鍵字，必須設定為 'test'
  
- **exam_type: 'exam'（考試）** - 必須包含以下關鍵字之一：
  - "考試"、"大考"、"期中考"、"期末考"、"Exam"
  - **注意：** "大測" 不是考試，是測驗（test）
  - 如果文字中包含這些關鍵字，必須設定為 'exam'
  
- **預設規則：** 如果無法明確判斷，預設為 'test'

**規則 3：日期和時間處理**
- 日期處理：
  - 如果OCR結果中只有月日（如"11月24日"），請根據當前日期推斷年份（2024或2025）
  - 如果OCR結果中有完整日期，請直接使用
  - 日期格式必須轉換為 YYYY-MM-DD（如：2024-11-24）

- 時間處理：
  - 如果明確標註"上午"，使用 "09:00"
  - 如果明確標註"下午"，使用 "14:00"
  - 如果有具體時間（如"09:30"），直接使用
  - 如果沒有時間信息，使用 "00:00"

**規則 4：科目名稱清理**
- 移除多餘的描述詞（如"大測"、"考試"等，這些用於判斷 exam_type）
- 保留核心科目名稱（如：數學、英文、中文、物理、化學、生物、歷史、地理、公民、資訊、人工智能等）
- 如果是選修科目，保留"選"字（如：化選、歷選、地選、物選、生選）

**規則 5：忽略項目**
- 放假信息（如：校慶補假、冬至放假、聖誕節放假、元旦放假、回歸放假等）
- 報告類項目（如：公民報告、數學報告等，這些不是考試）

**OCR 識別結果：**
${ocrText}

**請仔細分析上述OCR結果，嚴格按照組別過濾科目，並精準分類測驗與考試，回傳純 JSON 陣列格式：**

[
  {
    "subject": "數學",
    "exam_date": "2024-11-26",
    "exam_time": "09:00",
    "exam_type": "test"
  },
  {
    "subject": "物理",
    "exam_date": "2024-11-27",
    "exam_time": "14:00",
    "exam_type": "exam"
  }
]

**嚴格要求：**
- 只提取考試和測驗項目，忽略報告和放假信息
- 根據組別 (${stream}) 嚴格過濾科目，不要包含不相關的科目
- 仔細尋找關鍵字來區分測驗 ('test') 和考試 ('exam')
- 確保每個項目都有完整的 subject、exam_date、exam_time、exam_type
- 日期必須是 YYYY-MM-DD 格式
- 時間必須是 HH:MM 格式
- 只回傳純 JSON 陣列，不要有任何其他文字、Markdown 或說明`

    // 使用千帆平台 API (與 ask-ai 函數相同的方式)
    const ernieUrl = 'https://qianfan.baidubce.com/v2/chat/completions'
    
    const requestBody = {
      model: 'ernie-4.5-turbo-128k',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // 降低溫度以提高準確性
      max_tokens: 4000, // 增加最大token數以處理更多考試項目
      stream: false
    }

    console.log('正在調用千帆平台 API，URL:', ernieUrl)
    console.log('API Key 前綴:', apiKey?.substring(0, 10) + '...')
    console.log('請求體大小:', JSON.stringify(requestBody).length, 'bytes')

    // 千帆平台使用 Bearer Token 認證
    // apiKey 應該是 bce-v3/xxx 格式的 API Key
    const response = await fetch(ernieUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('API 響應狀態:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 文心一言 API 錯誤：', response.status, response.statusText)
      console.error('錯誤詳情：', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
        console.error('錯誤數據：', errorData)
      } catch {
        console.error('無法解析錯誤響應為 JSON')
      }
      
      // 如果失敗，嘗試使用簡化解析
      console.log('⚠️ 文心一言 API 調用失敗，使用備用解析方案')
      return await parseScheduleSimple(ocrText, stream)
    }

    const data = await response.json()
    console.log('✅ 文心一言 API 響應成功')
    
    // 處理千帆平台 API 的回應格式（與 ask-ai 函數保持一致）
    let content = ''
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      // OpenAI 兼容格式：{ choices: [{ message: { content: "..." } }] }（優先檢查）
      content = data.choices[0].message.content
      console.log('使用 OpenAI 兼容格式 (choices)，內容長度：', content.length)
    } else if (data.result) {
      // 千帆平台格式：{ result: "..." }
      content = data.result
      console.log('使用千帆平台格式 (result)，內容長度：', content.length)
    } else {
      console.error('❌ 未知的 API 回應格式：', JSON.stringify(data).substring(0, 500))
      return await parseScheduleSimple(ocrText, stream)
    }

    // 嘗試解析 JSON（可能包含 markdown 代碼塊）
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[0]
      try {
        const schedules = JSON.parse(jsonStr)
        if (Array.isArray(schedules)) {
          // 根據組別過濾科目
          const filteredSchedules = filterSubjectsByStream(schedules, stream)
          return filteredSchedules
        }
      } catch (parseError) {
        console.error('JSON 解析失敗：', parseError)
      }
    }

    // 直接嘗試解析整個內容
    try {
      const schedules = JSON.parse(content)
      if (Array.isArray(schedules)) {
        // 根據組別過濾科目
        const filteredSchedules = filterSubjectsByStream(schedules, stream)
        return filteredSchedules
      }
    } catch (parseError) {
      console.error('直接解析失敗：', parseError)
    }

    // 如果都失敗，使用簡化解析
    return await parseScheduleSimple(ocrText, stream)

  } catch (error) {
    console.error('使用文心一言整理考程表異常：', error)
    // 如果失敗，使用簡化解析作為備用方案
    return await parseScheduleSimple(ocrText, stream)
  }
}

/**
 * 簡化解析考程表（備用方案）
 * 當 AI 解析失敗時使用，嘗試從 OCR 文字中提取基本資訊
 * 改進版本：更好地處理表格格式和中文日期
 */
async function parseScheduleSimple(ocrText: string, stream: 'science' | 'arts' | 'general' = 'general'): Promise<ScheduleItem[] | null> {
  try {
    console.log('⚠️ 使用備用方案：改進的簡單解析 OCR 文字')
    
    const lines = ocrText.split('\n').filter(line => line.trim())
    const schedules: ScheduleItem[] = []
    
    // 改進的日期模式：支持中文日期格式（如：11月24日、12月4日）
    const chineseDatePattern = /(\d{1,2})月(\d{1,2})日/
    const numericDatePattern = /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)|(\d{1,2}[-/月]\d{1,2}[日]?)/
    const timePattern = /(\d{1,2}[:：]\d{2})|(上午|下午)/
    
    // 科目關鍵字（擴展列表）
    const subjectKeywords = [
      '數學', '英文', '中文', '物理', '化學', '生物', '歷史', '地理', '公民', 
      '資訊', '人工智能', '文法', '英讀', '數閱',
      '化選', '歷選', '地選', '物選', '生選', '文選'
    ]
    
    // 考試類型關鍵字
    const testKeywords = ['測驗', '大測', '測']
    const examKeywords = ['考試', '考']
    
    let currentDate = ''
    let currentTime = ''
    let currentWeek = ''
    
    // 獲取當前年份（用於補全年份）
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // 1. 嘗試提取周次信息（如：第13周）
      const weekMatch = line.match(/第(\d+)周/)
      if (weekMatch) {
        currentWeek = weekMatch[1]
        continue
      }
      
      // 2. 嘗試提取中文日期（優先）
      const chineseDateMatch = line.match(chineseDatePattern)
      if (chineseDateMatch) {
        const month = parseInt(chineseDateMatch[1])
        const day = parseInt(chineseDateMatch[2])
        
        // 判斷年份（如果月份小於當前月份，可能是明年）
        let year = currentYear
        if (month < currentMonth) {
          year = currentYear + 1
        }
        
        currentDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        console.log(`提取到日期：${currentDate} (從 ${month}月${day}日)`)
      }
      
      // 3. 嘗試提取數字日期格式
      if (!currentDate) {
        const numericDateMatch = line.match(numericDatePattern)
        if (numericDateMatch) {
          let dateStr = numericDateMatch[0]
          // 處理中文格式
          dateStr = dateStr.replace(/年|月/g, '-').replace(/日/g, '')
          // 標準化
          dateStr = dateStr.replace(/\//g, '-')
          const parts = dateStr.split('-').filter(p => p)
          
          if (parts.length >= 2) {
            let year = currentYear
            let month = parseInt(parts[0])
            let day = parseInt(parts[1])
            
            // 如果有年份
            if (parts.length === 3 && parts[0].length === 4) {
              year = parseInt(parts[0])
              month = parseInt(parts[1])
              day = parseInt(parts[2])
            } else {
              // 判斷年份
              if (month < currentMonth) {
                year = currentYear + 1
              }
            }
            
            currentDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          }
        }
      }
      
      // 4. 嘗試提取時間
      const timeMatch = line.match(timePattern)
      if (timeMatch) {
        if (timeMatch[1]) {
          // 數字時間格式
          currentTime = timeMatch[1].replace('：', ':')
          const timeParts = currentTime.split(':')
          if (timeParts.length === 2) {
            timeParts[0] = timeParts[0].padStart(2, '0')
            timeParts[1] = timeParts[1].padStart(2, '0')
            currentTime = timeParts.join(':')
          }
        } else if (timeMatch[2]) {
          // 中文時間格式
          currentTime = timeMatch[2] === '上午' ? '09:00' : '14:00'
        }
      }
      
      // 5. 嘗試識別科目和考試類型
      // 檢查是否包含科目關鍵字
      const hasSubject = subjectKeywords.some(keyword => line.includes(keyword))
      // 檢查是否包含考試類型關鍵字
      const hasTest = testKeywords.some(keyword => line.includes(keyword))
      const hasExam = examKeywords.some(keyword => line.includes(keyword))
      
      // 排除報告和放假信息
      const isReport = line.includes('報告')
      const isHoliday = line.includes('放假') || line.includes('補假') || line.includes('假期')
      
      if ((hasTest || hasExam) && !isReport && !isHoliday) {
        // 清理科目名稱
        let subject = line.trim()
        
        // 移除考試類型描述詞
        testKeywords.forEach(kw => {
          subject = subject.replace(new RegExp(kw, 'g'), '')
        })
        examKeywords.forEach(kw => {
          subject = subject.replace(new RegExp(kw, 'g'), '')
        })
        
        // 移除其他描述詞
        subject = subject.replace(/大|必修|選修|選|測|考/g, '').trim()
        
        // 如果清理後為空，使用原始行（但移除多餘描述）
        if (!subject || subject.length < 1) {
          subject = line.replace(/大測|測驗|考試|測|考/g, '').trim()
        }
        
        // 如果還是為空，跳過
        if (!subject || subject.length < 1) {
          continue
        }
        
        // 判斷考試類型
        const examType = hasTest ? 'test' : 'exam'
        
        // 使用當前日期，如果沒有則使用今天
        const examDate = currentDate || new Date().toISOString().split('T')[0]
        
        schedules.push({
          subject: subject,
          exam_date: examDate,
          exam_time: currentTime || '00:00',
          exam_type: examType as 'test' | 'exam'
        })
        
        console.log(`提取到考試：${subject} - ${examDate} ${currentTime || '00:00'} (${examType})`)
        
        // 重置時間（每個科目可能有不同時間）
        currentTime = ''
      }
    }
    
    if (schedules.length > 0) {
      // 根據組別過濾科目
      const filteredSchedules = filterSubjectsByStream(schedules, stream)
      console.log(`✅ 簡化解析成功，提取到 ${schedules.length} 項考試，過濾後剩餘 ${filteredSchedules.length} 項`)
      return filteredSchedules
    }
    
    console.log('⚠️ 簡化解析未找到任何考試項目')
    return null

  } catch (error) {
    console.error('簡化解析異常：', error)
    return null
  }
}

