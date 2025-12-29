# Supabase Edge Function 部署指南

本指南將幫助您設置和部署 AI 智能助手功能的 Supabase Edge Function。

## 📋 前置需求

1. **Supabase 專案**：確保您已經有一個 Supabase 專案
2. **Supabase CLI**：安裝 Supabase CLI 工具
3. **百度千帆 API 憑證**：需要 API Key 和 Secret Key

## 🔧 步驟 1: 安裝 Supabase CLI

### Windows (PowerShell)
```powershell
# 使用 Scoop 安裝
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或使用 npm
npm install -g supabase
```

### macOS / Linux
```bash
# 使用 Homebrew
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase
```

## 🔑 步驟 2: 獲取百度千帆 API 憑證

1. 訪問 [百度智能雲千帆平台](https://cloud.baidu.com/product/qianfan.html)
2. 登入您的帳號
3. 創建應用並獲取：
   - **API Key** (`BAIDU_API_KEY`)
   - **Secret Key** (`BAIDU_SECRET_KEY`)

## 🚀 步驟 3: 登入 Supabase CLI

```bash
supabase login
```

這會打開瀏覽器讓您登入 Supabase 帳號。

## 🔗 步驟 4: 連結您的 Supabase 專案

```bash
# 在專案根目錄執行
supabase link --project-ref YOUR_PROJECT_REF
```

您可以在 Supabase 專案設置中找到 `PROJECT_REF`。

## 🔐 步驟 5: 設定環境變數（Secrets）

將百度 API 憑證設定為 Supabase Secrets：

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

## 📦 步驟 6: 部署 Edge Function

```bash
# 部署 ask-ai function
supabase functions deploy ask-ai

# 或部署所有 functions
supabase functions deploy
```

## ✅ 步驟 7: 測試 Edge Function

### 使用 Supabase CLI 測試

```bash
supabase functions invoke ask-ai \
  --body '{"prompt": "你好，請介紹一下自己"}'
```

### 在瀏覽器中測試

1. 打開您的應用
2. 點擊右下角的「AI 諮詢」按鈕
3. 發送一條測試訊息

## 🔍 故障排除

### 問題 1: "百度 API 配置未設定"

**解決方案：**
- 確認已正確設定環境變數：
  ```bash
  supabase secrets set BAIDU_API_KEY=your_key
  supabase secrets set BAIDU_SECRET_KEY=your_secret
  ```
- 重新部署 function：
  ```bash
  supabase functions deploy ask-ai
  ```

### 問題 2: "無法獲取 Access Token"

**解決方案：**
- 檢查 API Key 和 Secret Key 是否正確
- 確認百度千帆平台帳號狀態正常
- 檢查 API 配額是否已用完

### 問題 3: "CORS 錯誤"

**解決方案：**
- Edge Function 已包含 CORS 標頭
- 如果仍有問題，檢查瀏覽器控制台的詳細錯誤訊息

### 問題 4: "API 請求失敗"

**解決方案：**
- 確認使用的 API 端點正確
- 檢查模型名稱是否正確（`ernie-4.5-turbo-128k` 或 `ernie-4.0-8k`）
- 查看 Supabase Function 日誌：
  ```bash
  supabase functions logs ask-ai
  ```

## 📝 更新 Edge Function

當您修改了 `supabase/functions/ask-ai/index.ts` 後，重新部署：

```bash
supabase functions deploy ask-ai
```

## 🔄 查看日誌

```bash
# 查看即時日誌
supabase functions logs ask-ai --follow

# 查看最近的日誌
supabase functions logs ask-ai
```

## 📚 相關資源

- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)
- [百度千帆 API 文檔](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/4lilb2lpf)
- [Supabase CLI 文檔](https://supabase.com/docs/reference/cli)

## 🎯 快速檢查清單

- [ ] 已安裝 Supabase CLI
- [ ] 已登入 Supabase CLI
- [ ] 已連結 Supabase 專案
- [ ] 已設定 `BAIDU_API_KEY` secret
- [ ] 已設定 `BAIDU_SECRET_KEY` secret
- [ ] 已部署 `ask-ai` Edge Function
- [ ] 已測試 Edge Function 是否正常運作

## 💡 提示

1. **API 配額管理**：注意百度千帆 API 的使用配額，避免超出限制
2. **錯誤處理**：Edge Function 已包含完整的錯誤處理，錯誤訊息會回傳給前端
3. **安全性**：API Key 和 Secret Key 只存在於 Supabase Secrets 中，不會暴露在前端代碼
4. **性能優化**：聊天歷史限制為最近 10 條訊息，避免請求過大

## 🆘 需要幫助？

如果遇到問題，請：
1. 檢查 Supabase Function 日誌
2. 查看瀏覽器控制台的錯誤訊息
3. 確認百度千帆 API 狀態
4. 參考 Supabase 和百度千帆的官方文檔




