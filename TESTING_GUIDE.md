# AI 聊天功能測試指南

## 📋 測試前準備

### 1. 確認文件完整性

確保以下文件存在：
- ✅ `index.html` - 包含聊天窗口 HTML
- ✅ `style.css` - 包含聊天樣式
- ✅ `app.js` - 包含聊天邏輯
- ✅ `supabase/functions/ask-ai/index.ts` - Edge Function

### 2. 確認 Supabase 配置

檢查 `app.js` 中的 Supabase 配置：
```javascript
const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key';
```

### 3. 部署 Edge Function（如果尚未部署）

```bash
# 設置環境變數（選擇一種方式）

# 方式 1：千帆平台 API Key（推薦）
supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

# 方式 2：OAuth 2.0
supabase secrets set BAIDU_API_KEY=your_api_key
supabase secrets set BAIDU_SECRET_KEY=your_secret_key

# 部署 Function
supabase functions deploy ask-ai
```

## 🧪 測試步驟

### 步驟 1：啟動本地服務器

您已經在運行：
```bash
python -m http.server 8000
```

訪問：`http://localhost:8000`

### 步驟 2：檢查頁面載入

1. 打開瀏覽器開發者工具（F12）
2. 檢查 Console 是否有錯誤
3. 確認右下角出現「AI 諮詢」按鈕

### 步驟 3：測試聊天窗口 UI

1. **點擊「AI 諮詢」按鈕**
   - ✅ 聊天窗口應該從右下角滑入
   - ✅ 標題顯示「AI 生涯導師」
   - ✅ 顯示歡迎訊息

2. **測試關閉按鈕**
   - ✅ 點擊右上角 X 按鈕，窗口應該關閉
   - ✅ 再次點擊「AI 諮詢」按鈕，窗口應該重新打開

3. **檢查輸入框**
   - ✅ 輸入框應該可以輸入文字
   - ✅ 按 Enter 應該發送訊息
   - ✅ 按 Shift+Enter 應該換行

### 步驟 4：測試訊息發送（前端測試）

1. **發送測試訊息**
   - 在輸入框輸入：「你好」
   - 點擊發送按鈕或按 Enter

2. **檢查前端行為**
   - ✅ 用戶訊息應該出現在右側（藍色）
   - ✅ 顯示「AI 正在思考中...」動畫
   - ✅ 輸入框和按鈕應該被禁用

### 步驟 5：測試 API 連接

如果 Edge Function 已部署，測試完整流程：

1. **發送真實問題**
   ```
   我想了解如何準備申請美國研究所
   ```

2. **檢查回應**
   - ✅ AI 應該在幾秒內回覆
   - ✅ AI 訊息應該出現在左側（灰色）
   - ✅ 思考動畫應該消失
   - ✅ 輸入框和按鈕應該恢復可用

3. **測試對話歷史**
   - 發送多條訊息
   - ✅ 對話應該保持上下文
   - ✅ 訊息應該按時間順序顯示

### 步驟 6：測試錯誤處理

1. **測試網路錯誤**
   - 斷開網路連接
   - 發送訊息
   - ✅ 應該顯示錯誤訊息：「抱歉，發生網路錯誤...」

2. **測試 API 錯誤**
   - 如果 Edge Function 未部署或配置錯誤
   - ✅ 應該顯示適當的錯誤訊息

## 🔍 調試技巧

### 檢查瀏覽器 Console

打開開發者工具（F12），查看 Console 輸出：

```javascript
// 應該看到：
// "初始化 AI 聊天功能"
// 發送訊息時應該看到請求日誌
```

### 檢查 Network 標籤

1. 打開 Network 標籤
2. 發送訊息
3. 查找對 `ask-ai` 的請求
4. 檢查：
   - ✅ 請求狀態（應該是 200）
   - ✅ 請求體（包含 prompt 和 history）
   - ✅ 回應內容

### 檢查 Supabase Function 日誌

```bash
# 查看實時日誌
supabase functions logs ask-ai --follow

# 查看最近的日誌
supabase functions logs ask-ai
```

## ✅ 測試檢查清單

### UI 測試
- [ ] 聊天按鈕顯示在右下角
- [ ] 點擊按鈕打開/關閉聊天窗口
- [ ] 聊天窗口樣式正確（圓角、陰影、漸變）
- [ ] 歡迎訊息顯示
- [ ] 輸入框可以輸入文字
- [ ] 發送按鈕可以點擊
- [ ] 思考動畫正常顯示

### 功能測試
- [ ] 可以發送訊息
- [ ] 用戶訊息顯示在右側
- [ ] AI 訊息顯示在左側
- [ ] 訊息時間戳顯示
- [ ] 對話歷史保存
- [ ] Enter 鍵發送訊息
- [ ] Shift+Enter 換行
- [ ] 輸入框自動調整高度

### API 測試
- [ ] 可以成功調用 Edge Function
- [ ] 收到 AI 回覆
- [ ] 錯誤處理正常
- [ ] 網路錯誤處理正常
- [ ] 對話上下文保持

### 響應式測試
- [ ] 手機端顯示正常
- [ ] 平板端顯示正常
- [ ] 桌面端顯示正常
- [ ] 聊天窗口在不同螢幕尺寸下正常

## 🐛 常見問題排查

### 問題 1：聊天按鈕不顯示

**檢查：**
1. 確認 `style.css` 已載入
2. 檢查 Console 是否有 JavaScript 錯誤
3. 確認 `app.js` 中的 `initAIChatbot()` 被調用

**解決：**
```javascript
// 在 Console 中手動調用
initAIChatbot();
```

### 問題 2：發送訊息沒有回應

**檢查：**
1. 確認 Supabase 已初始化
2. 檢查 Edge Function 是否已部署
3. 查看 Network 標籤中的請求狀態

**解決：**
```bash
# 重新部署 Edge Function
supabase functions deploy ask-ai

# 檢查環境變數
supabase secrets list
```

### 問題 3：API 認證失敗

**檢查：**
1. 確認環境變數已設置
2. 檢查 API Key 格式是否正確

**解決：**
```bash
# 重新設置環境變數
supabase secrets set BAIDU_API_KEY=bce-v3/your_key

# 重新部署
supabase functions deploy ask-ai
```

### 問題 4：訊息不顯示

**檢查：**
1. 確認 `addMessage()` 函數正常工作
2. 檢查 DOM 元素是否存在
3. 查看 Console 是否有錯誤

**解決：**
```javascript
// 在 Console 中測試
addMessage('user', '測試訊息');
addMessage('assistant', '測試回覆');
```

## 📊 性能測試

### 測試響應時間

1. 發送訊息
2. 記錄從發送到收到回覆的時間
3. 正常情況下應該在 2-5 秒內

### 測試並發

1. 快速發送多條訊息
2. 確認每條訊息都能正確處理
3. 確認不會出現重複回應

## 🎯 測試場景示例

### 場景 1：基本對話
```
用戶：你好
AI：您好！我是 AI 生涯導師...
```

### 場景 2：職涯諮詢
```
用戶：我想了解如何準備申請美國研究所
AI：[提供詳細建議]
```

### 場景 3：多輪對話
```
用戶：我對程式設計有興趣
AI：[回應]
用戶：但我不知道應該選擇哪個方向
AI：[基於上下文回應]
```

## ✨ 測試完成後

如果所有測試通過，您的 AI 聊天功能已經準備就緒！

如果遇到問題，請：
1. 檢查 Console 錯誤訊息
2. 查看 Network 請求詳情
3. 檢查 Supabase Function 日誌
4. 參考 `SUPABASE_EDGE_FUNCTION_SETUP.md` 進行配置

祝測試順利！🚀

