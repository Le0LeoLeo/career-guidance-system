# 本地開發指南

## 🚀 快速開始

### 方法 1：使用 PowerShell 腳本（最簡單）

1. 在 PowerShell 中執行：
   ```powershell
   .\dev-server.ps1
   ```

2. 開啟瀏覽器訪問：`http://localhost:8000`

3. 修改代碼後，**重新整理瀏覽器**即可看到更改

4. 按 `Ctrl+C` 停止伺服器

---

### 方法 2：使用 Python 命令（手動）

在 PowerShell 中執行：
```powershell
cd C:\Users\acer\OneDrive\Desktop\AI_proj
python -m http.server 8000
```

**注意**：PowerShell 不支持 `&&` 語法，需要分兩步執行或使用上面的腳本。

---

### 方法 3：使用 Netlify Dev（推薦，可測試 Netlify 功能）

這個方法可以模擬 Netlify 的環境，包括重定向規則等。

#### 安裝 Netlify CLI

```powershell
npm install -g netlify-cli
```

如果沒有 Node.js，可以從 [nodejs.org](https://nodejs.org/) 下載安裝。

#### 使用 Netlify Dev

1. 在項目目錄執行：
   ```powershell
   netlify dev
   ```

2. 首次使用需要登入 Netlify：
   ```powershell
   netlify login
   ```

3. 連結到您的 Netlify 網站：
   ```powershell
   netlify link
   ```

4. 啟動開發伺服器：
   ```powershell
   netlify dev
   ```

這樣可以：
- ✅ 自動重新載入（修改代碼後自動刷新）
- ✅ 測試 Netlify 的重定向規則
- ✅ 測試環境變數（如果有）
- ✅ 模擬生產環境

---

### 方法 4：使用 VS Code Live Server 擴展

如果您使用 VS Code：

1. 安裝 "Live Server" 擴展
2. 右鍵點擊 `index.html`
3. 選擇 "Open with Live Server"
4. 修改代碼後會自動刷新

---

## 📝 開發工作流程建議

### 日常開發流程

1. **本地開發**：使用上述任一方法啟動本地伺服器
2. **測試功能**：在 `http://localhost:8000` 測試所有功能
3. **提交代碼**：確認無誤後，提交到 Git
4. **自動部署**：如果設置了 Netlify 自動部署，推送到 GitHub 後會自動部署

### 部署前檢查清單

- [ ] 本地測試所有功能正常
- [ ] Google 登入功能正常
- [ ] 表單驗證正常
- [ ] 響應式設計正常（測試不同螢幕尺寸）
- [ ] 沒有 Console 錯誤

---

## 🔧 常見問題

### Q: PowerShell 執行腳本時出現「無法載入」錯誤？

**A:** 執行以下命令允許執行腳本：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q: 如何讓瀏覽器自動刷新？

**A:** 
- 使用 Netlify Dev（方法 3）
- 使用 VS Code Live Server（方法 4）
- 或安裝瀏覽器擴展如 "Live Reload"

### Q: 本地開發時 Google 登入無法使用？

**A:** 確保在 Google Cloud Console 中已添加 `http://localhost:8000` 到授權的 JavaScript 來源。

### Q: 修改代碼後沒有看到變化？

**A:** 
- 檢查是否保存了文件（Ctrl+S）
- 強制刷新瀏覽器（Ctrl+F5 或 Ctrl+Shift+R）
- 清除瀏覽器快取

---

## 💡 提示

- **開發時**：使用本地伺服器，快速迭代
- **測試時**：使用 Netlify Dev，模擬生產環境
- **部署時**：推送到 GitHub，讓 Netlify 自動部署

這樣可以大大提高開發效率！🚀

