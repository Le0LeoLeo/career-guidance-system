# 🎓 學生職涯輔導系統

一個功能完整的學生職涯輔導平台，整合 AI 智能助手、學術規劃、興趣測驗和預約系統，幫助學生探索職涯方向並規劃未來。

## ✨ 主要特色

### 🤖 AI 智能助手
- **多對話視窗管理**：支援多個對話會話，方便管理不同主題的諮詢
- **個人化建議**：AI 會根據學生的目標大學、科系、興趣和成績提供專業建議
- **即時對話**：流暢的對話體驗，支援即時回覆和訊息歷史記錄
- **智能上下文理解**：AI 能夠理解學生的背景資料，提供更精準的建議

### 📚 學術規劃系統
- **目標大學設定**：學生可以設定理想大學和科系
- **科系資訊瀏覽**：查看各科系的詳細資訊和要求
- **成績管理**：記錄和管理學業成績，追蹤學習進度

### 🎯 職涯輔導功能
- **職涯資源庫**：豐富的職涯相關資源，依類別分類
- **興趣測驗**：幫助未確定目標的學生探索興趣方向
- **預約面談**：學生可預約教師進行一對一諮詢
- **預約管理**：教師可查看和管理所有學生預約

### 👥 雙角色系統
- **學生端**：個人化儀表板、目標設定、資源瀏覽、AI 諮詢
- **教師端**：資源發布、預約管理、學生資料查看

## 🛠️ 技術棧

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **UI 框架**: Bootstrap 5, Tailwind CSS (CDN)
- **後端**: Supabase (Edge Functions)
- **資料庫**: Supabase PostgreSQL
- **AI 服務**: 百度文心一言 API (透過 Supabase Edge Functions)
- **認證**: Supabase Auth
- **測試**: Vitest

## 🚀 快速開始

### 前置需求

- Node.js (v18 或以上)
- Supabase 帳號
- 百度文心一言 API Key (用於 AI 功能)

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 註冊並建立新專案
2. 記下您的專案 URL 和 Anon Key

### 2. 設定資料庫

1. 在 Supabase Dashboard 中，進入 **SQL Editor**
2. 依序執行以下 SQL 檔案：
   - `database.sql` - 基本資料庫結構
   - `academics_database.sql` - 學術系統相關表格
   - `add_target_university_name_field.sql` - 目標大學欄位（如需要）
3. 確認所有表格和 RLS 政策已正確建立

### 3. 部署 AI Edge Function

AI 功能需要部署 Supabase Edge Function：

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入 Supabase
supabase login

# 連結專案
supabase link --project-ref your-project-ref

# 設定 API Key（參考 SETUP_API_KEY.md）
# 在 supabase/functions/ask-ai/.env 中設定百度 API Key

# 部署 Edge Function
supabase functions deploy ask-ai
```

詳細說明請參考：
- [Edge Function 設定指南](./SUPABASE_EDGE_FUNCTION_SETUP.md)
- [API Key 設定](./SETUP_API_KEY.md)

### 4. 設定應用程式

1. 開啟 `app.js` 檔案
2. 在檔案開頭填入您的 Supabase 資訊：
   ```javascript
   const SUPABASE_URL = '您的 Supabase URL';
   const SUPABASE_ANON_KEY = '您的 Supabase Anon Key';
   ```
3. 如需使用 Firebase（部分功能），請填入 Firebase 配置

### 5. 執行應用程式

#### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
# 或使用 Python
python -m http.server 8000

# 訪問 http://localhost:8000
```

#### 執行測試

```bash
# 執行所有測試
npm test

# 監聽模式
npm run test:watch

# 測試 UI
npm run test:ui
```

#### 部署到生產環境

**Netlify 部署：**

1. 將代碼推送到 GitHub
2. 在 [Netlify](https://www.netlify.com) 連接您的 GitHub 倉庫
3. Netlify 會自動部署您的網站
4. 訪問 Netlify 提供的 URL

**重要**：部署後請確保 Edge Function 也已部署，AI 功能才能正常運作！

## 📁 專案結構

```
AI_proj/
├── index.html                    # 主 HTML 檔案（包含所有視圖）
├── app.js                        # 所有 JavaScript 邏輯
├── style.css                     # 自訂樣式
├── package.json                  # 專案依賴和腳本
├── vitest.config.js              # 測試配置
│
├── database.sql                  # 基本資料庫結構 SQL
├── academics_database.sql       # 學術系統資料庫結構
├── add_target_university_name_field.sql  # 目標大學欄位 SQL
│
├── supabase/
│   └── functions/
│       └── ask-ai/               # AI Edge Function
│           ├── index.ts          # Edge Function 主程式
│           └── .env.example      # 環境變數範例
│
├── test/                         # 測試檔案
│   ├── app.test.js              # 主要測試
│   └── setup.js                 # 測試設定
│
├── *.ps1                         # PowerShell 自動化腳本
├── *.js                          # 診斷和工具腳本
│
└── *.md                          # 文件說明
    ├── README.md                 # 本說明檔案
    ├── SUPABASE_EDGE_FUNCTION_SETUP.md  # Edge Function 設定
    ├── SETUP_API_KEY.md          # API Key 設定指南
    ├── TESTING_GUIDE.md          # 測試指南
    └── ...                       # 其他文件
```

## 📖 使用指南

### 首次使用

1. **註冊帳號**
   - 使用 FCT 學校郵箱格式：`f######@fct.edu.mo`
   - 選擇身份（學生或教師）
   - 填寫電子郵件和密碼

2. **學生首次登入**
   - 系統會要求選擇狀態：
     - **已確定目標**: 設定目標大學和科系，瀏覽資源
     - **未確定目標**: 填寫興趣測驗並預約面談

3. **教師登入**
   - 可直接進入教師儀表板
   - 開始發布資源和管理預約

### 功能詳細說明

#### 🤖 AI 智能助手

**開啟 AI 助手：**
- 點擊右下角的 AI 助手按鈕
- 開始新的對話或選擇歷史對話

**主要功能：**
- 💬 **多對話管理**：建立多個對話會話，管理不同主題
- 📝 **個人化建議**：AI 會根據您的目標大學、科系、興趣提供建議
- 🔍 **智能查詢**：詢問職涯規劃、科系選擇、申請建議等問題
- 📊 **背景理解**：AI 能讀取您的個人資料，提供更精準的回答

**使用範例：**
- "我的理想大學是什麼？"
- "根據我的興趣，推薦適合的科系"
- "如何準備申請目標大學？"

#### 🎯 已確定目標學生

- **目標設定**：設定理想大學和科系
- **資源瀏覽**：查看所有職涯資源，依類別篩選
- **AI 諮詢**：使用 AI 助手獲得個人化建議
- **成績管理**：記錄和管理學業成績

#### 🔍 未確定目標學生

- **興趣測驗**：填寫並儲存個人興趣與想法
- **預約面談**：選擇教師、日期和時間進行預約
- **我的預約**：查看所有預約記錄和狀態
- **AI 探索**：使用 AI 助手探索職涯方向

#### 👨‍🏫 教師端

- **發布資源**：新增標題、網址和類別
- **所有預約**：查看所有學生的預約，並可確認預約
- **資源管理**：查看所有已發布的資源，並可刪除
- **學生資料**：查看學生的基本資料和目標設定

## 🗄️ 資料庫結構

### 核心表格

**profiles**
- 延伸自 `auth.users`
- 儲存使用者角色、學生狀態、興趣、目標大學、科系等
- 欄位：`role`, `student_status`, `interests`, `target_university_name`, `target_major` 等

**resources**
- 儲存職涯資源（標題、連結、類別）
- 由教師發布，所有學生可瀏覽

**appointments**
- 儲存學生預約資訊（學生 ID、教師、時間、狀態）
- 支援預約確認和管理

**ai_sessions**
- 儲存 AI 對話會話
- 包含會話標題、建立時間等

**ai_messages**
- 儲存 AI 對話訊息
- 關聯到 `ai_sessions`，記錄用戶和 AI 的對話內容

### 學術系統表格

**universities**
- 大學資訊

**majors**
- 科系資訊

**exams** (如已建立)
- 考試相關資訊

## 🔒 安全性

系統使用 Supabase 的 Row Level Security (RLS) 政策：
- ✅ 使用者只能查看和修改自己的資料
- ✅ 教師可以查看所有學生資料和預約
- ✅ 資源對所有人開放讀取，但只有教師可以新增/刪除
- ✅ AI 對話會話和訊息僅對擁有者可見

## ⚠️ 注意事項

1. **Supabase 設定**
   - 請確保已正確設定 RLS 政策
   - 確認 Edge Function 已部署並設定 API Key

2. **認證**
   - 系統使用 Supabase Auth
   - 僅支援 FCT 學校郵箱格式：`f######@fct.edu.mo`
   - 首次註冊後可能需要驗證電子郵件（取決於 Supabase 設定）

3. **AI 功能**
   - 需要部署 `ask-ai` Edge Function
   - 需要設定百度文心一言 API Key
   - 詳細設定請參考 [Edge Function 設定指南](./SUPABASE_EDGE_FUNCTION_SETUP.md)

4. **時區**
   - 預約時間使用本地時區，儲存時會轉換為 UTC

5. **常見問題**
   - 重定向 URL 錯誤：參考 [修復重定向 URL 指南](./FIX_REDIRECT_URL.md)
   - AI 無法讀取目標大學：參考 [修復 AI 目標大學問題](./FIX_AI_TARGET_UNIVERSITY.md)
   - Edge Function 錯誤：參考 [Edge Function 故障排除](./EDGE_FUNCTION_TROUBLESHOOTING.md)

## 🧪 測試

專案包含完整的測試套件：

```bash
# 執行所有測試
npm test

# 監聽模式
npm run test:watch

# 測試 UI
npm run test:ui
```

詳細測試指南請參考 [測試指南](./TESTING_GUIDE.md)

## 📚 相關文件

- [Edge Function 設定指南](./SUPABASE_EDGE_FUNCTION_SETUP.md)
- [API Key 設定](./SETUP_API_KEY.md)
- [測試指南](./TESTING_GUIDE.md)
- [AI 功能修復指南](./FIX_AI_TARGET_UNIVERSITY.md)
- [Edge Function 故障排除](./EDGE_FUNCTION_TROUBLESHOOTING.md)

## 🚧 未來擴充計劃

- [ ] 預約取消功能
- [ ] 資源編輯功能
- [ ] 通知系統
- [ ] 進階搜尋功能
- [ ] 成績分析圖表
- [ ] 多語言支援
- [ ] 行動裝置優化

## 📄 授權

本專案僅供學習和參考使用。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**開發者**: 如有問題或建議，請透過 GitHub Issues 聯繫。

