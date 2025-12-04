# 多對話視窗模式設置指南

本指南說明如何設置多對話視窗模式，讓用戶可以同時管理多個對話，類似 ChatGPT 或 Gemini 的體驗。

## 📋 功能說明

實現了多對話視窗模式：
- ✅ 左側邊欄顯示所有歷史對話列表
- ✅ 右側主視窗顯示當前選中的對話
- ✅ 點擊「新增對話」按鈕開始新話題
- ✅ 自動為新對話建立 Session
- ✅ 點擊左側列表切換不同對話
- ✅ 刪除對話功能
- ✅ 每個對話獨立保存訊息

## 🗄️ 資料庫設置

### 步驟 1：執行 SQL 語句

1. 登入 Supabase Dashboard
2. 進入 **SQL Editor**
3. 打開 `chat_sessions_table.sql` 文件
4. 複製所有 SQL 語句
5. 在 SQL Editor 中執行

**⚠️ 注意：此 SQL 會刪除現有的 `chat_messages` 表，請確保已備份重要資料！**

### 步驟 2：驗證表格建立

在 Supabase Dashboard 的 **Table Editor** 中確認：
- ✅ `chat_sessions` 表格已建立
- ✅ `chat_messages` 表格已建立（包含 `session_id` 欄位）
- ✅ 所有欄位正確
- ✅ RLS 已啟用
- ✅ 索引已建立

## 📊 資料庫結構

### chat_sessions 表格

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵，自動生成 |
| `user_id` | UUID | 用戶 ID，外鍵關聯 `auth.users` |
| `title` | TEXT | 對話標題（顯示在左側列表） |
| `created_at` | TIMESTAMP | 建立時間 |
| `updated_at` | TIMESTAMP | 最後更新時間（自動更新） |

### chat_messages 表格

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵，自動生成 |
| `session_id` | UUID | Session ID，外鍵關聯 `chat_sessions` |
| `role` | TEXT | 角色：'user' 或 'assistant' |
| `content` | TEXT | 訊息內容 |
| `created_at` | TIMESTAMP | 建立時間 |

**重要變更：**
- 移除了 `user_id` 欄位（改為通過 `session_id` 關聯）
- 新增了 `session_id` 欄位（關鍵欄位）

## 💻 前端功能

### UI 佈局

**左側邊欄（Sidebar）：**
- 寬度：280px（桌面）/ 240px（平板）/ 200px（手機）
- 「+ 新增對話」按鈕（頂部）
- 對話列表（可滾動）
- 每個對話項目顯示：
  - 標題
  - 最後更新時間
  - 刪除按鈕（hover 時顯示）

**右側主視窗（Main Chat）：**
- 標題列（顯示當前對話標題）
- 訊息顯示區（可滾動）
- 輸入區（底部）

### 核心函式

#### 1. `loadSessions()`
- 從 `chat_sessions` 載入當前用戶的所有對話
- 按 `updated_at` 降序排列（最新的在前）
- 渲染到左側列表

#### 2. `switchSession(sessionId)`
- 切換到指定的 Session
- 設定 `currentSessionId`
- 載入該 Session 的所有訊息
- 更新 UI 標記當前選中的對話

#### 3. `startNewChat()`
- 點擊「新增對話」時執行
- 清空 `currentSessionId`（設為 `null`）
- 清空聊天窗口，顯示歡迎訊息

#### 4. `createSession(title)`
- 建立新的 Session
- 返回新建立的 Session 資料（包含 `id`）

#### 5. `loadMessages(sessionId)`
- 載入指定 Session 的所有訊息
- 按 `created_at` 升序排列
- 渲染到聊天窗口
- 更新 `chatHistory` 陣列（用於 API 調用）

#### 6. `saveMessageToDB(role, content, sessionId)`
- 保存訊息到資料庫
- **必須提供 `sessionId`**

#### 7. `handleSendMessage()` 的邏輯修改
- **情況 A（已有 Session）：** 如果 `currentSessionId` 存在 → 直接保存訊息
- **情況 B（新對話）：** 如果 `currentSessionId` 為 `null` →
  1. 使用用戶訊息的前 20 個字作為標題
  2. 建立新 Session
  3. 取得新 Session 的 `id`，設定為 `currentSessionId`
  4. 重新載入 Sessions 列表
  5. 保存訊息到新 Session

## 🔒 安全性

### Row Level Security (RLS)

**chat_sessions 表：**
- ✅ 用戶只能查看自己的 sessions
- ✅ 用戶只能建立自己的 sessions
- ✅ 用戶只能更新自己的 sessions
- ✅ 用戶只能刪除自己的 sessions

**chat_messages 表：**
- ✅ 用戶只能查看自己 sessions 的訊息
- ✅ 用戶只能插入訊息到自己 sessions
- ✅ 用戶只能更新自己 sessions 的訊息
- ✅ 用戶只能刪除自己 sessions 的訊息

## 🧪 測試步驟

1. **執行 SQL 語句**
   ```bash
   # 在 Supabase Dashboard 的 SQL Editor 中執行 chat_sessions_table.sql
   ```

2. **測試建立新對話**
   - 登入系統
   - 打開 AI 聊天窗口
   - 點擊「+ 新增對話」按鈕
   - 發送一條訊息
   - 確認左側列表出現新對話項目

3. **測試切換對話**
   - 建立多個對話（發送不同主題的訊息）
   - 點擊左側列表的不同對話項目
   - 確認右側顯示對應的訊息

4. **測試刪除對話**
   - 將滑鼠移到對話項目上
   - 點擊刪除按鈕
   - 確認對話已刪除

5. **測試自動建立 Session**
   - 點擊「新增對話」
   - 直接發送訊息（不先建立 Session）
   - 確認系統自動建立 Session 並保存訊息

## 🐛 故障排除

### 問題：左側列表沒有顯示對話

**檢查項目：**
1. 確認 SQL 語句已執行
2. 確認 `chat_sessions` 表格已建立
3. 檢查瀏覽器控制台是否有錯誤
4. 確認用戶已登入
5. 檢查 `loadSessions()` 是否被調用

### 問題：訊息沒有保存

**檢查項目：**
1. 確認 `currentSessionId` 不為 `null`
2. 檢查瀏覽器控制台是否有錯誤
3. 確認 RLS 政策已正確設置
4. 檢查 `saveMessageToDB()` 是否被正確調用

### 問題：切換對話時訊息沒有載入

**檢查項目：**
1. 確認 `switchSession()` 是否被調用
2. 確認 `loadMessages()` 是否成功執行
3. 檢查 `session_id` 是否正確
4. 檢查瀏覽器控制台是否有錯誤

### 問題：無法建立新 Session

**檢查項目：**
1. 確認 `createSession()` 是否被調用
2. 檢查瀏覽器控制台是否有錯誤
3. 確認 RLS 政策允許 INSERT
4. 確認 `user_id` 是否正確

## 📝 注意事項

1. **資料遷移**
   - 如果之前有使用舊的 `chat_messages` 表，需要手動遷移資料
   - 舊資料需要：
     1. 為每組對話建立對應的 `chat_sessions` 記錄
     2. 更新 `chat_messages` 的 `session_id` 欄位

2. **效能考量**
   - Sessions 列表按 `updated_at` 降序排列，最新的在前
   - 訊息按 `created_at` 升序排列，符合對話順序
   - 使用索引優化查詢效能

3. **擴展功能**
   - 可以添加對話重命名功能（更新 `title`）
   - 可以添加對話搜尋功能
   - 可以添加對話分類或標籤功能

## ✅ 完成檢查清單

- [x] SQL 表格建立（chat_sessions 和 chat_messages）
- [x] RLS 政策設置
- [x] 索引建立
- [x] HTML 兩欄式佈局
- [x] CSS 側邊欄和主窗口樣式
- [x] `loadSessions()` 函式實現
- [x] `switchSession()` 函式實現
- [x] `startNewChat()` 函式實現
- [x] `createSession()` 函式實現
- [x] `loadMessages()` 函式實現
- [x] `saveMessageToDB()` 修改（支援 session_id）
- [x] `handleSendMessage()` 修改（自動建立 Session）
- [x] 刪除對話功能
- [x] 響應式設計

## 🎉 完成！

多對話視窗模式已完全實現。用戶現在可以：
- ✅ 同時管理多個對話
- ✅ 輕鬆切換不同話題
- ✅ 享受類似 ChatGPT 的對話體驗
- ✅ 自動保存所有對話記錄

如有任何問題，請查看瀏覽器控制台的錯誤訊息或 Supabase 日誌。

