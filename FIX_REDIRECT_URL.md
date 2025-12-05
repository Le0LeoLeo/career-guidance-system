# 🔧 修復重定向 URL 錯誤

## 問題描述

當您使用 Google 登入時，可能會看到以下錯誤：
- `ERR_CONNECTION_REFUSED` 
- `localhost:3000 拒絕連線`
- 瀏覽器嘗試連接到 `localhost:3000` 而不是 `localhost:8000`

## 原因

這是因為 Supabase Dashboard 中的 **Site URL** 或 **Redirect URLs** 配置指向了錯誤的端口（3000 而不是 8000）。

## ✅ 解決方法

### 步驟 1：前往 Supabase Authentication 設定

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案：`naqyczuuariosniudbsr`
3. 左側選單 → **Authentication**（認證）
4. 點擊 **URL Configuration**（URL 配置）標籤

### 步驟 2：設定 Site URL

在 **Site URL** 欄位中，填入：

**本地開發環境：**
```
http://localhost:8000
```

**Netlify 生產環境：**
```
https://sage-lily-4d882e.netlify.app
```

（或您的實際 Netlify URL）

### 步驟 3：設定 Redirect URLs（重定向 URL）

在 **Redirect URLs** 區域，點擊 **+ Add URL**，新增以下 URL：

**本地開發環境：**
```
http://localhost:8000
http://localhost:8000/*
http://127.0.0.1:8000
http://127.0.0.1:8000/*
```

**Netlify 生產環境：**
```
https://sage-lily-4d882e.netlify.app
https://sage-lily-4d882e.netlify.app/*
```

**重要：** 如果列表中有 `localhost:3000`，請**刪除它**！

### 步驟 4：儲存設定

1. 點擊 **Save**（儲存）按鈕
2. 等待幾秒鐘讓設定生效

### 步驟 5：清除瀏覽器快取

1. 按 `Ctrl + Shift + Delete`（Windows）或 `Cmd + Shift + Delete`（Mac）
2. 選擇「快取的圖片和檔案」
3. 點擊「清除資料」

或者直接使用**無痕模式**測試。

### 步驟 6：重新測試

1. 確保本地伺服器運行在 `localhost:8000`：
   ```powershell
   python -m http.server 8000
   ```

2. 打開瀏覽器，前往：`http://localhost:8000`

3. 點擊「使用 Google 登入」

4. 現在應該會正確重定向回 `localhost:8000` 而不是 `localhost:3000`

---

## 📸 設定位置截圖說明

在 Supabase Dashboard 中，您應該會看到：

```
Authentication
├── Users
├── Policies
├── Providers
└── URL Configuration  ← 點擊這裡！
    ├── Site URL: [http://localhost:8000]
    └── Redirect URLs:
        ├── http://localhost:8000
        ├── http://localhost:8000/*
        └── https://sage-lily-4d882e.netlify.app
```

---

## ⚠️ 重要提醒

1. **不要使用 `localhost:3000`**：您的應用運行在 `8000` 端口，不是 `3000`

2. **本地和生產環境都要設定**：如果您同時在本地開發和 Netlify 部署，兩個環境的 URL 都要加入

3. **使用萬用字元**：`http://localhost:8000/*` 可以匹配所有以該 URL 開頭的路徑

4. **設定生效時間**：通常立即生效，但可能需要等待 1-2 分鐘

---

## 🔍 驗證設定是否正確

設定完成後，您可以：

1. 檢查瀏覽器 Console（F12）：
   - 不應該看到 `localhost:3000` 相關的錯誤
   - 應該看到成功重定向到 `localhost:8000`

2. 檢查 Supabase Authentication Logs：
   - Supabase Dashboard → Authentication → Logs
   - 查看登入記錄，確認重定向 URL 正確

---

## ❓ 如果問題仍然存在

1. **確認本地伺服器端口**：
   ```powershell
   # 確認伺服器運行在 8000 端口
   python -m http.server 8000
   ```

2. **檢查 app.js 中的重定向設定**：
   ```javascript
   // 應該使用動態 URL，不需要手動修改
   redirectTo: `${window.location.origin}${window.location.pathname}`
   ```

3. **清除所有瀏覽器資料**：
   - 清除快取、Cookie、本地儲存
   - 或使用無痕模式

4. **檢查 Google OAuth 設定**：
   - 確認 Google Cloud Platform 中的「已授權的重新導向 URI」包含正確的 URL
   - 詳見：`GOOGLE_LOGIN_SETUP.md`

---

## ✅ 完成檢查清單

- [ ] 已在 Supabase Dashboard → Authentication → URL Configuration 設定 Site URL
- [ ] 已新增正確的 Redirect URLs（包含 `localhost:8000`）
- [ ] 已刪除錯誤的 `localhost:3000` URL（如果存在）
- [ ] 已儲存設定
- [ ] 已清除瀏覽器快取或使用無痕模式
- [ ] 已重新測試 Google 登入功能
- [ ] 確認重定向到 `localhost:8000` 而不是 `localhost:3000`

---

完成以上步驟後，您的 Google 登入應該可以正常工作了！🎉

