# 對話紀錄持久化功能設置指南

本指南說明如何設置對話紀錄持久化功能，讓用戶的聊天記錄在重新整理頁面或下次登入時能夠保留。

## 📋 功能說明

實現了類似 Gemini 或 ChatGPT 的對話紀錄持久化功能：
- ✅ 用戶發送訊息時自動保存到資料庫
- ✅ AI 回覆時自動保存到資料庫
- ✅ 頁面載入時自動載入歷史記錄
- ✅ 打開聊天窗口時自動載入歷史記錄
- ✅ 用戶只能看到自己的對話記錄（RLS 安全策略）

## 🗄️ 資料庫設置

### 步驟 1：執行 SQL 語句

1. 登入 Supabase Dashboard
2. 進入 **SQL Editor**
3. 打開 `chat_messages_table.sql` 文件
4. 複製所有 SQL 語句
5. 在 SQL Editor 中執行

或者直接在 SQL Editor 中執行以下 SQL：

```sql
-- 建立 chat_messages 表格
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at);

-- 啟用 RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
CREATE POLICY "Users can insert own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can delete own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);
```

### 步驟 2：驗證表格建立

在 Supabase Dashboard 的 **Table Editor** 中確認：
- ✅ `chat_messages` 表格已建立
- ✅ 所有欄位正確
- ✅ RLS 已啟用
- ✅ 索引已建立

## 💻 前端功能

### 已實現的功能

1. **`loadChatHistory()`** - 載入歷史記錄
   - 從 `chat_messages` 表格讀取當前用戶的所有訊息
   - 按 `created_at` 升序排列
   - 自動渲染到聊天窗口

2. **`saveMessageToDB(role, content)`** - 保存訊息
   - 接收 `role` ('user' 或 'assistant') 和 `content`
   - 使用 `supabase.from('chat_messages').insert()` 保存
   - 自動關聯當前用戶 ID

3. **`handleSendMessage()`** - 修改後的發送流程
   - 發送前：保存用戶訊息到資料庫
   - 收到回覆後：保存 AI 回覆到資料庫
   - 保持原有的顯示邏輯

### 自動載入時機

- ✅ 頁面載入時（如果用戶已登入）
- ✅ 打開聊天窗口時（如果尚未載入）
- ✅ 用戶登入後自動載入

## 🔒 安全性

### Row Level Security (RLS)

所有 RLS 政策確保：
- ✅ 用戶只能讀取自己的訊息
- ✅ 用戶只能插入自己的訊息
- ✅ 用戶只能更新自己的訊息
- ✅ 用戶只能刪除自己的訊息

### 資料驗證

- ✅ `role` 欄位限制為 'user' 或 'assistant'
- ✅ `content` 欄位不能為空
- ✅ `user_id` 自動從當前登入用戶獲取

## 🧪 測試步驟

1. **執行 SQL 語句**
   ```bash
   # 在 Supabase Dashboard 的 SQL Editor 中執行 chat_messages_table.sql
   ```

2. **測試保存功能**
   - 登入系統
   - 打開 AI 聊天窗口
   - 發送一條訊息
   - 檢查 Supabase Table Editor 中 `chat_messages` 表格是否有新記錄

3. **測試載入功能**
   - 發送幾條訊息
   - 重新整理頁面（F5）
   - 打開聊天窗口
   - 確認歷史訊息都顯示出來

4. **測試多用戶隔離**
   - 使用不同帳號登入
   - 確認每個用戶只能看到自己的訊息

## 📊 資料庫結構

### chat_messages 表格

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵，自動生成 |
| `user_id` | UUID | 用戶 ID，外鍵關聯 `auth.users` |
| `role` | TEXT | 角色：'user' 或 'assistant' |
| `content` | TEXT | 訊息內容 |
| `created_at` | TIMESTAMP | 建立時間，自動設定 |

### 索引

- `idx_chat_messages_user_id` - 優化按用戶查詢
- `idx_chat_messages_created_at` - 優化按時間排序
- `idx_chat_messages_user_created` - 複合索引，優化用戶+時間查詢

## 🐛 故障排除

### 問題：歷史記錄沒有載入

**檢查項目：**
1. 確認 SQL 語句已執行
2. 確認 `chat_messages` 表格已建立
3. 檢查瀏覽器控制台是否有錯誤
4. 確認用戶已登入（`currentUser` 不為 null）

### 問題：訊息沒有保存

**檢查項目：**
1. 檢查瀏覽器控制台是否有錯誤
2. 確認 RLS 政策已正確設置
3. 確認用戶已登入
4. 檢查 Supabase 日誌

### 問題：看到其他用戶的訊息

**檢查項目：**
1. 確認 RLS 已啟用：`ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;`
2. 確認 RLS 政策已正確設置
3. 檢查 `auth.uid()` 是否正確返回當前用戶 ID

## 📝 注意事項

1. **效能考量**
   - 歷史記錄按時間升序載入，適合對話場景
   - 使用索引優化查詢效能
   - 如果歷史記錄過多，可以考慮分頁載入

2. **資料清理**
   - 目前沒有自動清理機制
   - 可以考慮添加定期清理舊訊息的機制
   - 或提供用戶手動刪除功能

3. **擴展功能**
   - 可以添加訊息編輯功能（已包含 UPDATE 政策）
   - 可以添加訊息刪除功能（已包含 DELETE 政策）
   - 可以添加對話分類或標籤功能

## ✅ 完成檢查清單

- [x] SQL 表格建立
- [x] RLS 政策設置
- [x] 索引建立
- [x] `loadChatHistory()` 函式實現
- [x] `saveMessageToDB()` 函式實現
- [x] `handleSendMessage()` 修改
- [x] 自動載入邏輯
- [x] 登出時清空記錄

## 🎉 完成！

對話紀錄持久化功能已完全實現。用戶現在可以：
- ✅ 在重新整理頁面後看到之前的對話
- ✅ 在下次登入時看到歷史記錄
- ✅ 享受類似 ChatGPT 的對話體驗

如有任何問題，請查看瀏覽器控制台的錯誤訊息或 Supabase 日誌。

