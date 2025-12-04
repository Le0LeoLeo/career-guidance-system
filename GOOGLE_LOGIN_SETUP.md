# Google 登入設定指南

本指南將幫助您在學生職涯輔導系統中設定 Google 登入功能。

## 📋 步驟總覽

1. ✅ 在 Google Cloud Platform 建立 OAuth 用戶端 ID
2. ✅ 在 Supabase 中設定 Google 提供者
3. ✅ 更新前端程式碼（已完成）
4. ✅ 測試 Google 登入功能

---

## 步驟 1：完成 Google Cloud Platform OAuth 設定

您目前正在 Google Cloud Platform 中建立 OAuth 用戶端 ID。請按照以下步驟完成設定：

### 1.1 填寫基本資訊

在您看到的表單中：

1. **應用程式類型**：選擇「網頁應用程式」（已選擇 ✅）
2. **名稱**：`career-guidance-system`（已填入 ✅）

### 1.2 設定已授權的 JavaScript 來源

點擊「**+ 新增 URI**」按鈕，新增以下網址：

**本地開發環境：**
```
http://localhost:8000
http://127.0.0.1:8000
```

**Netlify 部署環境：**
```
https://sage-lily-4d882e.netlify.app
```

**注意：** 如果之後有自訂網域，也要加入！

### 1.3 設定已授權的重新導向 URI

點擊「**+ 新增 URI**」按鈕，新增以下網址：

**本地開發環境：**
```
http://localhost:8000
```

**Netlify 部署環境：**
```
https://sage-lily-4d882e.netlify.app
```

**Supabase 回調 URL（重要！）：**
```
https://naqyczuuariosniudbsr.supabase.co/auth/v1/callback
```

**注意：** 
- 將 `naqyczuuariosniudbsr` 替換為您的 Supabase 專案 ID
- 您可以在 Supabase Dashboard → Settings → API 中找到您的專案 URL

### 1.4 建立 OAuth 用戶端

1. 確認所有 URI 都已正確填入
2. 點擊「**建立**」按鈕
3. 等待建立完成

### 1.5 複製用戶端 ID 和密鑰

建立完成後，您會看到：
- **用戶端 ID**（Client ID）：類似 `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **用戶端密鑰**（Client Secret）：類似 `GOCSPX-xxxxxxxxxxxxx`

**請將這兩個資訊複製下來，下一步會用到！**

---

## 步驟 2：在 Supabase 中設定 Google 提供者

### 2.1 前往 Supabase Authentication 設定

1. 登入 [Supabase Dashboard](https://supabase.com)
2. 選擇您的專案
3. 左側選單 → **Authentication**（認證）
4. 點擊 **Providers**（提供者）標籤

### 2.2 啟用 Google 提供者

1. 找到 **Google** 提供者
2. 點擊開關啟用 Google 登入
3. 會出現兩個欄位需要填入：
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**

### 2.3 填入 Google OAuth 資訊

將剛才從 Google Cloud Platform 複製的資訊填入：

1. **Client ID (for OAuth)**：貼上 Google 用戶端 ID
2. **Client Secret (for OAuth)**：貼上 Google 用戶端密鑰

### 2.4 儲存設定

1. 點擊 **Save**（儲存）按鈕
2. 等待設定生效（通常幾秒鐘）

---

## 步驟 3：確認前端程式碼已更新

前端程式碼已經更新完成，包含：
- ✅ Google 登入按鈕（在登入和註冊表單中）
- ✅ Google 登入處理函式
- ✅ 自動建立 profile 功能

**如果還沒有更新，請確認：**
- `index.html` 中有 Google 登入按鈕
- `app.js` 中有 `handleGoogleLogin` 和 `handleGoogleSignup` 函式

---

## 步驟 4：測試 Google 登入功能

### 4.1 本地測試

1. 啟動本地伺服器：
   ```powershell
   cd C:\Users\acer\OneDrive\Desktop\AI_proj
   python -m http.server 8000
   ```

2. 打開瀏覽器，前往：`http://localhost:8000`

3. 點擊「**使用 Google 登入**」按鈕

4. 應該會跳轉到 Google 登入頁面

5. 選擇 Google 帳號並授權

6. 登入成功後，應該會回到您的網站並自動登入

### 4.2 部署環境測試

1. 確認 Netlify 網站已部署最新版本
2. 前往您的 Netlify 網址：`https://sage-lily-4d882e.netlify.app`
3. 點擊「**使用 Google 登入**」按鈕
4. 測試登入流程

---

## ⚠️ 重要注意事項

### 1. CORS 設定

確保在 Supabase Dashboard → Settings → API 中，已將您的 Netlify 網址加入 CORS 允許清單：
```
https://sage-lily-4d882e.netlify.app
```

### 2. Google OAuth 設定生效時間

Google OAuth 設定可能需要 **5 分鐘到數小時** 才會生效。如果立即測試失敗，請稍後再試。

### 3. 重新導向 URI 必須完全匹配

確保 Supabase 回調 URL 完全正確：
```
https://您的Supabase專案ID.supabase.co/auth/v1/callback
```

### 4. Google 登入用戶的預設角色

目前 Google 登入的用戶預設為「**學生**」角色。如果需要讓用戶選擇角色，可以在登入後顯示選擇畫面。

---

## ❓ 常見問題

### Q1: 點擊 Google 登入按鈕後沒有反應？

**A:** 檢查：
- Supabase 中是否已啟用 Google 提供者
- 是否已填入正確的 Client ID 和 Client Secret
- 瀏覽器 Console（F12）是否有錯誤訊息

### Q2: Google 登入後出現錯誤？

**A:** 檢查：
- Google Cloud Platform 中的「已授權的重新導向 URI」是否包含 Supabase 回調 URL
- Supabase 回調 URL 是否正確（專案 ID 是否正確）

### Q3: 本地可以登入，但部署後不行？

**A:** 檢查：
- Netlify 網址是否已加入 Google Cloud Platform 的「已授權的 JavaScript 來源」
- Netlify 網址是否已加入「已授權的重新導向 URI」
- Supabase CORS 設定是否包含 Netlify 網址

### Q4: Google 登入後沒有自動建立 profile？

**A:** 檢查：
- `app.js` 中的 `onAuthStateChange` 是否包含建立 profile 的邏輯
- Supabase 資料庫中的 `profiles` 表格是否存在
- 瀏覽器 Console 是否有錯誤訊息

---

## ✅ 完成檢查清單

- [ ] 已在 Google Cloud Platform 建立 OAuth 用戶端 ID
- [ ] 已設定「已授權的 JavaScript 來源」（包含本地和 Netlify 網址）
- [ ] 已設定「已授權的重新導向 URI」（包含本地、Netlify 和 Supabase 回調 URL）
- [ ] 已複製 Google 用戶端 ID 和密鑰
- [ ] 已在 Supabase 中啟用 Google 提供者
- [ ] 已在 Supabase 中填入 Google Client ID 和 Client Secret
- [ ] 已確認前端程式碼包含 Google 登入功能
- [ ] 已測試本地 Google 登入功能
- [ ] 已測試部署環境 Google 登入功能

---

## 🎉 完成！

如果所有步驟都完成了，您的 Google 登入功能應該可以正常運作了！

如果遇到任何問題，請檢查：
1. 瀏覽器的開發者工具（F12）→ Console 標籤
2. Supabase Dashboard → Authentication → Logs
3. Google Cloud Platform → APIs & Services → Credentials

