# 🚀 Edge Function 部署指南

## 问题：Edge Function 未部署

如果遇到 `FunctionsFetchError` 错误，通常是因为 Edge Function 未部署。

## 📋 部署步骤

### 方法 1：使用 PowerShell 脚本（推荐）

在 **PowerShell** 中运行（**不是命令提示符**）：

```powershell
.\deploy-edge-function.ps1
```

### 方法 2：手动部署

#### 步骤 1：安装 Supabase CLI

**Windows 用户：**

由于 Supabase CLI 不支持通过 npm 全局安装，请使用以下方法之一：

**选项 A：使用 npx（推荐，无需安装）**

直接使用 `npx` 运行命令，无需全局安装：

```powershell
# 所有命令都使用 npx supabase 而不是 supabase
npx supabase --version
```

**选项 B：使用 Scoop 安装**

```powershell
# 安装 Scoop（如果未安装）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 添加 Supabase bucket
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# 安装 Supabase CLI
scoop install supabase
```

**选项 C：下载二进制文件**

从 [Supabase CLI Releases](https://github.com/supabase/cli/releases) 下载 Windows 版本。

#### 步骤 2：登录 Supabase

在 PowerShell 中运行：

```powershell
# 使用 npx
npx supabase login

# 或如果已全局安装
supabase login
```

这会打开浏览器，完成登录后返回终端。

#### 步骤 3：链接到项目

```powershell
# 使用 npx
npx supabase link --project-ref naqyczuuariosniudbsr

# 或如果已全局安装
supabase link --project-ref naqyczuuariosniudbsr
```

#### 步骤 4：设置环境变量（API Key）

```powershell
# 使用 npx
npx supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

# 或如果已全局安装
supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here
```

**重要：** 将 `your_api_key_here` 替换为您的实际百度 API Key。

#### 步骤 5：部署 Edge Function

```powershell
# 使用 npx
npx supabase functions deploy ask-ai

# 或如果已全局安装
supabase functions deploy ask-ai
```

#### 步骤 6：验证部署

```powershell
# 使用 npx
npx supabase functions list

# 或如果已全局安装
supabase functions list
```

应该看到 `ask-ai` 函数在列表中。

## ✅ 验证部署成功

部署成功后：

1. 打开测试页面：`http://localhost:8000/test_qianfan_api.html`
2. 填写 Supabase URL：`https://naqyczuuariosniudbsr.supabase.co`
3. 填写 Supabase Anon Key（在 Supabase Dashboard → Settings → API 中获取）
4. 点击 "🔍 诊断连接" 按钮
5. 如果诊断通过，点击 "🚀 测试 Edge Function 调用"

## 🔧 故障排除

### 问题 1：登录失败

如果 `supabase login` 无法打开浏览器，可以手动获取 token：

1. 访问：https://supabase.com/dashboard/account/tokens
2. 创建新的 access token
3. 设置环境变量：
   ```powershell
   $env:SUPABASE_ACCESS_TOKEN="your_token_here"
   ```

### 问题 2：链接项目失败

确保项目 ID 正确：`naqyczuuariosniudbsr`

如果项目 ID 不同，请在 Supabase Dashboard 中查看：
- 进入项目设置
- 查看 "Reference ID"

### 问题 3：部署失败

检查：
1. Edge Function 代码是否存在：`supabase/functions/ask-ai/index.ts`
2. 环境变量是否设置：`supabase secrets list`
3. 查看详细错误：`supabase functions deploy ask-ai --debug`

### 问题 4：仍然出现 FunctionsFetchError

1. **确认部署成功**：运行 `supabase functions list` 确认 `ask-ai` 在列表中
2. **检查 Supabase URL**：确保使用正确的 URL（格式：`https://xxx.supabase.co`）
3. **检查 Anon Key**：确保使用正确的 Anon Key（不是 Service Role Key）
4. **等待几分钟**：部署后可能需要几分钟才能生效
5. **清除浏览器缓存**：刷新页面或清除缓存

## 📚 相关文档

- `FIX_FUNCTIONSFETCHERROR.md` - 完整修复指南
- `EDGE_FUNCTION_ERROR_FIX.md` - 错误修复指南
- `deploy-edge-function.ps1` - 自动部署脚本

## 🆘 需要帮助？

如果仍然遇到问题：

1. 查看 Supabase 日志：`supabase functions logs ask-ai`
2. 检查浏览器 Console 获取详细错误信息
3. 查看 `FIX_FUNCTIONSFETCHERROR.md` 获取更多故障排除步骤

