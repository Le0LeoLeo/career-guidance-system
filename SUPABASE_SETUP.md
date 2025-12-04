# Supabase 設定指南

這是一步步的 Supabase 設定說明，讓您的學生職涯輔導系統可以正常運作。

## 📋 步驟總覽

1. ✅ 建立 Supabase 專案（如果還沒有）
2. ✅ 執行 SQL 建立資料表
3. ✅ 取得 Supabase URL 和 Anon Key
4. ✅ 將資訊填入 app.js

---

## 步驟 1：確認您在 Supabase 專案中

從您的截圖看來，您已經在 Supabase SQL Editor 中了！很好！

如果還沒有建立專案，請：
1. 前往 [supabase.com](https://supabase.com)
2. 登入您的帳號
3. 點擊「New Project」建立新專案
4. 填寫專案名稱和資料庫密碼
5. 等待專案建立完成（約 2-3 分鐘）

---

## 步驟 2：執行 SQL 建立資料表 ⭐ **重要！**

您現在應該在 SQL Editor 中（從截圖看來是的）。

### 2.1 複製 SQL 語句

1. 打開專案中的 `database.sql` 文件
2. **全選並複製**所有內容（Ctrl+A, Ctrl+C）

### 2.2 在 Supabase SQL Editor 中貼上

1. 在 SQL Editor 的編輯區域（顯示 "Hit CTRL+K to generate query or just start typing" 的地方）
2. **貼上**剛才複製的 SQL 語句（Ctrl+V）

### 2.3 執行 SQL

1. 點擊右下角的綠色 **"Run CTRL ↵"** 按鈕
2. 或者按鍵盤快捷鍵 **Ctrl + Enter**

### 2.4 確認執行成功

執行成功後，您應該會看到：
- ✅ 在 "Results" 標籤中顯示 "Success. No rows returned"
- ✅ 或者顯示一些成功訊息

如果出現錯誤，請檢查：
- 是否已經執行過（某些表格可能已存在）
- SQL 語句是否完整複製

---

## 步驟 3：取得 Supabase URL 和 Anon Key 🔑

### 3.1 前往專案設定

1. 在 Supabase 左側導航欄中，點擊 **⚙️ Settings**（設定）圖示
2. 點擊 **API** 選項

### 3.2 複製 URL 和 Key

您會看到兩個重要的資訊：

1. **Project URL**（專案 URL）
   - 格式類似：`https://xxxxxxxxxxxxx.supabase.co`
   - 點擊旁邊的複製按鈕複製

2. **anon public** key（匿名公開金鑰）
   - 這是一個很長的字符串
   - 點擊旁邊的複製按鈕複製

⚠️ **注意**：不要複製 `service_role` key，那是給伺服器端使用的，不安全！

---

## 步驟 4：將資訊填入 app.js 📝

### 4.1 打開 app.js 文件

在您的專案資料夾中找到 `app.js` 文件並打開。

### 4.2 填入資訊

找到文件開頭的這兩行：

```javascript
const SUPABASE_URL = ''; // 請填入您的 Supabase URL
const SUPABASE_ANON_KEY = ''; // 請填入您的 Supabase Anon Key
```

將剛才複製的資訊填入：

```javascript
const SUPABASE_URL = 'https://您的專案ID.supabase.co'; // 貼上 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 貼上 anon public key
```

### 4.3 儲存文件

儲存 `app.js` 文件（Ctrl+S）

---

## 步驟 5：測試系統 🧪

### 5.1 啟動本地伺服器

在終端機中執行：

```powershell
cd C:\Users\acer\OneDrive\Desktop\AI_proj
python -m http.server 8000
```

### 5.2 打開瀏覽器

前往：`http://localhost:8000`

### 5.3 測試功能

1. **註冊新帳號**
   - 點擊「還沒有帳號？註冊」
   - 填寫電子郵件、密碼
   - 選擇身份（學生或教師）
   - 點擊「註冊」

2. **登入**
   - 使用剛才註冊的帳號登入

3. **測試功能**
   - 如果是學生，選擇狀態（已確定/未確定目標）
   - 如果是教師，嘗試發布資源

---

## ❓ 常見問題

### Q1: SQL 執行時出現錯誤？

**A:** 可能是因為：
- 某些表格已經存在 → 這是正常的，可以忽略
- SQL 語句不完整 → 請確認完整複製了 `database.sql` 的所有內容

### Q2: 找不到 API 設定頁面？

**A:** 
1. 確認您在正確的專案中
2. 左側導航欄 → ⚙️ Settings → API

### Q3: 註冊後無法登入？

**A:** 
- 檢查 Supabase 專案的 Email 設定
- 某些專案需要驗證 Email，請檢查您的信箱
- 或者可以在 Supabase Dashboard → Authentication → Settings 中關閉 Email 驗證（僅用於開發測試）

### Q4: 出現 "Cannot read properties of undefined" 錯誤？

**A:** 
- 確認 `app.js` 中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 都已正確填入
- 確認沒有多餘的空格或引號

---

## ✅ 完成檢查清單

- [ ] 已在 Supabase 建立專案
- [ ] 已執行 `database.sql` 中的所有 SQL 語句
- [ ] 已複製 Project URL
- [ ] 已複製 anon public key
- [ ] 已將 URL 和 Key 填入 `app.js`
- [ ] 已儲存 `app.js`
- [ ] 已測試註冊功能
- [ ] 已測試登入功能

---

## 🎉 完成！

如果所有步驟都完成了，您的系統應該可以正常運作了！

如果遇到任何問題，請檢查瀏覽器的開發者工具（F12）中的 Console 標籤，查看錯誤訊息。

