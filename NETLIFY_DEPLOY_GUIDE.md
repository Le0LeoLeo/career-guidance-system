# 🚀 Netlify 部署完整指南

## 📋 前置準備

在開始之前，請確認：
- ✅ 您的 `app.js` 中已填入正確的 Supabase URL 和 Key
- ✅ 本地測試過網站功能正常
- ✅ 所有文件都在同一個資料夾中

---

## 方法一：透過 GitHub 部署（推薦）⭐

這是最簡單且自動化的方法，每次更新程式碼都會自動重新部署。

### 步驟 1：建立 GitHub 儲存庫

1. **前往 GitHub**
   - 打開 [github.com](https://github.com)
   - 如果沒有帳號，點擊 **Sign up** 免費註冊

2. **建立新儲存庫**
   - 點擊右上角 **+** → **New repository**
   - 填寫資訊：
     - **Repository name**: `career-guidance-system`（或任何您喜歡的名稱）
     - **Description**: `職業探索與生涯規劃系統`（可選）
     - 選擇 **Public**（公開，免費帳號）
     - ⚠️ **不要勾選** README、.gitignore、license（因為您已經有文件了）
   - 點擊 **Create repository**

### 步驟 2：上傳程式碼到 GitHub

在您的專案資料夾中打開終端機（PowerShell），執行以下命令：

```powershell
# 1. 初始化 Git（如果還沒有）
git init

# 2. 添加所有文件
git add .

# 3. 提交文件
git commit -m "Initial commit - Career Guidance System"

# 4. 連接到 GitHub（替換成您的 GitHub 用戶名和儲存庫名稱）
git remote add origin https://github.com/您的用戶名/career-guidance-system.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

**注意**：執行 `git push` 時，GitHub 會要求您輸入帳號密碼。如果使用個人存取令牌（Personal Access Token），請使用令牌作為密碼。

### 步驟 3：在 Netlify 部署

1. **前往 Netlify**
   - 打開 [netlify.com](https://netlify.com)
   - 點擊右上角 **Sign up** 或 **Log in**
   - 選擇 **Sign up with GitHub**（推薦，這樣可以直接連接 GitHub）

2. **授權 Netlify 存取 GitHub**
   - 點擊 **Authorize Netlify** 允許 Netlify 存取您的 GitHub 儲存庫

3. **建立新網站**
   - 登入後，點擊右上角 **Add new site**
   - 選擇 **Import an existing project**
   - 選擇 **Deploy with GitHub**
   - 如果還沒連接 GitHub，點擊 **Configure the Netlify app on GitHub** 並授權

4. **選擇儲存庫**
   - 在列表中選擇您的 `career-guidance-system` 儲存庫
   - 點擊它

5. **設定部署選項**
   - **Branch to deploy**: `main`（保持預設）
   - **Build command**: 留空（因為這是靜態網站，不需要建置）
   - **Publish directory**: `./` 或留空（所有文件都在根目錄）
   - 點擊 **Deploy site**

6. **等待部署完成**
   - Netlify 會開始部署，通常需要 1-2 分鐘
   - 部署完成後，您會看到 **"Site is live"** 訊息
   - Netlify 會自動生成一個網址，例如：`https://career-guidance-system-123456.netlify.app`

### 步驟 4：自訂網址（可選）

1. 在 Netlify 網站設定中，點擊 **Site settings**
2. 左側選單 → **Domain management**
3. 點擊 **Options** → **Edit site name**
4. 輸入您想要的網址名稱，例如：`my-career-guide`
5. 您的網址會變成：`https://my-career-guide.netlify.app`

---

## 方法二：直接拖放部署（最快速）⚡

如果您不想使用 GitHub，可以直接上傳文件。

### 步驟 1：準備文件

確保所有文件都在同一個資料夾中：
- `index.html`
- `app.js`
- `style.css`
- 其他必要的文件

### 步驟 2：壓縮文件

1. 選取所有文件（`index.html`, `app.js`, `style.css` 等）
2. 右鍵 → **傳送到** → **壓縮的 (zipped) 資料夾**
3. 或使用壓縮軟體（如 7-Zip、WinRAR）建立 ZIP 檔案

### 步驟 3：部署到 Netlify

1. **前往 Netlify**
   - 打開 [netlify.com](https://netlify.com)
   - 登入或註冊帳號

2. **拖放部署**
   - 在 Netlify 首頁，找到 **Want to deploy a new site without connecting to Git?**
   - 將 ZIP 檔案**直接拖放**到該區域
   - 或點擊該區域，選擇 ZIP 檔案

3. **等待部署**
   - Netlify 會自動解壓縮並部署
   - 幾秒鐘後，網站就會上線！

**注意**：使用此方法，每次更新都需要重新上傳 ZIP 檔案。

---

## 🔧 部署後的重要設定

### 1. 設定 Supabase CORS（重要！）

部署後，如果遇到 CORS 錯誤，需要在 Supabase 中設定：

1. **前往 Supabase Dashboard**
   - 打開 [supabase.com](https://supabase.com)
   - 登入並選擇您的專案

2. **設定 CORS**
   - 左側選單 → **Settings** → **API**
   - 找到 **CORS** 設定區域
   - 在 **Additional Allowed Origins** 中添加您的 Netlify 網址：
     ```
     https://您的網站名稱.netlify.app
     ```
   - 點擊 **Save**

### 2. 測試網站功能

部署完成後，請測試：
- ✅ 註冊/登入功能
- ✅ 問卷填寫
- ✅ 資料儲存
- ✅ 所有頁面正常顯示

如果遇到問題，打開瀏覽器的開發者工具（F12）查看 Console 錯誤訊息。

---

## 🔄 更新網站（使用 GitHub 方法）

如果您使用 GitHub 方法部署，更新網站非常簡單：

1. **修改本地文件**
   - 在您的電腦上編輯文件

2. **提交到 GitHub**
   ```powershell
   git add .
   git commit -m "更新說明"
   git push
   ```

3. **自動部署**
   - Netlify 會自動偵測到 GitHub 的更新
   - 自動重新部署網站（通常 1-2 分鐘）

---

## 📝 建立 Netlify 配置檔（可選）

如果您想要更多控制，可以建立 `netlify.toml` 配置文件：

在專案根目錄建立 `netlify.toml` 文件：

```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

這個配置文件會：
- 指定發布目錄為當前目錄
- 設定所有路由都指向 `index.html`（適用於單頁應用）

---

## ✅ 部署檢查清單

- [ ] 確認 `app.js` 中已填入 Supabase URL 和 Key
- [ ] 本地測試過網站功能正常
- [ ] 選擇部署方法（GitHub 或拖放）
- [ ] 完成部署
- [ ] 在 Supabase 中設定 CORS
- [ ] 測試部署後的網站功能
- [ ] 自訂網址（可選）

---

## 🐛 常見問題排除

### Q1: 部署後顯示空白頁面？

**解決方法**：
1. 檢查文件路徑是否正確
2. 確認所有文件都已上傳
3. 打開瀏覽器開發者工具（F12）查看 Console 錯誤
4. 檢查 `index.html` 中的 `<script>` 標籤路徑是否正確

### Q2: 無法登入或連接 Supabase？

**解決方法**：
1. 確認 `app.js` 中的 Supabase URL 和 Key 正確
2. 在 Supabase Dashboard 中設定 CORS（添加 Netlify 網址）
3. 檢查 Supabase 專案是否正常運作
4. 查看瀏覽器 Console 的錯誤訊息

### Q3: 如何查看部署日誌？

**解決方法**：
1. 在 Netlify 網站頁面，點擊 **Deploys** 標籤
2. 點擊最新的部署記錄
3. 查看 **Deploy log** 了解詳細資訊

### Q4: 如何回退到之前的版本？

**解決方法**：
1. 在 Netlify 網站頁面，點擊 **Deploys** 標籤
2. 找到您想要回退的版本
3. 點擊 **...** → **Publish deploy**

### Q5: 如何設定自訂網域？

**解決方法**：
1. 在 Netlify 網站設定中，點擊 **Domain management**
2. 點擊 **Add custom domain**
3. 輸入您的網域（例如：`example.com`）
4. 按照指示設定 DNS 記錄

---

## 🎉 完成！

部署完成後，您就可以：
- ✅ 在任何地方訪問您的網站
- ✅ 分享給其他人使用
- ✅ 不需要本地伺服器
- ✅ 自動 HTTPS 加密（Netlify 免費提供）

**您的網站網址格式**：
```
https://您的網站名稱.netlify.app
```

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 Netlify 的部署日誌
2. 查看瀏覽器 Console 錯誤訊息
3. 確認 Supabase 設定正確
4. 參考 Netlify 官方文件：[docs.netlify.com](https://docs.netlify.com)

祝您部署順利！🚀

