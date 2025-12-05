-- 添加 target_university_name 字段到 profiles 表
-- 请在 Supabase Dashboard → SQL Editor 中执行此 SQL

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_university_name TEXT;

-- 验证字段是否添加成功（可选）
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name = 'target_university_name';

