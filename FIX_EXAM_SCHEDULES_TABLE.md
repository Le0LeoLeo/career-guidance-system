# 修复 exam_schedules 表缺失错误

## 问题描述

错误信息：`Could not find the table 'public.exam_schedules' in the schema cache`

这个错误表示数据库表 `exam_schedules` 尚未创建。

## 快速修复步骤

### 方法 1：使用 Supabase Dashboard（推荐）

1. **打开 Supabase Dashboard**
   - 访问您的 Supabase 项目：https://supabase.com/dashboard
   - 选择您的项目

2. **打开 SQL Editor**
   - 在左侧菜单中点击 "SQL Editor"
   - 点击 "New query"

3. **执行 SQL 脚本**
   - 复制以下完整 SQL 脚本
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 执行

```sql
-- ========== 创建 exam_schedules 和 exam_scores 表 ==========

-- 1. 创建辅助函数：自动更新 updated_at 字段（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 修改 profiles 表格：新增目标大学与科系字段（如果不存在）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_university_id TEXT,
ADD COLUMN IF NOT EXISTS target_major_name TEXT,
ADD COLUMN IF NOT EXISTS target_admission_score NUMERIC;

-- 3. 建立 exam_schedules 表格 (储存考程表)
CREATE TABLE IF NOT EXISTS exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  exam_time TIME,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('test', 'exam')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 建立 exam_scores 表格 (储存成绩)
CREATE TABLE IF NOT EXISTS exam_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES exam_schedules(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  score_obtained NUMERIC NOT NULL,
  full_marks NUMERIC NOT NULL DEFAULT 100,
  type TEXT NOT NULL CHECK (type IN ('test_score', 'exam_score', 'daily_performance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 启用 Row Level Security (RLS)
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_scores ENABLE ROW LEVEL SECURITY;

-- 6. 建立 RLS 政策

-- Exam Schedules: 使用者只能查看和管理自己的考程表
DROP POLICY IF EXISTS "Users can view own exam schedules" ON exam_schedules;
CREATE POLICY "Users can view own exam schedules"
  ON exam_schedules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exam schedules" ON exam_schedules;
CREATE POLICY "Users can insert own exam schedules"
  ON exam_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exam schedules" ON exam_schedules;
CREATE POLICY "Users can update own exam schedules"
  ON exam_schedules FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own exam schedules" ON exam_schedules;
CREATE POLICY "Users can delete own exam schedules"
  ON exam_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Exam Scores: 使用者只能查看和管理自己的成绩
DROP POLICY IF EXISTS "Users can view own exam scores" ON exam_scores;
CREATE POLICY "Users can view own exam scores"
  ON exam_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exam scores" ON exam_scores;
CREATE POLICY "Users can insert own exam scores"
  ON exam_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exam scores" ON exam_scores;
CREATE POLICY "Users can update own exam scores"
  ON exam_scores FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own exam scores" ON exam_scores;
CREATE POLICY "Users can delete own exam scores"
  ON exam_scores FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 建立触发器自动更新 updated_at
DROP TRIGGER IF EXISTS update_exam_schedules_updated_at ON exam_schedules;
CREATE TRIGGER update_exam_schedules_updated_at
  BEFORE UPDATE ON exam_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_scores_updated_at ON exam_scores;
CREATE TRIGGER update_exam_scores_updated_at
  BEFORE UPDATE ON exam_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 建立索引以提升查询效能
CREATE INDEX IF NOT EXISTS idx_exam_schedules_user_id ON exam_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_date ON exam_schedules(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_scores_user_id ON exam_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_subject ON exam_scores(subject);
CREATE INDEX IF NOT EXISTS idx_exam_scores_type ON exam_scores(type);
CREATE INDEX IF NOT EXISTS idx_exam_scores_schedule_id ON exam_scores(schedule_id);
```

4. **验证表已创建**
   - 执行后，在左侧菜单点击 "Table Editor"
   - 确认可以看到 `exam_schedules` 和 `exam_scores` 表

### 方法 2：使用 Supabase CLI

如果您使用 Supabase CLI，可以执行：

```bash
# 在项目根目录执行
psql -h [your-db-host] -U postgres -d postgres -f create_exam_tables.sql
```

或者直接在 Supabase Dashboard 的 SQL Editor 中执行 `create_exam_tables.sql` 文件的内容。

## 验证修复

执行 SQL 后，请：

1. **刷新浏览器页面**
   - 重新加载您的应用页面

2. **再次尝试上传考程表**
   - 上传图片或 PDF 文件
   - 应该不再出现表缺失的错误

3. **检查控制台**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签，确认没有错误

## 如果仍有问题

1. **检查 Supabase 连接**
   - 确认 Supabase 项目 URL 和 API Key 配置正确
   - 检查 `app.js` 中的 Supabase 初始化代码

2. **检查 RLS 政策**
   - 确认用户已登录
   - 确认 RLS 政策已正确创建

3. **查看 Supabase 日志**
   - 在 Supabase Dashboard 中查看 "Logs" 或 "Database" > "Logs"
   - 查找相关错误信息

## 相关文件

- `create_exam_tables.sql` - 完整的数据库设置脚本
- `academics_database.sql` - 数据库结构文件
- `ACADEMICS_SYSTEM_SETUP.md` - 完整的系统设置指南

