-- 學生職涯輔導系統 - Supabase 資料庫結構

-- 1. 建立 profiles 表格 (延伸自 auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  student_status TEXT CHECK (student_status IN ('decided', 'undecided')),
  interests TEXT,
  target_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 建立 resources 表格 (給已確定目標學生看)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. 建立 appointments 表格 (給未定目標學生預約)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  booking_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 啟用 Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 5. 建立輔助函數：檢查用戶是否為教師（必須在 RLS 策略之前定義）
CREATE OR REPLACE FUNCTION public.is_teacher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. 建立 RLS 政策

-- Profiles: 使用者可以讀取自己的資料，教師可以讀取所有學生資料
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers can view all profiles" ON profiles;
CREATE POLICY "Teachers can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Resources: 所有人都可以讀取，只有教師可以新增/更新/刪除
DROP POLICY IF EXISTS "Everyone can view resources" ON resources;
CREATE POLICY "Everyone can view resources"
  ON resources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Teachers can insert resources" ON resources;
CREATE POLICY "Teachers can insert resources"
  ON resources FOR INSERT
  WITH CHECK (public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "Teachers can update resources" ON resources;
CREATE POLICY "Teachers can update resources"
  ON resources FOR UPDATE
  USING (public.is_teacher(auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete resources" ON resources;
CREATE POLICY "Teachers can delete resources"
  ON resources FOR DELETE
  USING (public.is_teacher(auth.uid()));

-- Appointments: 學生可以讀取自己的預約，教師可以讀取所有預約
DROP POLICY IF EXISTS "Students can view own appointments" ON appointments;
CREATE POLICY "Students can view own appointments"
  ON appointments FOR SELECT
  USING (
    student_id = auth.uid() OR
    public.is_teacher(auth.uid())
  );

DROP POLICY IF EXISTS "Students can create appointments" ON appointments;
CREATE POLICY "Students can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update appointments" ON appointments;
CREATE POLICY "Teachers can update appointments"
  ON appointments FOR UPDATE
  USING (public.is_teacher(auth.uid()));

-- 7. 建立觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 建立觸發器：當新用戶註冊時自動建立 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- 根據郵件地址確定角色：f210004@fct.edu.mo 為老師，其他為學生
  IF LOWER(NEW.email) = 'f210004@fct.edu.mo' THEN
    user_role := 'teacher';
  ELSE
    user_role := 'student';
  END IF;
  
  -- 使用 SECURITY DEFINER 跳過 RLS 檢查
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, user_role)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

