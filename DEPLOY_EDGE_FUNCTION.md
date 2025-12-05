# 部署 Edge Function 指南

## 方式 1: 通过 Supabase Dashboard 部署（推荐，最简单）

### 步骤：

1. **访问 Supabase Dashboard**
   - 打开：https://supabase.com/dashboard/project/naqyczuuariosniudbsr/functions
   - 或访问：https://supabase.com/dashboard → 选择项目 → Edge Functions

2. **部署函数**
   - 找到 `ask-ai` 函数
   - 点击函数进入详情页
   - 点击 **"Deploy"** 或 **"Redeploy"** 按钮

3. **检查环境变量**
   - 在函数详情页，找到 **"Settings"** 或 **"Environment Variables"**
   - 确保以下环境变量已设置：
     - `BAIDU_API_KEY` - 百度 API Key（必需）
     - `BAIDU_SECRET_KEY` - 百度 Secret Key（如果使用 OAuth 方式）

4. **验证部署**
   - 部署完成后，检查函数状态是否为 **"Active"**
   - 可以查看函数日志确认是否有错误

---

## 方式 2: 使用 Supabase CLI 部署

### 安装 Supabase CLI

```bash
npm install -g supabase
```

### 登录和链接项目

```bash
# 1. 登录 Supabase
supabase login

# 2. 链接到你的项目
supabase link --project-ref naqyczuuariosniudbsr

# 3. 部署函数
supabase functions deploy ask-ai
```

### 设置环境变量（CLI 方式）

```bash
# 设置 BAIDU_API_KEY
supabase secrets set BAIDU_API_KEY=your_api_key_here

# 设置 BAIDU_SECRET_KEY（可选）
supabase secrets set BAIDU_SECRET_KEY=your_secret_key_here
```

---

## 验证部署是否成功

部署完成后，运行测试脚本：

```bash
node test-ai-functionality.js
```

或者直接在浏览器中测试：
1. 打开应用
2. 登录账户
3. 设定目标大学和科系
4. 问 AI："我的理想大学是什么？"
5. 检查 AI 是否能够正确回答你的目标大学和科系

---

## 常见问题

### 1. 函数返回 404 错误
- 检查函数是否已成功部署
- 确认函数名称为 `ask-ai`（区分大小写）

### 2. 函数返回 500 错误
- 检查环境变量是否已正确设置
- 查看函数日志中的错误信息
- 确认百度 API Key 格式正确

### 3. AI 无法读取目标大学信息
- 确认前端代码已更新（`app.js`）
- 确认数据库中 `target_university_name` 字段有值
- 运行 `node fix-database-field.js` 检查数据库

---

## 下一步

部署完成后，请：
1. ✅ 运行测试脚本验证功能
2. ✅ 在应用中测试 AI 聊天功能
3. ✅ 确认目标大学信息能正确保存和读取
