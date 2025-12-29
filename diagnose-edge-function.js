/**
 * Edge Function 診斷腳本
 * 
 * 使用方法：
 * 1. 打開瀏覽器開發者工具（F12）
 * 2. 切換到 Console 標籤
 * 3. 複製並貼上此腳本的所有內容
 * 4. 按 Enter 執行
 * 
 * 或者：
 * 在 Console 中輸入：diagnoseEdgeFunction()
 */

async function diagnoseEdgeFunction() {
  console.log('🔍 開始診斷 Edge Function 連接...\n');
  
  // 檢查 1: Supabase 配置
  console.log('📋 檢查 1: Supabase 配置');
  if (typeof SUPABASE_URL === 'undefined') {
    console.error('❌ SUPABASE_URL 未定義');
    return;
  }
  if (typeof SUPABASE_ANON_KEY === 'undefined') {
    console.error('❌ SUPABASE_ANON_KEY 未定義');
    return;
  }
  console.log('✅ Supabase URL:', SUPABASE_URL);
  console.log('✅ Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  // 檢查 2: Supabase 客戶端
  console.log('\n📋 檢查 2: Supabase 客戶端');
  if (typeof supabase === 'undefined' || !supabase) {
    console.error('❌ Supabase 客戶端未初始化');
    console.log('💡 請確認頁面已完全載入，或重新整理頁面');
    return;
  }
  console.log('✅ Supabase 客戶端已初始化');
  
  // 檢查 3: 網路連接
  console.log('\n📋 檢查 3: 網路連接');
  try {
    const response = await fetch(SUPABASE_URL);
    console.log('✅ 可以連接到 Supabase（狀態碼：', response.status, '）');
  } catch (error) {
    console.error('❌ 無法連接到 Supabase:', error.message);
    console.log('💡 請檢查網路連線或防火牆設置');
    return;
  }
  
  // 檢查 4: Edge Function 端點
  console.log('\n📋 檢查 4: Edge Function 端點');
  const functionUrl = `${SUPABASE_URL}/functions/v1/ask-ai`;
  console.log('Function URL:', functionUrl);
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ prompt: 'test', history: [] })
    });
    
    console.log('請求狀態碼:', response.status);
    
    if (response.status === 404) {
      console.error('❌ Edge Function 未找到（404）');
      console.log('💡 解決方案：');
      console.log('   1. 確認已部署 Edge Function: supabase functions deploy ask-ai');
      console.log('   2. 確認 Function 名稱正確: ask-ai');
    } else if (response.status === 401 || response.status === 403) {
      console.error('❌ 認證失敗（', response.status, '）');
      console.log('💡 解決方案：');
      console.log('   1. 檢查 SUPABASE_ANON_KEY 是否正確');
      console.log('   2. 前往 Supabase Dashboard 獲取正確的 Anon Key');
    } else if (response.status === 500) {
      console.error('❌ 伺服器錯誤（500）');
      console.log('💡 解決方案：');
      console.log('   1. 查看 Function 日誌: supabase functions logs ask-ai');
      console.log('   2. 檢查環境變數是否設置: supabase secrets list');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ Edge Function 連接正常！');
      console.log('回應:', data);
    } else {
      console.warn('⚠️ 收到非預期的狀態碼:', response.status);
    }
  } catch (error) {
    console.error('❌ 無法連接到 Edge Function:', error.message);
    console.log('💡 可能的原因：');
    console.log('   1. 網路連線問題');
    console.log('   2. CORS 問題');
    console.log('   3. Function 未部署');
  }
  
  // 檢查 5: 使用 Supabase SDK 調用
  console.log('\n📋 檢查 5: 使用 Supabase SDK 調用');
  try {
    const { data, error } = await supabase.functions.invoke('ask-ai', {
      body: { prompt: 'test', history: [] }
    });
    
    if (error) {
      console.error('❌ SDK 調用失敗:', error);
      console.log('錯誤詳情:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ SDK 調用成功！');
      console.log('回應:', data);
    }
  } catch (error) {
    console.error('❌ SDK 調用異常:', error.message);
    console.log('異常詳情:', error.stack);
  }
  
  console.log('\n✅ 診斷完成！');
  console.log('\n📝 如果仍有問題，請：');
  console.log('   1. 檢查瀏覽器 Network 標籤中的請求詳情');
  console.log('   2. 查看 Supabase Function 日誌: supabase functions logs ask-ai');
  console.log('   3. 參考 EDGE_FUNCTION_TROUBLESHOOTING.md 文件');
}

// 自動執行診斷（如果頁面已載入）
if (typeof window !== 'undefined' && document.readyState === 'complete') {
  console.log('頁面已載入，可以執行診斷');
  console.log('執行診斷請輸入: diagnoseEdgeFunction()');
} else if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('頁面載入完成，可以執行診斷');
    console.log('執行診斷請輸入: diagnoseEdgeFunction()');
  });
}

// 導出函數（如果在 Node.js 環境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = diagnoseEdgeFunction;
}




