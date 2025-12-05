# 自動測試指南

本項目已配置自動測試功能，每次修改代碼後會自動運行測試。

## 快速開始

### 1. 安裝依賴

```powershell
npm install
```

### 2. 運行測試的方式

#### 方式一：自動監視模式（推薦）
```powershell
npm run test:watch
```
或使用 PowerShell 腳本：
```powershell
.\watch-tests.ps1
```

這會監視所有 `.js`、`.html`、`.css` 文件的變化，並在文件保存時自動運行測試。

#### 方式二：整合開發環境
```powershell
.\auto-test-dev.ps1
```

這會同時啟動：
- HTTP 開發服務器（http://localhost:8000）
- 自動測試監視器

#### 方式三：單次運行測試
```powershell
npm test
```

#### 方式四：測試 UI（可視化界面）
```powershell
npm run test:ui
```

## 測試文件結構

```
test/
  ├── setup.js          # 測試環境配置
  └── app.test.js       # 應用程式測試
```

## 添加新測試

在 `test/` 目錄下創建新的測試文件，命名格式：`*.test.js` 或 `*.spec.js`

示例：
```javascript
import { describe, it, expect } from 'vitest';

describe('我的功能測試', () => {
  it('應該能夠正常工作', () => {
    expect(true).toBe(true);
  });
});
```

## 測試覆蓋率

運行測試時會自動生成覆蓋率報告：
- 文本報告：終端輸出
- HTML 報告：`coverage/index.html`

## 注意事項

1. **首次運行**：需要先執行 `npm install` 安裝依賴
2. **文件監視**：監視器會自動忽略 `node_modules`、`.git` 等目錄
3. **停止監視**：按 `Ctrl+C` 停止監視器
4. **測試環境**：使用 `jsdom` 模擬瀏覽器環境

## 故障排除

### 問題：找不到 Node.js
**解決方案**：安裝 Node.js (https://nodejs.org/)

### 問題：PowerShell 執行策略錯誤
**解決方案**：以管理員身份運行 PowerShell，執行：
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 問題：測試失敗
**解決方案**：
1. 檢查測試文件語法
2. 確保所有依賴已安裝
3. 查看終端錯誤訊息

## 測試最佳實踐

1. **單元測試**：測試單個函式的功能
2. **集成測試**：測試多個組件協同工作
3. **邊界測試**：測試邊界條件和錯誤情況
4. **保持測試簡單**：每個測試應該只測試一個功能點



