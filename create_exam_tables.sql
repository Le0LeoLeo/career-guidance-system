-- ========== 智能考程與目標追蹤系統 - 完整資料庫設置 ==========
-- 此檔案包含所有必要的資料庫結構和函數

-- 1. 建立輔助函數：自動更新 updated_at 欄位（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 修改 profiles 表格：新增目標大學與科系欄位
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_university_id TEXT,
ADD COLUMN IF NOT EXISTS target_major_name TEXT,
ADD COLUMN IF NOT EXISTS target_admission_score NUMERIC;

-- 3. 建立 exam_schedules 表格 (儲存考程表)
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

-- 4. 建立 exam_scores 表格 (儲存成績)
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

-- 5. 啟用 Row Level Security (RLS)
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

-- Exam Scores: 使用者只能查看和管理自己的成績
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

-- 7. 建立觸發器自動更新 updated_at
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

-- 8. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_exam_schedules_user_id ON exam_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_date ON exam_schedules(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_scores_user_id ON exam_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_subject ON exam_scores(subject);
CREATE INDEX IF NOT EXISTS idx_exam_scores_type ON exam_scores(type);
CREATE INDEX IF NOT EXISTS idx_exam_scores_schedule_id ON exam_scores(schedule_id);

