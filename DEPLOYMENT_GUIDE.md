# 部署指南 - 將網站部署到線上

## 📌 重要說明

**Supabase ≠ 網站託管服務**

- ✅ **Supabase** = 後端資料庫服務（您已經設定好了）
- ✅ **前端網站** = 需要部署到其他平台（如 Vercel、Netlify 等）

您的應用程式架構：
```
前端網站 (HTML/CSS/JS) → 部署到 Vercel/Netlify → 連接到 Supabase 資料庫
```

---

## 🚀 推薦方案：使用 Vercel 部署（最簡單）

Vercel 提供免費的靜態網站託管，非常適合您的專案。

### 步驟 1：準備部署

您的專案已經準備好了！只需要確保：
- ✅ `app.js` 中已填入 Supabase URL 和 Key
- ✅ 所有文件都在同一個資料夾中

### 步驟 2：建立 GitHub 儲存庫（可選但推薦）

1. 前往 [github.com](https://github.com) 並登入
2. 點擊右上角 **+** → **New repository**
3. 填寫：
   - Repository name: `career-guidance-system`（或任何名稱）
   - 選擇 **Public**（免費帳號）
   - 不要勾選 README、.gitignore、license
4. 點擊 **Create repository**

### 步驟 3：上傳程式碼到 GitHub

在終端機中執行（在專案資料夾中）：

```powershell
# 初始化 Git（如果還沒有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 連接到 GitHub（替換成您的 GitHub 用戶名和儲存庫名稱）
git remote add origin https://github.com/您的用戶名/career-guidance-system.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步驟 4：部署到 Vercel

1. 前往 [vercel.com](https://vercel.com)
2. 點擊 **Sign Up**，使用 GitHub 帳號登入
3. 點擊 **Add New Project**
4. 選擇您的 GitHub 儲存庫（career-guidance-system）
5. 設定：
   - **Framework Preset**: Other
   - **Root Directory**: `./`（保持預設）
6. 點擊 **Deploy**

### 步驟 5：完成！

幾分鐘後，Vercel 會給您一個網址，例如：
- `https://career-guidance-system.vercel.app`

**您的網站現在已經上線了！** 🎉

---

## 🌐 其他部署選項

### 選項 2：Netlify（也很簡單）

1. 前往 [netlify.com](https://netlify.com)
2. 註冊帳號（可用 GitHub 登入）
3. 點擊 **Add new site** → **Import an existing project**
4. 選擇 **Deploy with GitHub**
5. 選擇您的儲存庫
6. 點擊 **Deploy site**

### 選項 3：GitHub Pages（免費但功能較少）

1. 在 GitHub 儲存庫中，點擊 **Settings**
2. 左側選單 → **Pages**
3. Source 選擇 **main** branch
4. 點擊 **Save**
5. 幾分鐘後，網站會在：`https://您的用戶名.github.io/career-guidance-system`

⚠️ **注意**：GitHub Pages 不支援某些進階功能，但基本功能應該可以運作。

### 選項 4：Supabase Storage（需要額外設定）

Supabase 的 Storage 功能可以託管靜態網站，但需要：
1. 啟用 Storage
2. 建立 bucket
3. 上傳文件
4. 設定公開權限

這個方法比較複雜，不推薦初學者使用。

---

## 🔧 部署後的重要設定

### 1. 檢查 Supabase CORS 設定

部署後，如果遇到 CORS 錯誤，需要在 Supabase 中設定：

1. 前往 Supabase Dashboard
2. Settings → API
3. 在 **CORS** 設定中，添加您的部署網址：
   - `https://您的網站.vercel.app`
   - `https://您的網站.netlify.app`
   - 等等

### 2. 確認環境變數（如果需要）

目前您的設定是直接寫在 `app.js` 中，這是可以的。如果未來想要更安全，可以：
- 使用環境變數
- 在 Vercel/Netlify 中設定環境變數

---

## ✅ 部署檢查清單

- [ ] 確認 `app.js` 中已填入 Supabase URL 和 Key
- [ ] 在本地測試過網站功能正常
- [ ] 建立 GitHub 儲存庫（可選）
- [ ] 上傳程式碼到 GitHub
- [ ] 在 Vercel/Netlify 部署
- [ ] 測試部署後的網站功能
- [ ] 在 Supabase 中設定 CORS（如需要）

---

## 🐛 常見問題

### Q1: 部署後無法登入？

**A:** 檢查：
1. Supabase URL 和 Key 是否正確
2. 瀏覽器 Console（F12）是否有錯誤
3. Supabase 的 CORS 設定是否包含您的網址

### Q2: 部署後顯示空白頁面？

**A:** 
1. 檢查文件路徑是否正確
2. 確認所有文件都已上傳
3. 檢查瀏覽器 Console 的錯誤訊息

### Q3: 如何更新網站？

**A:** 
- 修改本地文件
- 提交到 GitHub：`git add .` → `git commit -m "更新"` → `git push`
- Vercel/Netlify 會自動重新部署

---

## 🎉 完成！

部署完成後，您就可以：
- ✅ 在任何地方訪問您的網站
- ✅ 分享給其他人使用
- ✅ 不需要本地伺服器

**記住**：Supabase 是您的資料庫，網站需要部署到其他平台！

