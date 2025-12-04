# 百度文心 4.5T API 测试页面使用说明

## 📄 测试页面位置

- **文件路径**: `test_qianfan_api.html`
- **访问地址**: `http://localhost:8000/test_qianfan_api.html`

## 🎯 功能说明

这个测试页面提供了完整的百度文心 4.5T API 测试和演示功能：

### 1. API 信息展示
- 显示模型名称：`ernie-4.5-turbo-128k`
- 显示 API 端点
- 说明认证方式
- 展示项目集成方式

### 2. 测试配置
- **Supabase URL**: 配置 Supabase 项目 URL
- **Supabase Anon Key**: 输入 Anon Key（用于调用 Edge Function）
- **系统提示词**: 可自定义系统提示词

### 3. 交互式测试
- **测试 Edge Function 调用**: 
  - 直接测试通过 Supabase Edge Function 调用百度 API
  - 显示调用状态（成功/失败）
  - 显示 AI 回应和使用统计
  - 显示完整响应数据

- **生成 API 请求格式**:
  - 生成完整的 HTTP 请求格式
  - 生成 JSON 请求体
  - 自动更新代码示例

### 4. 代码示例
- JavaScript 调用示例（通过 Edge Function）
- Edge Function 实现示例（Deno/TypeScript）
- cURL 命令示例

### 5. 项目集成说明
- 说明当前项目的架构
- 列出相关文件
- 说明优势

## 🚀 使用方法

### 步骤 1: 打开测试页面
在浏览器中访问：`http://localhost:8000/test_qianfan_api.html`

### 步骤 2: 配置 Supabase
1. 在 "测试配置" 区域填写：
   - Supabase URL（已预填）
   - Supabase Anon Key（需要输入）

### 步骤 3: 测试 Edge Function
1. 在 "用户消息" 输入框中输入测试问题
2. 点击 "🚀 测试 Edge Function 调用" 按钮
3. 查看测试结果：
   - 成功：显示 AI 回应和使用统计
   - 失败：显示错误信息

### 步骤 4: 生成请求格式
1. 填写用户消息和系统提示词
2. 点击 "📝 生成 API 请求格式" 按钮
3. 查看生成的 HTTP 请求和 JSON 格式
4. 查看自动更新的代码示例

## 📝 注意事项

1. **API Key 安全**:
   - Supabase Anon Key 仅用于调用 Edge Function
   - 不会发送到百度 API
   - 百度 API Key 存储在 Supabase Secrets 中

2. **本地存储**:
   - Supabase Anon Key 会保存在浏览器 localStorage 中
   - 下次打开页面时会自动填充

3. **错误处理**:
   - 如果 Edge Function 未部署，会显示 404 错误
   - 如果 API Key 未设置，会显示 500 错误
   - 查看浏览器 Console 获取详细错误信息

## 🔧 故障排除

### 问题 1: Edge Function 调用失败
**解决方案**:
1. 确认 Edge Function 已部署：`supabase functions list`
2. 确认环境变量已设置：`supabase secrets list`
3. 查看详细错误信息，参考 `QUICK_FIX_EDGE_FUNCTION.md`

### 问题 2: 无法连接到 Supabase
**解决方案**:
1. 确认 Supabase URL 正确
2. 确认 Anon Key 正确
3. 检查网络连接
4. 查看浏览器 Console 错误信息

### 问题 3: 页面无法加载
**解决方案**:
1. 确认本地服务器正在运行（`http://localhost:8000`）
2. 检查文件路径是否正确
3. 查看浏览器 Console 是否有 JavaScript 错误

## 📚 相关文档

- `QUICK_FIX_EDGE_FUNCTION.md` - Edge Function 快速修复指南
- `SUPABASE_EDGE_FUNCTION_SETUP.md` - Edge Function 设置指南
- `EDGE_FUNCTION_TROUBLESHOOTING.md` - 详细故障排除指南

## 🎨 页面特性

- ✅ 响应式设计（支持移动设备）
- ✅ 实时状态显示
- ✅ 代码高亮显示
- ✅ 自动保存配置
- ✅ 详细的错误信息
- ✅ 完整的使用统计

---

**提示**: 这个测试页面可以帮助您：
- 快速测试 Edge Function 是否正常工作
- 查看 API 请求格式
- 学习如何集成百度文心 API
- 调试 API 调用问题

