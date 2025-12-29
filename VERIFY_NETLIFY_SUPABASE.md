# ✅ 驗證 Netlify 與 Supabase 連接配置

您的應用已部署在 Netlify：**https://sage-lily-4d882e.netlify.app/**

本指南將幫助您確認 Supabase 已正確配置，可以與 Netlify 部署的應用正常運作。

## 🔍 快速檢查清單

### ✅ 步驟 1：確認 Supabase URL 配置

您的 `app.js` 中應該已經有正確的 Supabase URL：

```javascript
const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**✅ 這個配置是正確的！** Supabase URL 不需要更改，因為：
- Supabase URL 是雲端服務地址，不會因為部署到 Netlify 而改變
- 您的應用會從 Netlify 連接到 Supabase 雲端服務

### ✅ 步驟 2：配置 Supabase Auth 重定向 URL（重要！）

這是**最重要的步驟**，確保 Google 登入後能正確重定向回您的 Netlify 網站。

#### 2.1 前往 Supabase Dashboard

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案：`naqyczuuariosniudbsr`
3. 前往 **Authentication** → **URL Configuration**

#### 2.2 設定 Site URL

在 **Site URL** 欄位中，您可以設定：

**選項 A：使用 Netlify URL（推薦用於生產環境）**
```
https://sage-lily-4d882e.netlify.app
```

**選項 B：使用 localhost（用於本地開發）**
```
http://localhost:8000
```

**建議：** 如果您主要使用 Netlify 部署，可以設定為 Netlify URL。

#### 2.3 設定 Redirect URLs（必須！）

在 **Redirect URLs** 區域，點擊 **+ Add URL**，**確保包含以下所有 URL**：

```
http://localhost:8000
http://localhost:8000/*
https://sage-lily-4d882e.netlify.app
https://sage-lily-4d882e.netlify.app/*
```

**為什麼需要這些？**
- `localhost:8000` - 用於本地開發測試
- `sage-lily-4d882e.netlify.app` - 您的 Netlify 生產環境
- `/*` 結尾的 URL - 匹配所有路徑（例如：`/dashboard`, `/login` 等）

### ✅ 步驟 3：配置 Supabase CORS（如果需要）

如果遇到 CORS 錯誤，需要在 Supabase 中允許 Netlify 域名：

1. 前往 **Settings** → **API**
2. 找到 **Additional Allowed Origins** 或 **CORS** 設定
3. 添加您的 Netlify URL：
   ```
   https://sage-lily-4d882e.netlify.app
   ```

### ✅ 步驟 4：配置 Google OAuth（如果使用 Google 登入）

如果您的應用使用 Google 登入，需要在 Google Cloud Console 中配置：

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇您的專案
3. 前往 **APIs & Services** → **Credentials**
4. 找到您的 OAuth 2.0 客戶端 ID
5. 在 **已授權的 JavaScript 來源** 中添加：
   ```
   https://sage-lily-4d882e.netlify.app
   http://localhost:8000
   ```
6. 在 **已授權的重新導向 URI** 中添加：
   ```
   https://sage-lily-4d882e.netlify.app
   http://localhost:8000
   https://naqyczuuariosniudbsr.supabase.co/auth/v1/callback
   ```

## 🧪 測試步驟

### 測試 1：訪問 Netlify 網站

1. 打開瀏覽器，前往：`https://sage-lily-4d882e.netlify.app`
2. 確認網站正常載入

### 測試 2：測試登入功能

1. 在 Netlify 網站上點擊「使用 Google 登入」
2. 完成 Google 登入流程
3. **確認重定向回 Netlify 網站**（不是 localhost）
4. 確認登入成功，可以看到儀表板

### 測試 3：測試 AI 功能

1. 登入後，開啟 AI 助手
2. 發送測試訊息
3. 確認 AI 可以正常回應

### 測試 4：檢查瀏覽器控制台

1. 打開瀏覽器開發者工具（F12）
2. 前往 **Console** 標籤
3. 檢查是否有錯誤訊息
4. 前往 **Network** 標籤
5. 確認所有 Supabase 請求都成功（狀態碼 200）

## 🔧 常見問題

### 問題 1：登入後重定向到 localhost

**原因：** Supabase Auth 的 Redirect URLs 未包含 Netlify URL

**解決方案：**
1. 前往 Supabase Dashboard → Authentication → URL Configuration
2. 確認 Redirect URLs 包含 `https://sage-lily-4d882e.netlify.app`
3. 確認 Redirect URLs 包含 `https://sage-lily-4d882e.netlify.app/*`

### 問題 2：CORS 錯誤

**錯誤訊息：** `Access to fetch at 'https://naqyczuuariosniudbsr.supabase.co' from origin 'https://sage-lily-4d882e.netlify.app' has been blocked by CORS policy`

**解決方案：**
1. 前往 Supabase Dashboard → Settings → API
2. 在 Additional Allowed Origins 中添加：`https://sage-lily-4d882e.netlify.app`

### 問題 3：AI 功能無法運作

**可能原因：**
1. Edge Function 未部署
2. API Key 未設定
3. 網路連線問題

**解決方案：**
1. 確認 Edge Function 已部署：
   ```bash
   supabase functions list
   ```
2. 檢查 Edge Function 日誌：
   ```bash
   supabase functions logs ask-ai
   ```
3. 參考 [Edge Function 設定指南](./SUPABASE_EDGE_FUNCTION_SETUP.md)

## 📋 完整檢查清單

完成以下檢查以確認配置正確：

- [ ] Supabase URL 在 `app.js` 中正確配置
- [ ] Supabase Auth 的 Site URL 已設定（Netlify 或 localhost）
- [ ] Supabase Auth 的 Redirect URLs 包含：
  - [ ] `http://localhost:8000`
  - [ ] `http://localhost:8000/*`
  - [ ] `https://sage-lily-4d882e.netlify.app`
  - [ ] `https://sage-lily-4d882e.netlify.app/*`
- [ ] Supabase CORS 設定包含 Netlify URL（如果需要）
- [ ] Google OAuth 設定包含 Netlify URL（如果使用 Google 登入）
- [ ] Netlify 網站可以正常訪問
- [ ] 登入功能在 Netlify 上正常運作
- [ ] AI 功能在 Netlify 上正常運作
- [ ] 瀏覽器控制台沒有錯誤訊息

## 🎯 總結

**重要理解：**

1. **Supabase URL 不需要更改**
   - `https://naqyczuuariosniudbsr.supabase.co` 是雲端服務地址
   - 無論應用部署在哪裡（localhost 或 Netlify），都連接到同一個 Supabase 雲端服務

2. **需要配置的是重定向 URL**
   - Supabase Auth 需要知道允許重定向到哪些 URL
   - 必須同時包含 localhost（開發）和 Netlify URL（生產）

3. **Netlify 部署是自動的**
   - 當您推送代碼到 GitHub 時，Netlify 會自動部署
   - 不需要手動修改 Supabase URL

## 📚 相關文件

- [修復重定向 URL 指南](./FIX_REDIRECT_URL.md)
- [Google 登入設定](./GOOGLE_LOGIN_SETUP.md)
- [Netlify 部署指南](./NETLIFY_DEPLOY_GUIDE.md)
- [Edge Function 設定](./SUPABASE_EDGE_FUNCTION_SETUP.md)

---

**您的應用已成功部署在 Netlify！** 🎉

只需要確保 Supabase Auth 的 Redirect URLs 包含您的 Netlify URL 即可。






