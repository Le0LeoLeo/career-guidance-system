# 考程表圖片識別 Edge Function 部署指南

本指南將幫助您設置和部署考程表圖片識別功能的 Supabase Edge Function（使用百度 OCR）。

## 📋 前置需求

1. **Supabase 專案**：確保您已經有一個 Supabase 專案
2. **Supabase CLI**：已安裝並登入 Supabase CLI
3. **百度智能雲 OCR API 憑證**：需要 API Key 和 Secret Key

## 🔑 步驟 1: 獲取百度 OCR API 憑證

1. 訪問 [百度智能雲控制台](https://console.bce.baidu.com/)
2. 登入您的帳號
3. 進入「產品服務」→「人工智能」→「文字識別」
4. 創建應用並獲取：
   - **API Key** (`BAIDU_API_KEY`)
   - **Secret Key** (`BAIDU_SECRET_KEY`)

### 開通服務

- 需要開通「通用文字識別（高精度版）」服務
- 免費額度：每天 50,000 次調用
- 付費額度：根據實際使用量計費

## 🔗 步驟 2: 連結 Supabase 專案（如果尚未連結）

```bash
# 在專案根目錄執行
supabase link --project-ref YOUR_PROJECT_REF
```

您可以在 Supabase 專案設置中找到 `PROJECT_REF`。

## 🔐 步驟 3: 設定環境變數（Secrets）

將百度 OCR API 憑證設定為 Supabase Secrets：

```bash
# 設定 BAIDU_API_KEY
supabase secrets set BAIDU_API_KEY=your_api_key_here

# 設定 BAIDU_SECRET_KEY
supabase secrets set BAIDU_SECRET_KEY=your_secret_key_here
```

### 驗證 Secrets 是否設定成功

```bash
# 列出所有 secrets（不會顯示實際值）
supabase secrets list
```

您應該看到：
- `BAIDU_API_KEY`
- `BAIDU_SECRET_KEY`

## 📦 步驟 4: 部署 Edge Function

```bash
# 部署 process-schedule function
supabase functions deploy process-schedule

# 或部署所有 functions
supabase functions deploy
```

### 部署成功標誌

部署成功後，您會看到類似以下的訊息：
```
Deploying function process-schedule...
Function process-schedule deployed successfully
```

## ✅ 步驟 5: 測試 Edge Function

### 使用 Supabase CLI 測試

```bash
# 測試 Edge Function（需要提供 Base64 編碼的圖片）
supabase functions invoke process-schedule \
  --body '{"image": "base64_encoded_image_here"}'
```

### 在瀏覽器中測試

1. 打開您的應用
2. 進入「學業管理」→「考程表」
3. 點擊「上傳考程表圖片」
4. 選擇一張包含考試時間表的清晰圖片
5. 等待處理完成

## 🔍 故障排除

### 問題 1: "處理圖片失敗：Failed to send a request to the Edge Function"

**可能原因：**
- Edge Function 未部署
- 網絡連接問題
- Supabase 客戶端配置問題

**解決方案：**
1. 確認 Edge Function 已部署：
   ```bash
   supabase functions list
   ```
   應該看到 `process-schedule` 在列表中

2. 重新部署：
   ```bash
   supabase functions deploy process-schedule
   ```

3. 檢查 Supabase 專案設置中的 URL 和 API Key 是否正確

### 問題 2: "百度 API 配置未設定"

**解決方案：**
1. 確認已正確設定環境變數：
   ```bash
   supabase secrets set BAIDU_API_KEY=your_key
   supabase secrets set BAIDU_SECRET_KEY=your_secret
   ```

2. 重新部署 function：
   ```bash
   supabase functions deploy process-schedule
   ```

3. 驗證 secrets：
   ```bash
   supabase secrets list
   ```

### 問題 3: "無法獲取百度 Access Token"

**解決方案：**
- 檢查 API Key 和 Secret Key 是否正確
- 確認百度智能雲帳號狀態正常
- 檢查 API 配額是否已用完
- 確認已開通「通用文字識別（高精度版）」服務

### 問題 4: "OCR 識別失敗"

**解決方案：**
- 確認圖片清晰且包含完整的考試時間表
- 確認圖片格式正確（支持 JPG、PNG、BMP 等）
- 確認圖片大小不超過 10MB
- 嘗試使用更高解析度的圖片

### 問題 5: "無法從圖片中提取考程表"

**解決方案：**
- 確認圖片中的文字清晰可讀
- 確認圖片包含完整的考試時間表（日期、時間、科目）
- 嘗試調整圖片亮度和對比度
- 如果圖片是手寫的，可能需要更清晰的圖片

## 📝 更新 Edge Function

當您修改了 `supabase/functions/process-schedule/index.ts` 後，重新部署：

```bash
supabase functions deploy process-schedule
```

## 🔄 查看日誌

```bash
# 查看即時日誌
supabase functions logs process-schedule --follow

# 查看最近的日誌
supabase functions logs process-schedule

# 查看特定時間範圍的日誌
supabase functions logs process-schedule --since 1h
```

## 🎯 快速檢查清單

- [ ] 已安裝 Supabase CLI
- [ ] 已登入 Supabase CLI (`supabase login`)
- [ ] 已連結 Supabase 專案 (`supabase link`)
- [ ] 已獲取百度 OCR API 憑證
- [ ] 已開通「通用文字識別（高精度版）」服務
- [ ] 已設定 `BAIDU_API_KEY` secret
- [ ] 已設定 `BAIDU_SECRET_KEY` secret
- [ ] 已部署 `process-schedule` Edge Function
- [ ] 已測試 Edge Function 是否正常運作

## 💡 提示

1. **圖片質量**：使用清晰、高解析度的圖片可以大幅提高識別準確率
2. **圖片格式**：建議使用 JPG 或 PNG 格式
3. **圖片大小**：建議圖片大小在 1-5MB 之間，過大的圖片會增加處理時間
4. **API 配額**：注意百度 OCR API 的使用配額，避免超出限制
5. **錯誤處理**：Edge Function 已包含完整的錯誤處理，錯誤訊息會回傳給前端
6. **安全性**：API Key 和 Secret Key 只存在於 Supabase Secrets 中，不會暴露在前端代碼

## 🔧 技術細節

### Edge Function 工作流程

1. **接收圖片**：接收 Base64 編碼的圖片數據
2. **獲取 Access Token**：使用 OAuth 2.0 獲取百度 API 的 Access Token
3. **OCR 識別**：調用百度 OCR API（高精度版）識別圖片中的文字
4. **AI 整理**：使用文心一言 API 將 OCR 結果整理成結構化的考程表數據
5. **返回結果**：返回整理好的考程表數據給前端

### 使用的 API

- **百度 OCR API**：`https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic`
- **百度文心一言 API**：`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions`

## 🆘 需要幫助？

如果遇到問題，請：

1. **檢查 Supabase Function 日誌**：
   ```bash
   supabase functions logs process-schedule --follow
   ```

2. **查看瀏覽器控制台**：打開開發者工具（F12），查看 Console 和 Network 標籤

3. **確認百度 OCR API 狀態**：登入百度智能雲控制台，檢查服務狀態和配額

4. **參考官方文檔**：
   - [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)
   - [百度 OCR API 文檔](https://cloud.baidu.com/doc/OCR/s/dk3iqnq51)
   - [百度文心一言 API 文檔](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/4lilb2lpf)

## 📚 相關資源

- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)
- [百度智能雲控制台](https://console.bce.baidu.com/)
- [百度 OCR API 文檔](https://cloud.baidu.com/doc/OCR/s/dk3iqnq51)
- [Supabase CLI 文檔](https://supabase.com/docs/reference/cli)

