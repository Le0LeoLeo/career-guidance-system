# 🔧 Supabase 連接問題故障排除指南

如果您的網頁無法正常使用，即使已設定 Supabase URL，請按照以下步驟進行診斷和修復。

## 🚨 快速診斷

### 步驟 1：使用診斷腳本

1. 打開您的網頁（Netlify 或 localhost）
2. 按 `F12` 打開開發者工具
3. 切換到 **Console** 標籤
4. 複製 `browser-diagnose-supabase.js` 的所有內容
5. 貼上到 Console 並按 Enter
6. 執行：`diagnoseSupabaseConnection()`

診斷腳本會自動檢查：
- ✅ Supabase URL 和 Key 配置
- ✅ Supabase 客戶端初始化
- ✅ 網路連接
- ✅ CORS 設定
- ✅ 認證狀態
- ✅ Edge Function 連接
- ✅ 瀏覽器錯誤

## 🔍 常見問題與解決方案

### 問題 1：Supabase 客戶端未初始化

**症狀：**
- 控制台顯示：`Supabase 客戶端未初始化`
- 頁面功能無法使用

**可能原因：**
1. Supabase SDK 未載入
2. `app.js` 中的初始化代碼有錯誤
3. 頁面載入順序問題

**解決方案：**

#### 檢查 1：確認 Supabase SDK 已載入

打開 `index.html`，確認有以下代碼：

```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**位置：** 應該在 `</head>` 之前或 `<body>` 開始處。

#### 檢查 2：確認 app.js 中的初始化代碼

打開 `app.js`，確認在 `DOMContentLoaded` 事件中有初始化代碼：

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  // ... 其他代碼 ...
  
  // 初始化 Supabase
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else if (typeof supabase !== 'undefined') {
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase 尚未載入或 URL/Key 未設定，部分功能將無法使用');
  }
  
  // ... 其他代碼 ...
});
```

#### 檢查 3：確認腳本載入順序

在 `index.html` 中，確認腳本載入順序：

```html
<!-- 1. 先載入 Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. 再載入您的 app.js -->
<script src="app.js"></script>
```

---

### 問題 2：CORS 錯誤

**症狀：**
- 控制台顯示：`Access to fetch ... has been blocked by CORS policy`
- 無法連接到 Supabase API

**解決方案：**

1. **前往 Supabase Dashboard**
   - 登入 https://app.supabase.com
   - 選擇您的專案

2. **設定 CORS**
   - 前往 **Settings** → **API**
   - 找到 **Additional Allowed Origins** 或 **CORS** 設定
   - 添加您的網域：
     ```
     http://localhost:8000
     https://sage-lily-4d882e.netlify.app
     ```

3. **儲存設定**
   - 點擊 **Save**
   - 等待幾秒鐘讓設定生效

4. **清除瀏覽器快取**
   - 按 `Ctrl + Shift + Delete`
   - 清除快取
   - 重新載入頁面

---

### 問題 3：認證重定向失敗

**症狀：**
- 登入後無法重定向
- 顯示錯誤：`redirect_uri_mismatch`

**解決方案：**

1. **前往 Supabase Dashboard**
   - **Authentication** → **URL Configuration**

2. **設定 Site URL**
   ```
   https://sage-lily-4d882e.netlify.app
   ```
   或（用於本地開發）
   ```
   http://localhost:8000
   ```

3. **設定 Redirect URLs**
   添加以下所有 URL：
   ```
   http://localhost:8000
   http://localhost:8000/*
   https://sage-lily-4d882e.netlify.app
   https://sage-lily-4d882e.netlify.app/*
   ```

4. **儲存並測試**

詳細說明請參考：[FIX_REDIRECT_URL.md](./FIX_REDIRECT_URL.md)

---

### 問題 4：網路連接失敗

**症狀：**
- 控制台顯示：`Failed to fetch` 或 `NetworkError`
- 無法連接到 Supabase

**可能原因：**
1. 網路連接問題
2. Supabase URL 不正確
3. 防火牆或代理設定

**解決方案：**

#### 檢查 1：驗證 Supabase URL

確認 `app.js` 中的 URL 格式正確：

```javascript
const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
```

**格式應該是：** `https://[專案ID].supabase.co`

#### 檢查 2：測試 Supabase 連接

在瀏覽器控制台執行：

```javascript
fetch('https://naqyczuuariosniudbsr.supabase.co', { method: 'HEAD' })
  .then(() => console.log('✅ 可以連接到 Supabase'))
  .catch(err => console.error('❌ 無法連接：', err));
```

#### 檢查 3：檢查網路設定

- 確認網路連接正常
- 檢查是否有 VPN 或代理
- 嘗試使用不同的網路（例如：手機熱點）

---

### 問題 5：Edge Function 無法使用

**症狀：**
- AI 功能無法運作
- 控制台顯示：`Function not found` 或 `404`

**解決方案：**

1. **確認 Edge Function 已部署**

   在終端執行：
   ```bash
   supabase functions list
   ```

   應該看到 `ask-ai` 和 `process-schedule`。

2. **如果未部署，執行部署：**

   ```bash
   # 登入 Supabase
   supabase login
   
   # 連結專案
   supabase link --project-ref naqyczuuariosniudbsr
   
   # 部署 Edge Function
   supabase functions deploy ask-ai
   supabase functions deploy process-schedule
   ```

3. **檢查 Edge Function 日誌：**

   ```bash
   supabase functions logs ask-ai
   ```

詳細說明請參考：[SUPABASE_EDGE_FUNCTION_SETUP.md](./SUPABASE_EDGE_FUNCTION_SETUP.md)

---

### 問題 6：Supabase URL 或 Key 錯誤

**症狀：**
- 所有功能都無法使用
- 認證失敗

**解決方案：**

1. **前往 Supabase Dashboard**
   - **Settings** → **API**

2. **複製正確的 URL 和 Key**
   - **Project URL**: `https://naqyczuuariosniudbsr.supabase.co`
   - **anon public key**: 長字串（以 `eyJ...` 開頭）

3. **更新 app.js**

   ```javascript
   const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

4. **重新部署到 Netlify**
   - 推送到 GitHub
   - Netlify 會自動重新部署

---

## 🔄 完整檢查清單

按照以下清單逐一檢查：

### 配置檢查
- [ ] `app.js` 中的 `SUPABASE_URL` 正確
- [ ] `app.js` 中的 `SUPABASE_ANON_KEY` 正確
- [ ] `index.html` 中已載入 Supabase SDK
- [ ] 腳本載入順序正確（Supabase SDK 在 app.js 之前）

### Supabase Dashboard 設定
- [ ] CORS 設定包含您的網域
- [ ] Site URL 已設定
- [ ] Redirect URLs 包含所有需要的 URL
- [ ] Edge Function 已部署

### 網路和瀏覽器
- [ ] 網路連接正常
- [ ] 瀏覽器控制台沒有錯誤
- [ ] 已清除瀏覽器快取
- [ ] 嘗試使用無痕模式測試

### 功能測試
- [ ] 可以訪問網頁
- [ ] 可以登入
- [ ] 登入後可以正常使用功能
- [ ] AI 功能可以正常運作

---

## 🛠️ 進階診斷

### 使用瀏覽器開發者工具

1. **Network 標籤**
   - 檢查所有 Supabase 請求
   - 查看狀態碼（應該是 200）
   - 檢查請求 URL 是否正確

2. **Console 標籤**
   - 查看所有錯誤訊息
   - 執行診斷腳本
   - 檢查 Supabase 客戶端是否初始化

3. **Application 標籤**
   - 檢查 Local Storage
   - 查看 Supabase 的認證 token

### 檢查 Supabase 專案狀態

1. 前往 Supabase Dashboard
2. 檢查專案是否正常運行
3. 查看 **Logs** 標籤中的錯誤訊息
4. 檢查 **Database** 標籤確認表格存在

---

## 📞 獲取幫助

如果以上步驟都無法解決問題：

1. **執行診斷腳本**並截圖結果
2. **檢查瀏覽器控制台**並截圖錯誤訊息
3. **檢查 Supabase Dashboard** 中的 Logs
4. **查看相關文件**：
   - [VERIFY_NETLIFY_SUPABASE.md](./VERIFY_NETLIFY_SUPABASE.md)
   - [FIX_REDIRECT_URL.md](./FIX_REDIRECT_URL.md)
   - [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - [EDGE_FUNCTION_TROUBLESHOOTING.md](./EDGE_FUNCTION_TROUBLESHOOTING.md)

---

## ✅ 成功指標

當所有問題解決後，您應該能夠：

- ✅ 正常訪問網頁
- ✅ 成功登入
- ✅ 查看個人資料
- ✅ 使用 AI 功能
- ✅ 瀏覽資源
- ✅ 所有功能正常運作

---

**記住：** 大多數問題都是配置問題，按照檢查清單逐一確認即可解決！






