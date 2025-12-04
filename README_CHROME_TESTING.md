# Chrome DevTools 自動測試指南

本項目使用 **Chrome DevTools MCP** 進行自動化測試，無需安裝額外的測試框架。

## 🚀 快速開始

### 1. 啟動開發服務器

```powershell
python -m http.server 8000
```

### 2. 啟動自動測試監視器

```powershell
.\chrome-auto-test.ps1
```

這個腳本會監視代碼文件變化，當你修改代碼時會提示你運行測試。

### 3. 在 Cursor 中使用 Chrome DevTools

當文件變化時，告訴 AI 助手：
- **"重新載入頁面並運行測試"**
- **"檢查頁面狀態"**
- **"運行所有測試"**

## 🧪 測試功能

### 自動測試項目

1. **頁面標題測試** - 檢查頁面標題是否正確
2. **DOM 元素存在測試** - 檢查所有必需的 DOM 元素是否存在
3. **Supabase 初始化測試** - 檢查 Supabase 是否正確載入
4. **當前視圖測試** - 檢查當前顯示的視圖
5. **控制台錯誤檢查** - 檢查是否有 JavaScript 錯誤

### 手動測試

你還可以使用 Chrome DevTools 手動測試：

```javascript
// 在瀏覽器控制台運行
ChromeTests.runAll()
```

## 📋 可用的 Chrome DevTools 命令

在 Cursor 中，AI 助手可以使用以下命令：

| 命令 | 功能 |
|------|------|
| `navigate_page` | 重新載入頁面 |
| `take_snapshot` | 獲取頁面結構快照 |
| `evaluate_script` | 在頁面中執行 JavaScript |
| `take_screenshot` | 截圖 |
| `list_console_messages` | 查看控制台消息 |
| `list_network_requests` | 查看網絡請求 |

## 🔄 工作流程

1. **修改代碼** → 保存文件
2. **監視器檢測變化** → 顯示提示
3. **告訴 AI** → "重新載入頁面並運行測試"
4. **AI 執行** → 使用 Chrome DevTools 重新載入並測試
5. **查看結果** → 測試結果會顯示在對話中

## 📝 測試腳本位置

- `chrome-test-runner.js` - 可在瀏覽器中運行的測試函數
- `chrome-test-function.js` - 用於 Chrome DevTools MCP 的測試函數

## 🎯 測試示例

### 示例 1: 基本頁面測試

```javascript
// 通過 Chrome DevTools evaluate_script 運行
() => {
  return {
    title: document.title,
    hasLoginView: !!document.getElementById('login-view'),
    hasDashboard: !!document.getElementById('dashboard-view')
  };
}
```

### 示例 2: 視圖切換測試

```javascript
// 測試視圖切換功能
() => {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  
  // 模擬切換
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
  
  return {
    loginVisible: loginView.style.display === 'block',
    dashboardHidden: dashboardView.style.display === 'none'
  };
}
```

## 💡 提示

1. **實時測試**：修改代碼後立即測試，無需手動刷新
2. **視覺化檢查**：使用 `take_screenshot` 查看頁面外觀
3. **錯誤追蹤**：使用 `list_console_messages` 查看 JavaScript 錯誤
4. **網絡監控**：使用 `list_network_requests` 檢查 API 調用

## 🔧 故障排除

### 問題：頁面無法載入
- 檢查開發服務器是否運行在 `http://localhost:8000`
- 檢查防火牆設置

### 問題：測試失敗
- 查看控制台錯誤：`list_console_messages`
- 檢查頁面快照：`take_snapshot`
- 查看網絡請求：`list_network_requests`

### 問題：Chrome DevTools 未連接
- 確保 Chrome DevTools MCP 服務已啟動
- 檢查 Cursor 設置中的 MCP 配置

## 📊 測試結果格式

測試結果會以 JSON 格式返回：

```json
{
  "summary": {
    "passed": 3,
    "total": 4,
    "percentage": "75.0%",
    "timestamp": "2024-12-04T14:04:25.387Z"
  },
  "results": {
    "pageLoad": { "name": "...", "passed": true },
    "domElements": { "name": "...", "passed": true },
    ...
  }
}
```

## 🎉 優勢

✅ **無需安裝** - 不需要 Node.js 或測試框架  
✅ **實時測試** - 代碼變化立即測試  
✅ **視覺化** - 可以直接看到頁面狀態  
✅ **集成** - 與 Cursor AI 完美集成  
✅ **靈活** - 可以測試任何 JavaScript 功能  

