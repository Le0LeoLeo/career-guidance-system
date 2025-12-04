# Edge Function 错误诊断指南

## 错误：Edge Function returned a non-2xx status code

这个错误表示 Edge Function 被调用了，但返回了错误状态码（400、500 等）。

## 快速诊断步骤

### 1. 检查错误状态码

在浏览器控制台（F12）中查看完整的错误信息，注意 `error.status` 的值：

- **400**: 请求格式错误
- **404**: Edge Function 未找到
- **500**: 服务器内部错误（最常见）

### 2. 查看详细错误信息

改进后的 Edge Function 现在会返回详细的错误信息。在测试页面或浏览器控制台中查看：

```javascript
// 在浏览器控制台中查看
console.log(error.context?.body)  // 查看服务器返回的详细错误
```

### 3. 常见错误及解决方案

#### 错误 500：服务器内部错误

**可能原因：**

1. **BAIDU_API_KEY 未设置或格式不正确**
   ```powershell
   # 检查环境变量
   npx supabase secrets list
   
   # 如果未设置，设置它（格式：bce-v3/xxx）
   npx supabase secrets set BAIDU_API_KEY=your_api_key_here
   ```

2. **API Key 格式不正确**
   - 千帆平台 API Key 格式应为：`bce-v3/xxx`
   - 如果使用旧版 OAuth 2.0，需要同时设置 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`

3. **百度 API 调用失败**
   - API Key 无效或已过期
   - API 配额已用完
   - 网络连接问题

**解决方案：**

```powershell
# 1. 检查环境变量
npx supabase secrets list

# 2. 如果 BAIDU_API_KEY 不存在或格式不对，重新设置
npx supabase secrets set BAIDU_API_KEY=bce-v3/your_actual_key

# 3. 重新部署 Edge Function
npx supabase functions deploy ask-ai

# 4. 等待 1-2 分钟让部署生效
```

#### 错误 400：请求格式错误

**可能原因：**
- 请求体不是有效的 JSON
- 缺少必需的 `prompt` 字段
- `prompt` 不是字符串类型

**解决方案：**
- 检查请求格式是否正确
- 确保 `prompt` 字段存在且是字符串

#### 错误 404：Edge Function 未找到

**解决方案：**
```powershell
# 部署 Edge Function
npx supabase functions deploy ask-ai

# 验证部署
npx supabase functions list
```

### 4. 查看 Edge Function 日志

```powershell
# 查看最近的日志（需要等待几秒钟让日志同步）
npx supabase functions logs ask-ai
```

日志会显示：
- ✅ 成功步骤
- ❌ 错误信息
- 详细的错误堆栈

### 5. 测试 Edge Function

使用测试页面进行诊断：

1. 打开 `test_qianfan_api.html`
2. 填写 Supabase URL 和 Anon Key
3. 点击 "🔍 诊断连接" 验证配置
4. 点击 "🚀 测试 Edge Function 调用"
5. 查看详细的错误信息

### 6. 验证 API Key 格式

千帆平台 API Key 格式检查：

```javascript
// 正确的格式
const apiKey = "bce-v3/xxx-xxx-xxx-xxx";

// 检查格式
if (apiKey.startsWith('bce-v3/')) {
  console.log('✅ 格式正确');
} else {
  console.log('❌ 格式不正确，应该是 bce-v3/xxx 格式');
}
```

### 7. 手动测试百度 API

如果 Edge Function 日志显示百度 API 调用失败，可以手动测试：

```bash
# 使用 curl 测试（需要替换 YOUR_API_KEY）
curl -X POST https://qianfan.baidubce.com/v2/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bce-v3/YOUR_API_KEY" \
  -d '{
    "model": "ernie-4.5-turbo-128k",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## 改进后的错误信息

Edge Function 现在会返回详细的错误信息：

```json
{
  "error": "错误类型",
  "message": "详细错误信息",
  "details": "额外信息"
}
```

在测试页面或浏览器控制台中查看这些信息，可以快速定位问题。

## 常见问题排查清单

- [ ] Edge Function 已部署（`npx supabase functions list`）
- [ ] BAIDU_API_KEY 已设置（`npx supabase secrets list`）
- [ ] API Key 格式正确（`bce-v3/xxx`）
- [ ] Supabase URL 和 Anon Key 正确
- [ ] 网络连接正常
- [ ] 查看 Edge Function 日志了解详细错误

## 获取帮助

如果问题仍然存在：

1. 查看浏览器控制台的完整错误信息
2. 运行 `npx supabase functions logs ask-ai` 查看服务器日志
3. 在测试页面查看详细的错误信息
4. 检查 Supabase Dashboard 中的 Edge Function 状态

