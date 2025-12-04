# Edge Function 错误快速修复指南

## 🔴 错误：Failed to send a request to the Edge Function

如果您在测试页面看到这个错误，请按照以下步骤快速修复：

## ⚡ 快速修复步骤

### 步骤 1：使用诊断功能

1. 打开测试页面：`http://localhost:8000/test_qianfan_api.html`
2. 填写 Supabase URL 和 Anon Key
3. 点击 **"🔍 诊断连接"** 按钮
4. 查看诊断结果，了解具体问题

### 步骤 2：检查 Edge Function 是否已部署

在终端执行：

```bash
# 如果已安装 Supabase CLI
supabase functions list

# 如果没有安装，请先安装
npm install -g supabase
```

**如果看到 `ask-ai` 在列表中** → 跳到步骤 3  
**如果没有看到 `ask-ai`** → 执行部署：

```bash
# 1. 确认已登入
supabase login

# 2. 确认专案已连结
supabase link --project-ref naqyczuuariosniudbsr

# 3. 部署 Edge Function
supabase functions deploy ask-ai
```

### 步骤 3：检查环境变量

```bash
# 查看已设置的环境变量
supabase secrets list
```

**应该看到：**
- `BAIDU_API_KEY` ✅
- `BAIDU_SECRET_KEY` ✅（如果使用 OAuth 2.0）

**如果没有，请设置：**

```bash
# 方式 1：千帆平台 API Key（推荐）
supabase secrets set BAIDU_API_KEY=bce-v3/your_api_key_here

# 方式 2：OAuth 2.0
supabase secrets set BAIDU_API_KEY=your_api_key
supabase secrets set BAIDU_SECRET_KEY=your_secret_key
```

### 步骤 4：重新部署（如果修改了环境变量）

```bash
supabase functions deploy ask-ai
```

### 步骤 5：测试 Edge Function

```bash
supabase functions invoke ask-ai \
  --body '{"prompt": "测试", "history": []}'
```

**如果成功** → 您应该看到 AI 的回应  
**如果失败** → 查看错误信息并参考下方故障排除

## 🔍 常见错误和解决方案

### 错误 1：404 Not Found

**原因：** Edge Function 未部署

**解决方案：**
```bash
supabase functions deploy ask-ai
```

### 错误 2：500 Internal Server Error

**原因：** 
- 环境变量未设置
- API Key 无效
- Edge Function 代码有错误

**解决方案：**
1. 检查环境变量：`supabase secrets list`
2. 设置环境变量：`supabase secrets set BAIDU_API_KEY=your_key`
3. 查看日志：`supabase functions logs ask-ai`
4. 重新部署：`supabase functions deploy ask-ai`

### 错误 3：Failed to send a request

**原因：**
- 网络连接问题
- Supabase URL 不正确
- CORS 配置问题

**解决方案：**
1. 检查 Supabase URL 格式（应该是：`https://xxx.supabase.co`）
2. 检查网络连接
3. 查看浏览器 Console 和 Network 标签
4. 确认 Supabase Anon Key 正确

### 错误 4：TypeError: Failed to fetch

**原因：**
- 网络请求被阻止
- CORS 问题
- 浏览器安全策略

**解决方案：**
1. 检查浏览器 Console 是否有 CORS 错误
2. 确认 Supabase URL 正确
3. 尝试使用不同的浏览器
4. 检查防火墙或代理设置

## 🛠️ 浏览器诊断

### 方法 1：使用测试页面的诊断功能

1. 打开测试页面
2. 点击 **"🔍 诊断连接"** 按钮
3. 查看诊断结果

### 方法 2：手动诊断

在浏览器 Console 中执行：

```javascript
// 检查 Supabase 配置
const supabaseUrl = document.getElementById('supabase-url').value;
const supabaseKey = document.getElementById('supabase-key').value;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '已填写' : '未填写');

// 测试 Edge Function 连接
const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

supabase.functions.invoke('ask-ai', {
  body: { prompt: '测试', history: [] }
}).then(({ data, error }) => {
  if (error) {
    console.error('❌ 错误：', error);
  } else {
    console.log('✅ 成功：', data);
  }
});
```

### 方法 3：检查网络请求

1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 点击测试按钮
4. 查看是否有对 `/functions/v1/ask-ai` 的请求
5. 检查请求状态码和响应

## 📋 检查清单

在报告问题之前，请确认：

- [ ] Supabase URL 格式正确（`https://xxx.supabase.co`）
- [ ] Supabase Anon Key 已填写
- [ ] Edge Function 已部署（`supabase functions list`）
- [ ] 环境变量已设置（`supabase secrets list`）
- [ ] 网络连接正常
- [ ] 浏览器 Console 没有其他错误
- [ ] 已尝试使用诊断功能

## 📚 相关文档

- `QUICK_FIX_EDGE_FUNCTION.md` - 详细故障排除指南
- `SUPABASE_EDGE_FUNCTION_SETUP.md` - Edge Function 设置指南
- `TEST_PAGE_README.md` - 测试页面使用说明

## 💡 提示

- 使用测试页面的 **"🔍 诊断连接"** 功能可以快速定位问题
- 查看浏览器 Console 和 Network 标签获取详细错误信息
- 如果问题持续，请查看 Supabase 日志：`supabase functions logs ask-ai`

---

**如果以上步骤都无法解决问题，请：**
1. 收集错误信息（浏览器 Console、Network 标签）
2. 运行诊断功能并截图
3. 查看 Supabase 日志
4. 参考 `QUICK_FIX_EDGE_FUNCTION.md` 获取更多帮助

