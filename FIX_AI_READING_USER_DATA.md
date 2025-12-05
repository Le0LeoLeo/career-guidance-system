# 修復 AI 無法讀取用戶目標大學資訊的問題

## 問題描述
當用戶問「我的理想大學是什麼」時，AI 回答「目前我還沒有從你的資料裡看到關於理想大學的具體資訊」，但實際上用戶已經設定了目標。

## 解決步驟

### 1. 添加數據庫字段（必須執行）

在 Supabase Dashboard → SQL Editor 中執行以下 SQL：

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_university_name TEXT;
```

這會添加 `target_university_name` 字段到 `profiles` 表，用於存儲大學名稱。

### 2. 重新部署 Edge Function（必須執行）

在終端中執行：

```bash
npx supabase functions deploy ask-ai
```

這會部署更新後的 Edge Function，包含：
- 查詢 `target_university_name` 字段
- 強化系統提示詞，要求 AI 必須使用用戶數據
- 添加詳細的調試日志

### 3. 重新設定目標（建議執行）

在應用中重新設定一次目標大學和科系，這樣：
- 大學名稱會被保存到 `target_university_name` 字段
- 確保數據完整性

### 4. 驗證修復

1. 在應用中設定目標大學和科系
2. 問 AI：「我的理想大學是什麼？」
3. AI 應該直接回答：「根據你的目標設定，你的理想大學是 [大學名稱]，目標科系是 [科系名稱]」

## 技術細節

### 已修改的文件

1. **`supabase/functions/ask-ai/index.ts`**
   - 查詢 `profiles` 表時包含 `target_university_name`
   - 優先使用 `profiles` 表中的大學名稱
   - 強化系統提示詞，明確要求 AI 使用數據回答
   - 添加詳細的調試日志

2. **`app.js`**
   - 保存目標時，同時保存大學名稱到 `target_university_name` 字段

3. **`academics_database.sql`** 和 **`create_exam_tables.sql`**
   - 添加 `target_university_name` 字段定義

### 系統提示詞強化

Edge Function 現在會在系統提示詞中包含：

```
【你必須遵守的規則 - 非常重要！】
1. 當用戶詢問「我的理想大學是什麼」時，你必須直接使用上述【用戶目標資訊】回答
1.1. 【特別重要】如果【用戶目標資訊】中有任何數據，你必須立即使用這些數據回答
1.2. 【關鍵指令】當用戶問「我的理想大學是什麼」時，如果【用戶目標資訊】中有「目標大學」和「目標科系」，你必須直接回答
...
6. 【絕對禁止】永遠不要說「我沒有你的數據」、「我無法獲取你的數據」等話語
```

## 調試

如果修復後仍然有問題，可以：

1. 檢查 Supabase Edge Function 日志：
   - 在 Supabase Dashboard → Edge Functions → ask-ai → Logs
   - 查看是否有錯誤或警告

2. 檢查數據庫：
   - 在 Supabase Dashboard → Table Editor → profiles
   - 確認你的用戶記錄中有 `target_university_id`、`target_university_name`、`target_major_name` 等字段

3. 檢查瀏覽器控制台：
   - 打開開發者工具（F12）
   - 查看 Console 標籤，確認是否有錯誤

## 常見問題

### Q: 為什麼需要重新設定目標？
A: 因為 `target_university_name` 字段是新添加的，舊的目標記錄中沒有這個字段的值。重新設定會同時保存大學ID和大學名稱。

### Q: 如果我不想重新設定目標怎麼辦？
A: 可以手動在 Supabase Dashboard → Table Editor → profiles 中更新你的記錄，填入 `target_university_name` 字段。

### Q: Edge Function 部署失敗怎麼辦？
A: 確保：
- 已安裝 Supabase CLI：`npm install -g supabase`
- 已登入：`npx supabase login`
- 已鏈接項目：`npx supabase link --project-ref <your-project-ref>`

