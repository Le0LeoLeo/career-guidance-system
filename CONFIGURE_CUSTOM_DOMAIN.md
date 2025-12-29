# 配置 Supabase 自定義域名（sage.網域）

本指南將幫助您將 Supabase 從 localhost 或雲端 URL 變更為自定義域名（sage.網域）。

## 📋 前置需求

1. 擁有自定義域名（例如：`sage.example.com`）
2. 能夠管理域名的 DNS 設定
3. Supabase 專案的管理權限

## 🔧 步驟 1：在 Supabase Dashboard 配置自定義域名

### 1.1 進入 Supabase 專案設定

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 前往 **Settings** → **API**
4. 找到 **Custom Domain** 區塊

### 1.2 設定自定義域名

1. 點擊 **Add Custom Domain** 或 **Configure Custom Domain**
2. 輸入您的域名（例如：`sage.example.com`）
3. Supabase 會提供需要設定的 DNS 記錄

### 1.3 配置 DNS 記錄

在您的域名管理後台（例如：Cloudflare、GoDaddy、Namecheap 等）添加以下 DNS 記錄：

**CNAME 記錄：**
```
類型: CNAME
名稱: sage (或您想要的子域名)
值: [Supabase 提供的目標地址]
TTL: 3600 (或自動)
```

**或 A 記錄（如果 Supabase 要求）：**
```
類型: A
名稱: sage
值: [Supabase 提供的 IP 地址]
TTL: 3600
```

### 1.4 等待 DNS 傳播

- DNS 記錄通常需要 5-60 分鐘才能生效
- 可以使用 [DNS Checker](https://dnschecker.org) 檢查 DNS 傳播狀態
- Supabase Dashboard 會顯示域名驗證狀態

### 1.5 SSL 憑證自動配置

Supabase 會自動為您的自定義域名配置 SSL 憑證（Let's Encrypt），通常需要 5-15 分鐘。

## 🔄 步驟 2：更新應用程式中的 Supabase URL

### 2.1 更新 `app.js`

找到並修改 `app.js` 中的 Supabase URL：

```javascript
// 舊的配置
const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';

// 新的配置（使用自定義域名）
const SUPABASE_URL = 'https://sage.example.com'; // 替換為您的實際域名
```

### 2.2 更新其他配置文件

檢查並更新以下文件中的 Supabase URL：

1. **`test-ai-functionality.js`**
   ```javascript
   const SUPABASE_URL = 'https://sage.example.com';
   ```

2. **`fix-database-field.js`**
   ```javascript
   const SUPABASE_URL = 'https://sage.example.com';
   ```

3. **`add-majors-tool.html`**（如果使用）
   ```javascript
   const SUPABASE_URL = 'https://sage.example.com';
   ```

4. **`diagnose-ai-target-issue.js`**（如果使用）
   - 檢查環境變數或配置

### 2.3 更新測試文件

如果測試文件中有硬編碼的 Supabase URL，也需要更新：

- `test\app.test.js`
- `test\setup.js`
- 其他測試相關文件

## 🔐 步驟 3：確認 Supabase Anon Key

**重要：** 自定義域名不會改變您的 API Key！

- `SUPABASE_ANON_KEY` 保持不變
- 不需要重新生成 API Key
- 只需要更新 URL 即可

## 🌐 步驟 4：更新 Supabase Auth 重定向 URL

### 4.1 更新 Site URL

1. 前往 Supabase Dashboard → **Authentication** → **URL Configuration**
2. 更新 **Site URL**：
   ```
   舊: http://localhost:8000
   新: https://sage.example.com (或您的應用域名)
   ```

### 4.2 更新 Redirect URLs

在 **Redirect URLs** 中添加：

```
https://sage.example.com
https://sage.example.com/*
http://localhost:8000 (保留用於本地開發)
```

**重要：**
- 保留 `localhost:8000` 用於本地開發
- 添加生產環境的自定義域名
- 使用萬用字元 `/*` 匹配所有路徑

## 🚀 步驟 5：更新 Edge Function 配置（如果需要）

Edge Function 通常會自動使用正確的 Supabase URL，但如果您有硬編碼的 URL，需要檢查：

### 5.1 檢查 Edge Function

檢查 `supabase/functions/ask-ai/index.ts` 和 `supabase/functions/process-schedule/index.ts`：

- Edge Function 通常從環境變數或請求頭獲取 Supabase URL
- 不需要手動修改，因為 Supabase 會自動注入正確的 URL

### 5.2 重新部署 Edge Function（可選）

如果修改了 Edge Function，重新部署：

```bash
supabase functions deploy ask-ai
supabase functions deploy process-schedule
```

## ✅ 步驟 6：驗證配置

### 6.1 測試 Supabase 連接

1. 打開瀏覽器開發者工具（F12）
2. 前往 Console
3. 執行以下代碼：

```javascript
// 測試 Supabase 連接
const testUrl = 'https://sage.example.com'; // 您的自定義域名
fetch(testUrl, { method: 'HEAD' })
  .then(() => console.log('✅ Supabase URL 可訪問'))
  .catch(err => console.error('❌ 無法訪問:', err));
```

### 6.2 測試認證功能

1. 嘗試登入應用
2. 檢查瀏覽器 Network 標籤
3. 確認所有請求都使用新的域名

### 6.3 測試 AI 功能

1. 開啟 AI 助手
2. 發送測試訊息
3. 檢查 Edge Function 是否正常運作

## 🔍 故障排除

### 問題 1：DNS 未生效

**症狀：** 無法連接到自定義域名

**解決方案：**
1. 檢查 DNS 記錄是否正確設定
2. 等待更長時間（最多 24 小時）
3. 清除 DNS 快取：
   ```bash
   # Windows
   ipconfig /flushdns
   
   # macOS/Linux
   sudo dscacheutil -flushcache
   ```

### 問題 2：SSL 憑證未生效

**症狀：** 瀏覽器顯示 SSL 錯誤

**解決方案：**
1. 等待 Supabase 自動配置 SSL（5-15 分鐘）
2. 檢查 Supabase Dashboard 中的 SSL 狀態
3. 確認 DNS 記錄已正確設定

### 問題 3：認證重定向失敗

**症狀：** 登入後無法重定向

**解決方案：**
1. 檢查 Supabase Dashboard → Authentication → URL Configuration
2. 確認 Redirect URLs 包含新的域名
3. 確認 Site URL 已更新

### 問題 4：Edge Function 無法連接

**症狀：** AI 功能無法運作

**解決方案：**
1. 檢查 Edge Function 日誌：
   ```bash
   supabase functions logs ask-ai
   ```
2. 確認 Edge Function 使用環境變數而非硬編碼 URL
3. 重新部署 Edge Function

## 📝 檢查清單

完成以下檢查清單以確認配置正確：

- [ ] 在 Supabase Dashboard 中配置了自定義域名
- [ ] DNS 記錄已正確設定並生效
- [ ] SSL 憑證已自動配置
- [ ] 更新了 `app.js` 中的 `SUPABASE_URL`
- [ ] 更新了所有測試文件中的 Supabase URL
- [ ] 更新了 Supabase Auth 的 Site URL
- [ ] 更新了 Supabase Auth 的 Redirect URLs
- [ ] 測試了 Supabase 連接
- [ ] 測試了認證功能
- [ ] 測試了 AI 功能
- [ ] 本地開發環境仍可使用（localhost:8000）

## 🔄 回退方案

如果需要回退到原來的 Supabase URL：

1. 在 `app.js` 中恢復原來的 URL：
   ```javascript
   const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
   ```
2. 更新 Supabase Auth 的 URL 配置
3. 重新部署應用

## 📚 相關文件

- [Supabase 自定義域名文檔](https://supabase.com/docs/guides/platform/custom-domains)
- [Supabase Auth 配置](https://supabase.com/docs/guides/auth)
- [Edge Functions 部署指南](./SUPABASE_EDGE_FUNCTION_SETUP.md)

## ⚠️ 注意事項

1. **DNS 傳播時間**：DNS 記錄可能需要時間才能生效，請耐心等待
2. **SSL 憑證**：Supabase 會自動配置 SSL，但需要一些時間
3. **本地開發**：建議保留 `localhost:8000` 用於本地開發
4. **API Key 不變**：自定義域名不會改變您的 API Key
5. **備份配置**：在更改前，建議備份當前的配置

---

**完成後，您的應用將使用自定義域名 `sage.example.com` 連接到 Supabase！**






