# Edge Function 快速修復指南

## 🔴 錯誤：Failed to send a request to the Edge Function

如果您看到這個錯誤，請按照以下步驟快速修復：

## ⚡ 快速修復步驟（5 分鐘）

### 步驟 1：檢查 Edge Function 是否已部署

在終端執行：

```bash
supabase functions list
```

**如果看到 `ask-ai` 在列表中** → 跳到步驟 2  
**如果沒有看到 `ask-ai`** → 執行部署：

```bash
# 1. 確認已登入
supabase login

# 2. 確認專案已連結
supabase link --project-ref naqyczuuariosniudbsr

# 3. 部署 Edge Function
supabase functions deploy ask-ai
```

### 步驟 2：檢查環境變數

```bash
# 查看已設置的環境變數
supabase secrets list
```

**應該看到：**
- `BAIDU_API_KEY` ✅
- `BAIDU_SECRET_KEY` ✅（如果使用 OAuth 2.0）

**如果沒有，請設置：**

```bash
# 方式 1：千帆平台 API Key（推薦）
supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

# 方式 2：OAuth 2.0
supabase secrets set BAIDU_API_KEY=your_api_key
supabase secrets set BAIDU_SECRET_KEY=your_secret_key
```

### 步驟 3：重新部署（如果修改了環境變數）

```bash
supabase functions deploy ask-ai
```

### 步驟 4：測試 Edge Function

```bash
supabase functions invoke ask-ai \
  --body '{"prompt": "測試", "history": []}'
```

**如果成功** → 您應該看到 AI 的回應  
**如果失敗** → 查看錯誤訊息並參考下方故障排除

## 🔍 瀏覽器診斷

### 方法 1：使用內建診斷功能

1. 打開瀏覽器開發者工具（按 F12）
2. 切換到 **Console** 標籤
3. 查看是否有診斷訊息：
   - ✅ `✅ Edge Function 連接正常` - 一切正常
   - ❌ `❌ Edge Function 連接失敗` - 有問題，查看下方錯誤訊息

### 方法 2：手動診斷

在瀏覽器 Console 中執行：

```javascript
// 檢查 Supabase 配置
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Client:', supabase);

// 測試 Edge Function 連接
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

### 方法 3：使用診斷腳本

1. 打開 `diagnose-edge-function.js` 文件
2. 複製所有內容
3. 在瀏覽器 Console 中貼上並執行
4. 或直接執行：`diagnoseEdgeFunction()`

## 🐛 常見問題與解決方案

### 問題 1：404 錯誤 - Edge Function 未找到

**錯誤訊息：**
```
❌ Edge Function 連接失敗：404
```

**解決方案：**

```bash
# 1. 確認已登入
supabase login

# 2. 確認專案連結
supabase link --project-ref naqyczuuariosniudbsr

# 3. 部署 Edge Function
supabase functions deploy ask-ai

# 4. 確認部署成功
supabase functions list
```

### 問題 2：401/403 錯誤 - 認證失敗

**錯誤訊息：**
```
❌ Edge Function 連接失敗：401 或 403
```

**解決方案：**

1. **檢查 Supabase 配置**
   - 打開 `app.js`
   - 確認 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 正確
   - 從 Supabase Dashboard → Settings → API 獲取正確的 Anon Key

2. **確認用戶已登入**
   - 確保已使用 Google 登入
   - 檢查瀏覽器 Console 是否有認證錯誤

### 問題 3：500 錯誤 - 伺服器錯誤

**錯誤訊息：**
```
❌ Edge Function 連接失敗：500
```

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

3. **檢查百度 API 配置**
   - 確認 API Key 格式正確
   - 確認 API 配額未用完
   - 確認 API Key 有效

### 問題 4：網路錯誤 - Failed to fetch

**錯誤訊息：**
```
無法連接到 Edge Function
Failed to fetch
NetworkError
```

**解決方案：**

1. **檢查網路連線**
   - 確認可以訪問其他網站
   - 確認可以訪問 Supabase Dashboard

2. **檢查防火牆/代理**
   - 確認沒有阻擋對 Supabase 的請求
   - 檢查公司網路是否有代理設置

3. **檢查 CORS 設定**
   - Edge Function 已包含 CORS headers
   - 如果仍有問題，檢查瀏覽器 Console 的詳細錯誤

### 問題 5：百度 API 錯誤

**錯誤訊息：**
```
百度 API 配置未設定
無法獲取 Access Token
```

**解決方案：**

1. **設置環境變數**
   ```bash
   # 方式 1：千帆平台（推薦）
   supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key
   
   # 方式 2：OAuth 2.0
   supabase secrets set BAIDU_API_KEY=your_api_key
   supabase secrets set BAIDU_SECRET_KEY=your_secret_key
   ```

2. **重新部署**
   ```bash
   supabase functions deploy ask-ai
   ```

3. **驗證 API Key**
   - 確認 API Key 格式正確
   - 確認 API Key 有效且未過期

## ✅ 驗證修復成功

修復後，您應該看到：

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

## 🚀 完整部署檢查清單

- [ ] Supabase CLI 已安裝（`supabase --version`）
- [ ] 已登入 Supabase CLI（`supabase login`）
- [ ] 專案已連結（`supabase link --project-ref naqyczuuariosniudbsr`）
- [ ] Edge Function 代碼存在（`supabase/functions/ask-ai/index.ts`）
- [ ] 環境變數已設置（`supabase secrets list`）
- [ ] Edge Function 已部署（`supabase functions list`）
- [ ] `app.js` 中的 Supabase URL 正確
- [ ] `app.js` 中的 Supabase Anon Key 正確
- [ ] 瀏覽器可以訪問 Supabase（無防火牆阻擋）
- [ ] 測試 Edge Function 成功（`supabase functions invoke ask-ai`）

## 📞 需要更多幫助？

如果以上步驟都無法解決問題：

1. **查看詳細日誌**
   ```bash
   supabase functions logs ask-ai --follow
   ```

2. **檢查 Supabase Dashboard**
   - 前往 https://supabase.com/dashboard
   - 選擇您的專案
   - 查看 Edge Functions 頁面

3. **參考完整文檔**
   - `EDGE_FUNCTION_TROUBLESHOOTING.md` - 詳細故障排除
   - `SUPABASE_EDGE_FUNCTION_SETUP.md` - 完整設置指南

4. **檢查瀏覽器 Console 和 Network 標籤**
   - 截圖錯誤訊息
   - 查看 Network 請求詳情

---

**提示：** 大多數問題都是因為 Edge Function 未部署或環境變數未設置。按照上述步驟通常可以快速解決問題。

