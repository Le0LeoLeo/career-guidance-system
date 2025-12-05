# Edge Function 錯誤排查指南

## 🔴 錯誤：Failed to send a request to the Edge Function

這個錯誤表示無法連接到 Supabase Edge Function。請按照以下步驟排查：

## 📋 快速診斷步驟

### 步驟 1：檢查瀏覽器 Console

1. 打開瀏覽器開發者工具（按 F12）
2. 切換到 **Console** 標籤
3. 查看是否有診斷訊息：
   - ✅ `✅ Edge Function 連接正常` - 表示連接正常
   - ❌ `❌ Edge Function 連接失敗` - 表示有問題

### 步驟 2：檢查 Network 請求

1. 在開發者工具中切換到 **Network** 標籤
2. 發送一條測試訊息
3. 查找對 `ask-ai` 的請求
4. 檢查請求狀態：
   - **404** - Function 未部署
   - **401/403** - 認證失敗
   - **500** - Function 內部錯誤
   - **CORS 錯誤** - 跨域問題

## 🔧 常見問題與解決方案

### 問題 1：Edge Function 未部署（404 錯誤）

**症狀：**
- Console 顯示：`❌ Edge Function 連接失敗：404`
- Network 請求返回 404

**解決方案：**

1. **確認 Supabase CLI 已安裝並登入**
   ```bash
   supabase --version
   supabase login
   ```

2. **確認專案已連結**
   ```bash
   supabase link --project-ref naqyczuuariosniudbsr
   ```

3. **部署 Edge Function**
   ```bash
   supabase functions deploy ask-ai
   ```

4. **確認部署成功**
   ```bash
   supabase functions list
   ```
   應該看到 `ask-ai` 在列表中

### 問題 2：認證失敗（401/403 錯誤）

**症狀：**
- Console 顯示認證錯誤
- Network 請求返回 401 或 403

**解決方案：**

1. **檢查 Supabase 配置**
   打開 `app.js`，確認：
   ```javascript
   const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
   const SUPABASE_ANON_KEY = 'your_anon_key_here';
   ```

2. **確認 Anon Key 正確**
   - 前往 Supabase Dashboard
   - Settings → API
   - 複製 `anon public` key
   - 更新 `app.js` 中的 `SUPABASE_ANON_KEY`

3. **檢查 RLS 政策（如果適用）**
   - 確認 Edge Functions 不需要額外的 RLS 政策
   - Edge Functions 使用 Service Role Key，不受 RLS 限制

### 問題 3：Function 內部錯誤（500 錯誤）

**症狀：**
- Network 請求返回 500
- Console 顯示伺服器錯誤

**解決方案：**

1. **查看 Function 日誌**
   ```bash
   supabase functions logs ask-ai --follow
   ```

2. **檢查環境變數**
   ```bash
   supabase secrets list
   ```
   確認 `BAIDU_API_KEY` 已設置

3. **重新設置環境變數（如果需要）**
   ```bash
   # 方式 1：千帆平台 API Key（推薦）
   supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

   # 方式 2：OAuth 2.0
   supabase secrets set BAIDU_API_KEY=your_api_key
   supabase secrets set BAIDU_SECRET_KEY=your_secret_key
   ```

4. **重新部署 Function**
   ```bash
   supabase functions deploy ask-ai
   ```

### 問題 4：網路連接問題

**症狀：**
- Console 顯示網路錯誤
- 請求超時或無法連接

**解決方案：**

1. **檢查網路連線**
   - 確認可以訪問其他網站
   - 確認可以訪問 Supabase Dashboard

2. **檢查防火牆/代理**
   - 確認沒有阻擋對 Supabase 的請求
   - 檢查公司網路是否有代理設置

3. **測試 Supabase 連接**
   在瀏覽器 Console 中執行：
   ```javascript
   // 測試 Supabase 連接
   supabase.from('_test').select('*').limit(1)
     .then(() => console.log('✅ Supabase 連接正常'))
     .catch(err => console.error('❌ Supabase 連接失敗：', err));
   ```

### 問題 5：CORS 錯誤

**症狀：**
- Console 顯示 CORS 相關錯誤
- Network 請求被阻止

**解決方案：**

1. **確認 Supabase 配置正確**
   - Edge Functions 預設支援 CORS
   - 如果仍有問題，檢查 Function 代碼

2. **檢查 Function 代碼**
   確認 `supabase/functions/ask-ai/index.ts` 中有 CORS headers：
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

## 🧪 手動測試步驟

### 測試 1：檢查 Supabase 初始化

在瀏覽器 Console 中執行：
```javascript
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Client:', supabase);
```

應該看到：
- ✅ Supabase URL 正確
- ✅ Supabase Client 已初始化

### 測試 2：手動調用 Edge Function

在瀏覽器 Console 中執行：
```javascript
supabase.functions.invoke('ask-ai', {
  body: { prompt: '測試', history: [] }
}).then(({ data, error }) => {
  if (error) {
    console.error('❌ 錯誤：', error);
  } else {
    console.log('✅ 成功：', data);
  }
});
```

### 測試 3：檢查 Function 是否部署

在終端執行：
```bash
supabase functions list
```

應該看到 `ask-ai` 在列表中。

## 📝 完整部署檢查清單

- [ ] Supabase CLI 已安裝
- [ ] 已登入 Supabase CLI
- [ ] 專案已連結（`supabase link`）
- [ ] Edge Function 代碼存在（`supabase/functions/ask-ai/index.ts`）
- [ ] 環境變數已設置（`supabase secrets set`）
- [ ] Edge Function 已部署（`supabase functions deploy ask-ai`）
- [ ] `app.js` 中的 Supabase URL 正確
- [ ] `app.js` 中的 Supabase Anon Key 正確
- [ ] 瀏覽器可以訪問 Supabase（無防火牆阻擋）

## 🚀 快速修復指令

如果以上步驟都檢查過，執行以下指令重新部署：

```bash
# 1. 確認專案連結
supabase link --project-ref naqyczuuariosniudbsr

# 2. 設置環境變數（替換為您的實際 API Key）
supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

# 3. 部署 Function
supabase functions deploy ask-ai

# 4. 查看日誌確認
supabase functions logs ask-ai
```

## 📞 獲取更多幫助

如果問題仍然存在：

1. **查看詳細日誌**
   ```bash
   supabase functions logs ask-ai --follow
   ```

2. **檢查 Supabase Dashboard**
   - 前往 https://supabase.com/dashboard
   - 選擇您的專案
   - 查看 Edge Functions 頁面

3. **檢查 Function 代碼**
   - 確認 `supabase/functions/ask-ai/index.ts` 沒有語法錯誤
   - 確認所有依賴都已正確導入

## ✅ 成功標誌

當一切正常時，您應該看到：

1. **瀏覽器 Console：**
   ```
   🔍 檢查 Edge Function 連接狀態...
   ✅ Edge Function 連接正常
   ```

2. **發送訊息時：**
   - 用戶訊息顯示在右側
   - AI 思考動畫顯示
   - AI 回覆顯示在左側
   - 無錯誤訊息

3. **Network 標籤：**
   - 對 `ask-ai` 的請求返回 200
   - 回應包含 `response` 欄位

---

**提示：** 如果問題持續存在，請將 Console 和 Network 標籤的錯誤訊息截圖，這將有助於進一步診斷問題。



