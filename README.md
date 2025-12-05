# 學生職涯輔導系統

一個使用純 HTML、CSS、JavaScript 和 Supabase 建立的學生職涯輔導系統。

## 技術棧

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **UI 框架**: Bootstrap 5 (CDN)
- **後端**: Supabase (透過 CDN)
- **資料庫**: Supabase PostgreSQL

## 功能特色

### 學生端
- **已確定目標學生**: 瀏覽職涯資源、依類別篩選資源
- **未確定目標學生**: 填寫興趣測驗、預約教師面談、查看預約狀態

### 教師端
- 發布職涯資源
- 查看所有學生預約
- 確認/管理預約狀態
- 管理資源（刪除）

## 安裝與設定

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 註冊並建立新專案
2. 記下您的專案 URL 和 Anon Key

### 2. 設定資料庫

1. 在 Supabase Dashboard 中，進入 **SQL Editor**
2. 複製 `database.sql` 檔案中的所有 SQL 語法
3. 在 SQL Editor 中執行這些語法以建立表格和權限設定

### 3. 設定應用程式

1. 開啟 `app.js` 檔案
2. 在檔案開頭填入您的 Supabase 資訊：
   ```javascript
   const SUPABASE_URL = '您的 Supabase URL';
   const SUPABASE_ANON_KEY = '您的 Supabase Anon Key';
   ```

### 4. 執行應用程式

#### 本地開發

由於使用純 HTML/CSS/JS，您可以直接：
- 使用任何本地伺服器（如 VS Code 的 Live Server）
- 或使用 Python 啟動 HTTP 服務器：`python -m http.server 8000`
- 然後訪問：`http://localhost:8000`

#### 部署到 Netlify（生產環境）

1. 將代碼推送到 GitHub
2. 在 [Netlify](https://www.netlify.com) 連接您的 GitHub 倉庫
3. Netlify 會自動部署您的網站
4. 訪問 Netlify 提供的 URL（例如：`https://your-site.netlify.app`）

**重要**：部署到 Netlify 後，直接訪問 Netlify 的 URL，**不需要使用 localhost**！

詳見：[本地開發 vs 生產環境說明](./LOCAL_VS_PRODUCTION.md)

## 檔案結構

```
AI_proj/
├── index.html          # 主 HTML 檔案（包含所有視圖）
├── app.js              # 所有 JavaScript 邏輯
├── style.css           # 自訂樣式
├── database.sql        # Supabase 資料庫結構 SQL
└── README.md          # 本說明檔案
```

## 使用流程

### 首次使用

1. **註冊帳號**
   - 選擇身份（學生或教師）
   - 填寫電子郵件和密碼

2. **學生首次登入**
   - 系統會要求選擇狀態：
     - **已確定目標**: 可直接瀏覽資源
     - **未確定目標**: 可填寫興趣測驗並預約面談

3. **教師登入**
   - 可直接進入教師儀表板
   - 開始發布資源和管理預約

### 功能說明

#### 已確定目標學生
- 查看所有職涯資源
- 依類別篩選資源
- 點擊資源連結前往外部網站

#### 未確定目標學生
- **興趣測驗**: 填寫並儲存個人興趣與想法
- **預約面談**: 選擇教師、日期和時間進行預約
- **我的預約**: 查看所有預約記錄和狀態

#### 教師
- **發布資源**: 新增標題、網址和類別
- **所有預約**: 查看所有學生的預約，並可確認預約
- **資源管理**: 查看所有已發布的資源，並可刪除

## 資料庫結構

### profiles 表格
- 延伸自 `auth.users`
- 儲存使用者角色、學生狀態、興趣、目標等

### resources 表格
- 儲存職涯資源（標題、連結、類別）

### appointments 表格
- 儲存學生預約資訊（學生 ID、教師、時間、狀態）

## 安全性

系統使用 Supabase 的 Row Level Security (RLS) 政策：
- 使用者只能查看和修改自己的資料
- 教師可以查看所有學生資料和預約
- 資源對所有人開放讀取，但只有教師可以新增/刪除

## 注意事項

1. **Supabase 設定**: 請確保已正確設定 RLS 政策
2. **認證**: 系統使用 Supabase Auth，首次註冊後可能需要驗證電子郵件（取決於 Supabase 設定）
3. **時區**: 預約時間使用本地時區，儲存時會轉換為 UTC
4. **重定向 URL 錯誤**: 如果遇到 `localhost:3000` 連接錯誤，請參考 [修復重定向 URL 指南](./FIX_REDIRECT_URL.md)

## 未來擴充建議

- 新增學生目標設定功能（已確定目標學生）
- 新增預約取消功能
- 新增資源編輯功能
- 新增通知系統
- 新增搜尋功能

## 授權

本專案僅供學習和參考使用。

