# 🔧 修复 FunctionsFetchError 错误

## 错误信息
```
FunctionsFetchError: Failed to send a request to the Edge Function
```

这个错误表示无法连接到 Supabase Edge Function。通常是因为 Edge Function 未部署。

## ⚡ 快速修复步骤

### 步骤 1：安装 Supabase CLI

在 PowerShell 中执行：

```powershell
# 方式 1：使用 npm（如果已安装 Node.js）
npm install -g supabase

# 方式 2：使用 Scoop（如果已安装 Scoop）
scoop install supabase

# 方式 3：使用 Chocolatey（如果已安装 Chocolatey）
choco install supabase
```

**验证安装：**
```powershell
supabase --version
```

### 步骤 2：登录 Supabase

```powershell
supabase login
```

这会打开浏览器，让您登录 Supabase 账户。

### 步骤 3：链接到您的项目

```powershell
supabase link --project-ref naqyczuuariosniudbsr
```

**注意：** 如果提示需要 access token，请：
1. 访问 https://supabase.com/dashboard/account/tokens
2. 创建一个新的 access token
3. 使用 `supabase login --token YOUR_TOKEN` 登录

### 步骤 4：设置环境变量

```powershell
# 设置百度 API Key（千帆平台格式）
supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

# 或者使用 OAuth 2.0 方式
supabase secrets set BAIDU_API_KEY=your_api_key
supabase secrets set BAIDU_SECRET_KEY=your_secret_key
```

**获取 API Key：**
- 访问：https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application
- 创建应用后，在"应用接入"中获取 API Key

### 步骤 5：部署 Edge Function

```powershell
supabase functions deploy ask-ai
```

**如果遇到错误，尝试：**
```powershell
# 指定项目
supabase functions deploy ask-ai --project-ref naqyczuuariosniudbsr
```

### 步骤 6：验证部署

```powershell
# 列出所有已部署的 Edge Functions
supabase functions list

# 测试 Edge Function
supabase functions invoke ask-ai --body '{\"prompt\": \"测试\", \"history\": []}'
```

### 步骤 7：在测试页面验证

1. 打开测试页面：`http://localhost:8000/test_qianfan_api.html`
2. 填写 Supabase URL：`https://naqyczuuariosniudbsr.supabase.co`
3. 填写 Supabase Anon Key（在 Supabase Dashboard → Settings → API 中获取）
4. 点击 **"🔍 诊断连接"** 按钮
5. 如果诊断通过，点击 **"🚀 测试 Edge Function 调用"**

## 🔍 故障排除

### 问题 1：`supabase: 无法识别命令`

**解决方案：**
```powershell
# 检查 Node.js 是否安装
node --version

# 如果未安装，请先安装 Node.js
# 然后安装 Supabase CLI
npm install -g supabase

# 如果 npm 命令不可用，可能需要重启 PowerShell
```

### 问题 2：`Error: Invalid API key`

**解决方案：**
1. 检查 API Key 格式是否正确
2. 千帆平台格式应该是：`bce-v3/xxx`
3. 确保没有多余的空格或引号

### 问题 3：`Error: Function not found`

**解决方案：**
1. 确认 Edge Function 已部署：`supabase functions list`
2. 确认函数名称是 `ask-ai`（不是 `ask_ai` 或其他）
3. 重新部署：`supabase functions deploy ask-ai`

### 问题 4：`Error: Unauthorized`

**解决方案：**
1. 检查 Supabase Anon Key 是否正确
2. 在 Supabase Dashboard → Settings → API 中获取正确的 Anon Key
3. 确保 Anon Key 有调用 Edge Functions 的权限

### 问题 5：部署成功但测试失败

**解决方案：**
1. 检查环境变量：`supabase secrets list`
2. 查看日志：`supabase functions logs ask-ai`
3. 确认 API Key 有效（可以在浏览器中直接测试百度 API）

## 📋 完整检查清单

在报告问题之前，请确认：

- [ ] Supabase CLI 已安装（`supabase --version`）
- [ ] 已登录 Supabase（`supabase login`）
- [ ] 已链接到项目（`supabase link --project-ref naqyczuuariosniudbsr`）
- [ ] 环境变量已设置（`supabase secrets list`）
- [ ] Edge Function 已部署（`supabase functions list`）
- [ ] Supabase URL 正确（`https://naqyczuuariosniudbsr.supabase.co`）
- [ ] Supabase Anon Key 正确（在 Dashboard 中获取）
- [ ] 百度 API Key 有效（可以在浏览器中测试）

## 🛠️ 手动验证步骤

### 1. 检查 Edge Function 是否已部署

在浏览器中访问：
```
https://naqyczuuariosniudbsr.supabase.co/functions/v1/ask-ai
```

**如果返回 404** → Edge Function 未部署  
**如果返回 401/403** → 需要正确的 Anon Key  
**如果返回 500** → Edge Function 代码或环境变量有问题

### 2. 使用 curl 测试（如果已安装）

```powershell
# 替换 YOUR_ANON_KEY 为实际的 Anon Key
$headers = @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
}
$body = @{
    prompt = "测试"
    history = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://naqyczuuariosniudbsr.supabase.co/functions/v1/ask-ai" -Method Post -Headers $headers -Body $body
```

### 3. 查看 Supabase 日志

```powershell
supabase functions logs ask-ai --follow
```

然后尝试调用 Edge Function，查看实时日志。

## 📚 相关文档

- `EDGE_FUNCTION_ERROR_FIX.md` - 详细错误修复指南
- `SUPABASE_EDGE_FUNCTION_SETUP.md` - Edge Function 设置指南
- `QUICK_FIX_EDGE_FUNCTION.md` - 快速修复指南

## 💡 提示

1. **使用诊断功能**：测试页面的"🔍 诊断连接"按钮可以快速定位问题
2. **查看浏览器 Console**：按 F12 打开开发者工具，查看详细错误信息
3. **检查 Network 标签**：查看实际的 HTTP 请求和响应
4. **查看 Supabase Dashboard**：在 Dashboard → Edge Functions 中查看部署状态

---

**如果以上步骤都无法解决问题，请：**
1. 运行诊断功能并截图
2. 查看 Supabase 日志：`supabase functions logs ask-ai`
3. 检查浏览器 Console 和 Network 标签
4. 提供完整的错误信息

