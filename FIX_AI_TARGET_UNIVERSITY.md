# 修复 AI 无法读取目标大学信息的问题

## ⚠️ 重要提示

**SQL 查询必须在 Supabase Dashboard 的 SQL Editor 中执行，不是在终端中！**

如果你看到类似 `npx SELECT...` 的错误，说明你误在终端中执行了 SQL。正确的做法是：
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 在编辑器中粘贴 SQL 语句
5. 点击 "Run" 执行

## 问题描述

当用户问 AI "我的理想大学是什么？" 时，AI 回答说"目前我這裡沒有看到你具體的成績或相關背景資料"，而不是直接回答用户设定的目标大学和科系。

## 可能的原因

1. **数据库字段不存在**：`target_university_name` 字段可能还没有添加到 `profiles` 表
2. **数据未更新**：用户可能还没有重新设定目标（因为之前前端代码有问题）
3. **Edge Function 未部署**：修改后的 Edge Function 可能还没有部署

## 解决步骤

### 步骤 1: 检查并添加数据库字段

**方法 A：使用自动化脚本（推荐）**

运行我创建的自动化脚本：

```bash
node fix-database-field.js
```

这个脚本会：
- ✅ 自动检查字段是否存在
- ✅ 检查数据完整性
- ✅ 自动更新缺失的大学名称

**方法 B：手动执行 SQL**

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择你的项目 → SQL Editor
2. 执行以下 SQL：

```sql
-- 添加 target_university_name 字段（如果不存在）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_university_name TEXT;
```

3. 验证字段是否添加成功：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'target_university_name';
```

**⚠️ 注意：SQL 语句必须在 Supabase Dashboard 的 SQL Editor 中执行，不是在终端中！**

### 步骤 2: 检查用户数据

**方法 A：使用浏览器诊断脚本（推荐）**

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 打开 `browser-diagnose-ai-target.js` 文件
4. 复制所有内容并粘贴到 Console
5. 按 Enter 执行，或输入 `diagnoseAITargetIssue()`

这个脚本会：
- ✅ 检查用户认证状态
- ✅ 检查用户数据完整性
- ✅ 自动修复缺失的大学名称
- ✅ 测试 Edge Function 调用
- ✅ 提供详细的诊断报告

**方法 B：使用 Node.js 诊断脚本**

运行诊断脚本检查你的用户数据：

```bash
node diagnose-ai-target-issue.js
```

**方法 C：手动检查**

在 Supabase Dashboard → Table Editor → profiles 中检查你的记录，确认以下字段是否有值：
- `target_university_id`
- `target_university_name`
- `target_major_name`
- `target_admission_score`

### 步骤 3: 重新设定目标（重要！）

**这是最关键的一步！** 因为之前前端代码有问题，旧的目标记录可能没有 `target_university_name` 值。

1. 刷新浏览器页面
2. 在应用中重新设定一次目标大学和科系
3. 确认目标已保存（检查页面上的目标显示）

### 步骤 4: 重新部署 Edge Function

修改后的 Edge Function 需要重新部署才能生效：

```bash
# 在项目根目录执行
supabase functions deploy ask-ai
```

### 步骤 5: 测试

1. 刷新浏览器页面
2. 在 AI 聊天中问："我的理想大学是什么？"
3. AI 应该直接回答你的目标大学和科系

## 如果问题仍然存在

### 检查 Edge Function 日志

```bash
supabase functions logs ask-ai
```

查看日志中是否有：
- ✅ "從 profiles 表獲取大學名稱"
- ✅ "已添加目標大學名稱到系統提示詞"
- ✅ "已添加完整目標到系統提示詞"

如果看到 ⚠️ 警告，说明数据可能缺失。

### 手动更新数据库

如果重新设定目标后仍然有问题，可以手动更新数据库：

1. 打开 Supabase Dashboard → Table Editor → profiles
2. 找到你的用户记录
3. 如果有 `target_university_id` 但没有 `target_university_name`：
   - 打开 Table Editor → universities
   - 找到对应 ID 的大学
   - 复制大学名称（`name` 或 `nameEn`）
   - 回到 profiles 表，将名称填入 `target_university_name` 字段

### 验证数据完整性

确保你的 profiles 记录中有以下数据：
- ✅ `target_university_id`：有值
- ✅ `target_university_name`：有值（大学名称）
- ✅ `target_major_name`：有值（科系名称）
- ✅ `target_admission_score`：可选（目标分数）

## 代码修复说明

### 前端修复（已完成）

1. ✅ `loadCurrentGoal()` 函数现在会从数据库读取 `target_university_name`
2. ✅ 保存目标时会更新 `currentProfile.target_university_name`
3. ✅ 从 `currentProfile` 读取时会正确使用已保存的大学名称

### Edge Function 修复（已完成）

1. ✅ 改进了错误处理，即使 `target_university_name` 字段不存在也能正常工作
2. ✅ 如果 profiles 表中没有大学名称，会从 universities 表查询
3. ✅ 添加了详细的日志记录，方便诊断问题
4. ✅ 改进了系统提示词构建逻辑，确保目标信息正确传递给 AI

## 常见问题

### Q: 为什么需要重新设定目标？

A: 因为 `target_university_name` 字段是新添加的，旧的目标记录中没有这个字段的值。重新设定会同时保存大学ID和大學名稱。

### Q: 我可以直接更新数据库而不重新设定吗？

A: 可以。在 Supabase Dashboard → Table Editor → profiles 中手动更新你的记录，填入 `target_university_name` 字段。

### Q: Edge Function 日志显示"用戶檔案存在但沒有目標資訊"

A: 这说明你的 profiles 记录中没有 `target_university_id`、`target_major_name` 等字段的值。请在应用中设定目标。

### Q: Edge Function 日志显示"target_university_name 字段可能不存在"

A: 执行步骤 1 中的 SQL 语句添加字段。

## 验证清单

完成所有步骤后，确认：

- [ ] `target_university_name` 字段已添加到 profiles 表
- [ ] 用户记录中有完整的目标信息（大学ID、大学名称、科系名称）
- [ ] Edge Function 已重新部署
- [ ] 浏览器页面已刷新
- [ ] 重新设定了目标（或手动更新了数据库）
- [ ] AI 能够正确回答目标大学问题

如果所有项目都已完成，但问题仍然存在，请检查 Edge Function 日志获取更多信息。

---

## ✅ 部署和测试

### 快速测试

运行测试脚本验证功能：

```bash
node test-ai-functionality.js
```

### 部署 Edge Function

如果 Edge Function 尚未部署，请参考 `DEPLOY_EDGE_FUNCTION.md` 文件。

### 完整测试指南

详细的测试步骤请参考 `TESTING_GUIDE_AI.md` 文件。

---

## 📊 当前状态

根据最新测试：
- ✅ Edge Function 已部署并正常工作
- ✅ 数据库连接正常
- ✅ 代码修复已完成
- ✅ 诊断脚本已创建（`browser-diagnose-ai-target.js` 和 `diagnose-ai-target-issue.js`）
- ⚠️ 需要在应用中设定目标大学和科系才能测试完整功能

## 🔧 诊断工具

### 浏览器诊断脚本

使用 `browser-diagnose-ai-target.js` 在浏览器控制台中诊断问题：

1. 打开应用页面
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 复制 `browser-diagnose-ai-target.js` 的内容并粘贴
5. 执行 `diagnoseAITargetIssue()`

### Node.js 诊断脚本

使用 `diagnose-ai-target-issue.js` 在终端中诊断问题：

```bash
node diagnose-ai-target-issue.js
```

注意：Node.js 脚本需要用户已登录（通过浏览器），因为它无法访问浏览器的认证状态。

