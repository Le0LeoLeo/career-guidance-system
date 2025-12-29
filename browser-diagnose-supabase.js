/**
 * 瀏覽器診斷腳本：檢查 Supabase 連接問題
 * 
 * 使用方法：
 * 1. 打開瀏覽器開發者工具（F12）
 * 2. 切換到 Console 標籤
 * 3. 複製並貼上此腳本的所有內容
 * 4. 按 Enter 執行
 * 
 * 或者：
 * 在 Console 中輸入：diagnoseSupabaseConnection()
 */

async function diagnoseSupabaseConnection() {
  console.log('🔍 開始診斷 Supabase 連接問題...\n')
  console.log('='.repeat(60))
  
  const results = {
    supabaseClient: false,
    supabaseUrl: false,
    supabaseKey: false,
    networkConnection: false,
    cors: false,
    authentication: false,
    databaseAccess: false,
    edgeFunctions: false
  }
  
  // 檢查 1: Supabase URL 和 Key 配置
  console.log('\n📋 檢查 1: Supabase 配置')
  console.log('-'.repeat(60))
  
  let supabaseUrl, supabaseKey
  
  // 嘗試從全域變數獲取
  if (typeof SUPABASE_URL !== 'undefined') {
    supabaseUrl = SUPABASE_URL
    console.log('✅ 找到 SUPABASE_URL:', supabaseUrl)
    results.supabaseUrl = true
  } else {
    console.error('❌ SUPABASE_URL 未定義')
    console.log('💡 請檢查 app.js 中是否有定義 SUPABASE_URL')
  }
  
  if (typeof SUPABASE_ANON_KEY !== 'undefined') {
    supabaseKey = SUPABASE_ANON_KEY
    console.log('✅ 找到 SUPABASE_ANON_KEY (長度:', supabaseKey.length, ')')
    results.supabaseKey = true
  } else {
    console.error('❌ SUPABASE_ANON_KEY 未定義')
    console.log('💡 請檢查 app.js 中是否有定義 SUPABASE_ANON_KEY')
  }
  
  // 檢查 2: Supabase 客戶端
  console.log('\n📋 檢查 2: Supabase 客戶端初始化')
  console.log('-'.repeat(60))
  
  if (typeof supabase === 'undefined' || !supabase) {
    console.error('❌ Supabase 客戶端未初始化')
    console.log('💡 可能的原因：')
    console.log('   1. Supabase SDK 尚未載入')
    console.log('   2. DOMContentLoaded 事件尚未觸發')
    console.log('   3. 初始化代碼有錯誤')
    
    // 嘗試手動初始化
    if (supabaseUrl && supabaseKey) {
      console.log('\n   嘗試手動初始化 Supabase...')
      try {
        if (typeof window !== 'undefined' && window.supabase) {
          supabase = window.supabase.createClient(supabaseUrl, supabaseKey)
          console.log('   ✅ 手動初始化成功')
          results.supabaseClient = true
        } else if (typeof supabase !== 'undefined') {
          supabase = supabase.createClient(supabaseUrl, supabaseKey)
          console.log('   ✅ 手動初始化成功')
          results.supabaseClient = true
        } else {
          console.error('   ❌ 無法初始化：Supabase SDK 未載入')
          console.log('   💡 請確認 index.html 中已載入 Supabase SDK')
        }
      } catch (error) {
        console.error('   ❌ 初始化失敗：', error.message)
      }
    }
  } else {
    console.log('✅ Supabase 客戶端已初始化')
    results.supabaseClient = true
  }
  
  // 檢查 3: 網路連接
  console.log('\n📋 檢查 3: 網路連接')
  console.log('-'.repeat(60))
  
  if (supabaseUrl) {
    try {
      console.log('   測試連接到:', supabaseUrl)
      const response = await fetch(supabaseUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // 避免 CORS 問題影響測試
      })
      console.log('   ✅ 可以連接到 Supabase URL')
      results.networkConnection = true
    } catch (error) {
      console.error('   ❌ 無法連接到 Supabase URL')
      console.log('   錯誤：', error.message)
      console.log('   💡 可能的原因：')
      console.log('      1. 網路連接問題')
      console.log('      2. Supabase URL 不正確')
      console.log('      3. 防火牆或代理設定阻擋')
    }
  }
  
  // 檢查 4: CORS 設定
  console.log('\n📋 檢查 4: CORS 設定')
  console.log('-'.repeat(60))
  
  if (supabaseUrl && supabase) {
    try {
      console.log('   測試 Supabase API 調用...')
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        if (error.message?.includes('CORS') || error.message?.includes('cors')) {
          console.error('   ❌ CORS 錯誤：', error.message)
          console.log('   💡 解決方案：')
          console.log('      1. 前往 Supabase Dashboard → Settings → API')
          console.log('      2. 在 Additional Allowed Origins 中添加當前網域')
          console.log('      3. 當前網域：', window.location.origin)
        } else {
          console.log('   ⚠️  API 調用失敗（非 CORS 問題）：', error.message)
          console.log('   💡 這可能是正常的（例如：未登入時無法查詢）')
        }
      } else {
        console.log('   ✅ CORS 設定正確，可以正常調用 API')
        results.cors = true
        results.databaseAccess = true
      }
    } catch (error) {
      if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        console.error('   ❌ CORS 錯誤：', error.message)
        console.log('   💡 解決方案：')
        console.log('      1. 前往 Supabase Dashboard → Settings → API')
        console.log('      2. 在 Additional Allowed Origins 中添加：', window.location.origin)
      } else {
        console.error('   ❌ 測試失敗：', error.message)
      }
    }
  }
  
  // 檢查 5: 認證狀態
  console.log('\n📋 檢查 5: 認證狀態')
  console.log('-'.repeat(60))
  
  if (supabase) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log('   ⚠️  認證錯誤：', authError.message)
        console.log('   💡 這可能是正常的（如果用戶未登入）')
      } else if (user) {
        console.log('   ✅ 用戶已認證')
        console.log('      用戶ID：', user.id)
        console.log('      用戶郵箱：', user.email || '無')
        results.authentication = true
      } else {
        console.log('   ℹ️  用戶未登入（這是正常的，如果這是登入頁面）')
      }
    } catch (error) {
      console.error('   ❌ 檢查認證時發生錯誤：', error.message)
    }
  }
  
  // 檢查 6: Edge Function 連接
  console.log('\n📋 檢查 6: Edge Function 連接')
  console.log('-'.repeat(60))
  
  if (supabaseUrl && supabase) {
    try {
      console.log('   測試 Edge Function 連接...')
      const { data, error } = await supabase.functions.invoke('ask-ai', {
        body: { prompt: 'test', history: [] }
      })
      
      if (error) {
        if (error.message?.includes('Function not found') || error.message?.includes('404')) {
          console.error('   ❌ Edge Function 未找到')
          console.log('   💡 解決方案：')
          console.log('      1. 確認 Edge Function 已部署：supabase functions deploy ask-ai')
          console.log('      2. 檢查 Edge Function 名稱是否正確')
        } else {
          console.log('   ⚠️  Edge Function 調用失敗：', error.message)
          console.log('   💡 這可能是正常的（例如：需要認證或參數錯誤）')
        }
      } else {
        console.log('   ✅ Edge Function 可以正常連接')
        results.edgeFunctions = true
      }
    } catch (error) {
      console.log('   ⚠️  Edge Function 測試失敗：', error.message)
      console.log('   💡 這可能是正常的（如果 Edge Function 未部署或需要認證）')
    }
  }
  
  // 檢查 7: 瀏覽器控制台錯誤
  console.log('\n📋 檢查 7: 瀏覽器錯誤')
  console.log('-'.repeat(60))
  
  // 檢查常見錯誤
  const commonErrors = [
    'Failed to fetch',
    'CORS',
    'NetworkError',
    'TypeError',
    'ReferenceError',
    'Supabase',
    'supabase'
  ]
  
  console.log('   💡 請檢查 Console 標籤中是否有紅色錯誤訊息')
  console.log('   💡 常見錯誤類型：')
  commonErrors.forEach(err => {
    console.log('      -', err)
  })
  
  // 檢查 8: 頁面載入狀態
  console.log('\n📋 檢查 8: 頁面載入狀態')
  console.log('-'.repeat(60))
  
  console.log('   當前 URL：', window.location.href)
  console.log('   頁面狀態：', document.readyState)
  console.log('   Supabase SDK 載入：', typeof supabase !== 'undefined' ? '✅' : '❌')
  console.log('   Supabase URL 配置：', supabaseUrl ? '✅' : '❌')
  console.log('   Supabase Key 配置：', supabaseKey ? '✅' : '❌')
  
  // 總結
  console.log('\n' + '='.repeat(60))
  console.log('📊 診斷總結')
  console.log('='.repeat(60))
  
  const summary = {
    'Supabase URL 配置': results.supabaseUrl ? '✅' : '❌',
    'Supabase Key 配置': results.supabaseKey ? '✅' : '❌',
    'Supabase 客戶端': results.supabaseClient ? '✅' : '❌',
    '網路連接': results.networkConnection ? '✅' : '❌',
    'CORS 設定': results.cors ? '✅' : '⚠️',
    '資料庫存取': results.databaseAccess ? '✅' : '⚠️',
    '認證功能': results.authentication ? '✅' : '⚠️',
    'Edge Function': results.edgeFunctions ? '✅' : '⚠️'
  }
  
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`${key}: ${value}`)
  })
  
  // 提供解決方案
  console.log('\n💡 建議的解決步驟：')
  
  if (!results.supabaseUrl || !results.supabaseKey) {
    console.log('   1. ❗ 檢查 app.js 中的 SUPABASE_URL 和 SUPABASE_ANON_KEY 是否正確設定')
  }
  
  if (!results.supabaseClient) {
    console.log('   2. ❗ 確認 index.html 中已載入 Supabase SDK')
    console.log('      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>')
  }
  
  if (!results.networkConnection) {
    console.log('   3. ❗ 檢查網路連接和 Supabase URL 是否正確')
  }
  
  if (!results.cors) {
    console.log('   4. ❗ 前往 Supabase Dashboard → Settings → API')
    console.log('      在 Additional Allowed Origins 中添加：', window.location.origin)
  }
  
  if (!results.authentication) {
    console.log('   5. ℹ️  如果這是登入頁面，未認證是正常的')
    console.log('      如果已登入但仍顯示未認證，請檢查 Supabase Auth 設定')
  }
  
  if (!results.edgeFunctions) {
    console.log('   6. ℹ️  Edge Function 可能需要部署或認證')
    console.log('      執行：supabase functions deploy ask-ai')
  }
  
  console.log('\n📚 相關文件：')
  console.log('   - VERIFY_NETLIFY_SUPABASE.md')
  console.log('   - FIX_REDIRECT_URL.md')
  console.log('   - SUPABASE_SETUP.md')
  
  return results
}

// 自動執行（如果頁面已載入）
if (typeof window !== 'undefined' && document.readyState === 'complete') {
  console.log('✅ 頁面已載入，可以執行診斷')
  console.log('執行診斷請輸入: diagnoseSupabaseConnection()')
} else if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('✅ 頁面載入完成，可以執行診斷')
    console.log('執行診斷請輸入: diagnoseSupabaseConnection()')
  })
}

// 導出函數（如果在 Node.js 環境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = diagnoseSupabaseConnection
}






