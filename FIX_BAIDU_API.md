# 修復百度 API 認證問題（invalid_iam_token）

## 🔍 問題診斷

錯誤信息：`invalid_iam_token` (401 Unauthorized)

**原因：**
- 當前設置的 `BAIDU_API_KEY` 可能是占位符值（`your_api_key_here`）
- 或者 API Key 格式不正確
- 或者 API Key 已過期/無效

## ✅ 解決方案

### 步驟 1：檢查當前設置

```powershell
npx supabase secrets list
```

### 步驟 2：設置真實的百度 API Key

您需要提供**真實的**百度 API 密鑰。有兩種方式：

#### 方式 1：千帆平台 API Key（推薦）

1. **獲取 API Key：**
   - 前往：https://cloud.baidu.com/
   - 登入並創建應用
   - 在千帆平台獲取 API Key（格式：`bce-v3/ALTAK-xxx/xxx`）

2. **設置 API Key：**
   ```powershell
   npx supabase secrets set BAIDU_API_KEY=bce-v3/你的實際API_KEY
   ```

#### 方式 2：OAuth 2.0（需要 API Key 和 Secret Key）

1. **獲取 API Key 和 Secret Key：**
   - 前往：https://cloud.baidu.com/
   - 登入並創建應用
   - 獲取 API Key 和 Secret Key

2. **設置 API Key 和 Secret Key：**
   ```powershell
   npx supabase secrets set BAIDU_API_KEY=你的API_KEY
   npx supabase secrets set BAIDU_SECRET_KEY=你的SECRET_KEY
   ```

### 步驟 3：重新部署 Edge Function

設置完 API Key 後，必須重新部署 Edge Function 才能生效：

```powershell
npx supabase functions deploy ask-ai
```

### 步驟 4：驗證修復

1. 刷新瀏覽器頁面（F5）
2. 發送一條測試訊息給 AI 助手
3. 應該能收到正常的 AI 回覆

## 📝 完整命令示例

```powershell
# 1. 檢查當前設置
npx supabase secrets list

# 2. 設置千帆平台 API Key（替換為您的真實 API Key）
npx supabase secrets set BAIDU_API_KEY=bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980

# 3. 重新部署
npx supabase functions deploy ask-ai

# 4. 測試
# 在瀏覽器中刷新頁面並發送測試訊息
```

## ⚠️ 重要提示

1. **不要使用占位符值**：`your_api_key_here` 是無效的
2. **API Key 格式**：
   - 千帆平台格式：必須以 `bce-v3/` 開頭
   - OAuth 2.0：需要同時設置 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`
3. **重新部署**：設置 secrets 後必須重新部署 Edge Function
4. **獲取 API Key**：如果還沒有，請前往百度智能雲獲取

## 🔗 相關資源

- 百度智能雲：https://cloud.baidu.com/
- 千帆平台：https://cloud.baidu.com/product/wenxinworkshop
- Supabase Dashboard：https://supabase.com/dashboard/project/naqyczuuariosniudbsr

