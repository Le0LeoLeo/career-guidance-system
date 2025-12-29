# 設置百度 API Key 指南

## 🎯 快速設置（推薦）

### 方法 1：使用自動化腳本（Windows PowerShell）

1. **執行設置腳本**
   ```powershell
   .\setup-api-key.ps1
   ```

   腳本會自動：
   - 檢查 Supabase CLI 是否安裝
   - 檢查登入狀態
   - 連結專案
   - 設置 API Key
   - 可選：部署 Edge Function

### 方法 2：手動設置

#### 步驟 1：安裝 Supabase CLI（如果尚未安裝）

**使用 npm（推薦）：**
```bash
npm install -g supabase
```

**或使用 Scoop（Windows）：**
```bash
scoop install supabase
```

**或下載二進制文件：**
- 前往：https://github.com/supabase/cli/releases
- 下載適合您系統的版本

#### 步驟 2：登入 Supabase

```bash
supabase login
```

按照提示完成登入。

#### 步驟 3：連結專案

```bash
supabase link --project-ref naqyczuuariosniudbsr
```

#### 步驟 4：設置 API Key

```bash
supabase secrets set BAIDU_API_KEY=bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980
```

#### 步驟 5：部署 Edge Function

```bash
supabase functions deploy ask-ai
```

#### 步驟 6：驗證設置

```bash
# 查看環境變數列表
supabase secrets list

# 查看 Function 日誌
supabase functions logs ask-ai
```

## ✅ 驗證設置是否成功

### 1. 檢查環境變數

```bash
supabase secrets list
```

應該看到 `BAIDU_API_KEY` 在列表中。

### 2. 測試 Edge Function

在瀏覽器中：
1. 打開 `http://localhost:8000`
2. 打開開發者工具（F12）
3. 切換到 Console 標籤
4. 查看是否有 `✅ Edge Function 連接正常` 訊息

### 3. 發送測試訊息

在聊天界面發送一條測試訊息，應該能收到 AI 回覆。

## 🔍 疑難排解

### 問題 1：Supabase CLI 未安裝

**錯誤訊息：**
```
'supabase' 不是內部或外部命令
```

**解決方案：**
```bash
npm install -g supabase
```

### 問題 2：未登入 Supabase

**錯誤訊息：**
```
Error: You must be logged in to run this command
```

**解決方案：**
```bash
supabase login
```

### 問題 3：專案未連結

**錯誤訊息：**
```
Error: No project linked
```

**解決方案：**
```bash
supabase link --project-ref naqyczuuariosniudbsr
```

### 問題 4：API Key 設置失敗

**檢查：**
1. 確認 API Key 格式正確（應以 `bce-v3/` 開頭）
2. 確認已登入並連結專案
3. 檢查網路連線

**重新設置：**
```bash
supabase secrets set BAIDU_API_KEY=bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980
```

### 問題 5：部署失敗

**查看詳細錯誤：**
```bash
supabase functions deploy ask-ai --debug
```

**檢查 Function 代碼：**
確認 `supabase/functions/ask-ai/index.ts` 文件存在且無語法錯誤。

## 📝 完整命令列表

```bash
# 1. 安裝 Supabase CLI
npm install -g supabase

# 2. 登入
supabase login

# 3. 連結專案
supabase link --project-ref naqyczuuariosniudbsr

# 4. 設置 API Key
supabase secrets set BAIDU_API_KEY=bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980

# 5. 部署 Function
supabase functions deploy ask-ai

# 6. 查看日誌
supabase functions logs ask-ai

# 7. 查看環境變數
supabase secrets list
```

## 🎉 設置完成後

設置完成後，您的 AI 聊天機器人應該可以正常運作：

1. ✅ API Key 已設置
2. ✅ Edge Function 已部署
3. ✅ 可以接收和回應訊息

如果遇到任何問題，請參考 `EDGE_FUNCTION_TROUBLESHOOTING.md` 文件。




