# 🚀 快速设置指南 - 修复 404 错误

## ❌ 当前错误

控制台显示：
```
Could not find the table 'public.chat_sessions' in the schema cache
```

**原因：** `chat_sessions` 表还没有在 Supabase 数据库中创建。

## ✅ 解决步骤

### 步骤 1：打开 Supabase Dashboard

1. 访问：https://supabase.com/dashboard
2. 登录你的账户
3. 选择项目：`naqyczuuariosniudbsr`

### 步骤 2：打开 SQL Editor

1. 在左侧菜单中，点击 **SQL Editor**
2. 点击 **New query** 按钮（或使用快捷键）

### 步骤 3：执行 SQL 语句

1. 打开项目中的 `chat_sessions_table.sql` 文件
2. **复制所有内容**（Ctrl+A 全选，Ctrl+C 复制）
3. 在 Supabase SQL Editor 中**粘贴**（Ctrl+V）
4. 点击 **Run** 按钮（或按 Ctrl+Enter）

### 步骤 4：验证执行结果

执行成功后，你应该看到：
- ✅ 绿色成功消息
- ✅ 显示 "Success. No rows returned" 或类似消息

### 步骤 5：验证表格已创建

1. 在左侧菜单中，点击 **Table Editor**
2. 你应该能看到两个新表格：
   - ✅ `chat_sessions`
   - ✅ `chat_messages`

### 步骤 6：刷新网页

1. 回到你的应用页面（http://localhost:8000）
2. 按 **F5** 刷新页面
3. 检查控制台，错误应该消失了

## 📋 SQL 文件位置

SQL 文件位于项目根目录：
```
chat_sessions_table.sql
```

## ⚠️ 重要提示

**此 SQL 会删除现有的 `chat_messages` 表！**

如果你之前有聊天记录需要保留：
1. 先备份数据（在 Table Editor 中导出）
2. 或者修改 SQL，只创建新表而不删除旧表

## 🔍 验证清单

执行 SQL 后，检查以下项目：

- [ ] SQL 执行成功（无错误）
- [ ] `chat_sessions` 表已创建
- [ ] `chat_messages` 表已创建
- [ ] RLS 已启用（在 Table Editor 中可以看到 "RLS enabled" 标记）
- [ ] 刷新网页后，控制台无 404 错误
- [ ] 左侧边栏可以显示对话列表（即使为空）

## 🐛 如果还有问题

### 问题 1：SQL 执行失败

**可能原因：**
- 权限不足
- SQL 语法错误
- 表已存在但结构不同

**解决方法：**
1. 检查错误消息
2. 尝试先手动删除旧表（如果有）
3. 分步执行 SQL（先创建表，再设置 RLS）

### 问题 2：执行后仍然 404

**可能原因：**
- 缓存问题
- 表名拼写错误
- 项目链接错误

**解决方法：**
1. 硬刷新浏览器（Ctrl+Shift+R）
2. 检查 `app.js` 中的表名是否为 `chat_sessions`
3. 在 Supabase Dashboard 的 Table Editor 中确认表名

### 问题 3：RLS 政策错误

**可能原因：**
- RLS 政策创建失败
- 用户认证问题

**解决方法：**
1. 在 Table Editor 中检查 RLS 是否启用
2. 在 SQL Editor 中单独执行 RLS 政策部分
3. 检查 `auth.users` 表是否存在

## 📞 需要帮助？

如果问题仍然存在：
1. 检查浏览器控制台的完整错误消息
2. 检查 Supabase Dashboard 的 Logs（左侧菜单 → Logs）
3. 确认 Supabase 项目 ID 和 URL 正确

---

**执行完 SQL 后，你的多对话功能就可以正常使用了！** 🎉

