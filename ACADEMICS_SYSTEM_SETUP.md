# 智能考程與目標追蹤系統 - 設定指南

## 概述

本系統新增了兩個核心模組：
1. **智能考程表 (AI Schedule)**: 學生上傳圖片 → 百度 OCR 辨識 → 百度文心整理成 JSON → 存入 Supabase → 前端顯示並提示
2. **目標與成績追蹤 (Goal & Progress)**: 學生從 Firebase 選擇目標大學與科系 → 存入 Supabase → 學生輸入測驗成績 → 系統依照特定權重公式計算差距 → 顯示是否能達到目標

---

## 第一部分：資料庫設定 (Supabase)

### 1. 執行 SQL 語法

請在 Supabase Dashboard 的 SQL Editor 中執行 `academics_database.sql` 檔案中的所有 SQL 語法。

這個檔案會：
- 修改 `profiles` 表格，新增目標大學與科系欄位
- 建立 `exam_schedules` 表格（儲存考程表）
- 建立 `exam_scores` 表格（儲存成績）
- 設定 Row Level Security (RLS) 政策，確保資料安全

### 2. 驗證表格建立

執行後，請確認以下表格已建立：
- `profiles` 表格已新增欄位：`target_university_id`, `target_major_name`, `target_admission_score`
- `exam_schedules` 表格已建立
- `exam_scores` 表格已建立

---

## 第二部分：Edge Function 設定

### 1. 部署 Edge Function

在專案根目錄執行以下命令：

```bash
npx supabase functions deploy process-schedule
```

### 2. 設定環境變數

設定百度 API 的環境變數：

```bash
npx supabase secrets set BAIDU_API_KEY=你的API_KEY
npx supabase secrets set BAIDU_SECRET_KEY=你的SECRET_KEY
```

**注意**：根據您提供的 API Key，請使用：
- `BAIDU_API_KEY=MzakylxwMs22DzBMokLqZvAN`
- `BAIDU_SECRET_KEY=FvFP2IZMErVOMyXqgQEXKDUdA9RFbG75`

### 3. 驗證 Edge Function

Edge Function 部署後，可以在 Supabase Dashboard 的 Edge Functions 頁面查看狀態。

---

## 第三部分：Firebase 資料結構擴充

### 1. 科系資料結構

為了支援目標設定功能，Firebase 的 `universities` 文檔需要包含 `majors` 欄位。

**建議的資料結構**：

```javascript
{
  name: "大學名稱",
  nameEn: "University Name",
  city: "城市",
  // ... 其他現有欄位 ...
  majors: [
    {
      name: "資工系",
      admission_score: 85
    },
    {
      name: "電機系",
      admission_score: 82
    }
    // ... 更多科系
  ]
}
```

或者，如果科系資料較多，可以建立子集合：

```
universities/{universityId}/majors/{majorId}
```

每個 major 文檔包含：
- `name`: 科系名稱
- `admission_score`: 錄取分數標準

### 2. 更新現有資料

如果您的 Firebase 資料庫中已有大學資料，請手動添加 `majors` 欄位或子集合。

---

## 第四部分：前端功能說明

### 1. 導航

在 Dashboard 視圖中，點擊「學術中心」卡片即可進入新功能。

### 2. 設定目標

1. 點擊「選擇/變更目標」按鈕
2. 在彈出的模態框中搜尋並選擇大學
3. 選擇科系
4. 系統會自動儲存目標並顯示在頁面上

### 3. 上傳考程表

1. 點擊「上傳考程表圖片」按鈕
2. 選擇包含考試時間表的圖片（JPG、PNG 格式，最大 10MB）
3. 系統會自動：
   - 使用百度 OCR 識別圖片中的文字
   - 使用文心一言整理成結構化的考程表
   - 存入資料庫並顯示在頁面上
4. 即將到來的考試（7天內）會特別標註

### 4. 輸入成績

1. 填寫成績輸入表單：
   - 科目名稱
   - 評核類型（測驗/考試/日常表現）
   - 得分
   - 滿分（預設 100）
2. 點擊「新增成績」
3. 系統會自動計算進度並更新儀表板

### 5. 進度追蹤

系統會根據以下權重公式計算目前加權總分：

- **總結性評核 (40%)**:
  - 測驗平均 × 0.2 (20%)
  - 考試平均 × 0.2 (20%)
- **形成性評核 (60%)**:
  - 日常表現平均 × 0.6 (60%)

**計算方式**：
1. 針對每個科目，分別計算測驗、考試、日常表現的平均分
2. 計算該科目的加權總分 = (測驗平均 × 0.2) + (考試平均 × 0.2) + (日常表現 × 0.6)
3. 計算所有科目的平均加權總分
4. 與目標分數比較，顯示差距

---

## 第五部分：測試步驟

### 1. 測試目標設定

1. 登入系統
2. 進入「學術中心」
3. 點擊「選擇/變更目標」
4. 選擇一個大學和科系
5. 確認目標顯示正確

### 2. 測試考程表上傳

1. 準備一張包含考試時間表的圖片（建議使用清晰的圖片）
2. 點擊「上傳考程表圖片」
3. 選擇圖片並上傳
4. 等待處理完成（可能需要幾秒鐘）
5. 確認考程表正確顯示

### 3. 測試成績輸入

1. 輸入幾筆不同類型的成績（測驗、考試、日常表現）
2. 確認成績列表正確顯示
3. 確認進度儀表板正確計算

### 4. 測試進度計算

1. 設定目標分數（例如 85 分）
2. 輸入多筆成績
3. 確認系統正確計算加權總分
4. 確認差距顯示正確

---

## 第六部分：故障排除

### 1. Edge Function 錯誤

如果 Edge Function 返回錯誤：
- 檢查環境變數是否正確設定
- 檢查百度 API Key 和 Secret Key 是否有效
- 查看 Supabase Dashboard 的 Edge Function 日誌

### 2. OCR 識別失敗

如果圖片無法識別：
- 確認圖片清晰且包含完整的考試時間表
- 確認圖片格式為 JPG、PNG
- 確認圖片大小不超過 10MB

### 3. 目標設定無法儲存

- 確認 Supabase RLS 政策已正確設定
- 確認用戶已登入
- 檢查瀏覽器控制台的錯誤訊息

### 4. 進度計算不正確

- 確認已輸入足夠的成績數據
- 確認成績類型選擇正確
- 檢查計算公式是否正確應用

---

## 第七部分：API 文檔

### Edge Function: process-schedule

**端點**: `https://[your-project].supabase.co/functions/v1/process-schedule`

**方法**: POST

**請求體**:
```json
{
  "image": "base64_encoded_image_string"
}
```

**回應**:
```json
{
  "success": true,
  "schedules": [
    {
      "subject": "數學",
      "exam_date": "2024-12-20",
      "exam_time": "09:00",
      "exam_type": "exam"
    }
  ],
  "ocr_text": "..."
}
```

---

## 注意事項

1. **百度 API 配額**: 請注意百度 OCR 和文心一言 API 的使用配額，避免超出限制
2. **資料隱私**: 所有資料都受到 Supabase RLS 保護，用戶只能查看自己的資料
3. **Firebase 資料結構**: 如果您的 Firebase 資料結構不同，可能需要調整 `selectMajorForGoal` 函數中的資料讀取邏輯
4. **圖片大小限制**: 建議上傳的圖片大小不超過 10MB，以確保處理速度

---

## 支援

如有問題，請檢查：
1. 瀏覽器控制台的錯誤訊息
2. Supabase Dashboard 的日誌
3. Edge Function 的執行日誌

