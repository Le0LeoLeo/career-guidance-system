/**
 * 診斷腳本：檢查用戶數據是否正確存儲和查詢
 * 用於診斷為什麼 AI 無法讀取用戶的目標大學資訊
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 錯誤：缺少 Supabase 環境變數')
  console.log('請確保 .env 文件中有 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserData() {
  console.log('🔍 開始診斷用戶數據...\n')
  
  // 1. 檢查當前登入用戶
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('❌ 錯誤：無法獲取當前用戶')
    console.error('請確保你已經登入')
    console.error('錯誤詳情：', authError?.message)
    return
  }
  
  console.log('✅ 當前用戶：', user.email || user.id)
  console.log('   用戶ID：', user.id)
  console.log('')
  
  // 2. 檢查 profiles 表結構
  console.log('📋 檢查 profiles 表結構...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_university_id, target_major_name, target_university_name, target_admission_score')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.error('❌ 查詢 profiles 表失敗：', profileError.message)
    console.error('   錯誤代碼：', profileError.code)
    
    // 檢查是否是欄位不存在的錯誤
    if (profileError.message.includes('column') || profileError.code === 'PGRST116') {
      console.error('\n⚠️  可能的原因：target_university_name 欄位不存在')
      console.log('   解決方案：在 Supabase SQL Editor 中執行：')
      console.log('   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_university_name TEXT;')
    }
    return
  }
  
  console.log('✅ Profiles 表查詢成功')
  console.log('   目標大學ID：', profile?.target_university_id || '無')
  console.log('   目標大學名稱：', profile?.target_university_name || '無')
  console.log('   目標科系：', profile?.target_major_name || '無')
  console.log('   目標分數：', profile?.target_admission_score || '無')
  console.log('')
  
  // 3. 如果有大學ID，檢查 universities 表
  if (profile?.target_university_id) {
    console.log('📋 檢查 universities 表...')
    const { data: university, error: uniError } = await supabase
      .from('universities')
      .select('id, name, nameEn')
      .eq('id', profile.target_university_id)
      .single()
    
    if (uniError) {
      console.warn('⚠️  無法從 universities 表獲取大學資訊：', uniError.message)
    } else if (university) {
      console.log('✅ 大學資訊：', university.name || university.nameEn || university.id)
    }
    console.log('')
  }
  
  // 4. 總結
  console.log('📊 診斷總結：')
  if (!profile?.target_university_id && !profile?.target_major_name) {
    console.log('❌ 問題：用戶尚未設定目標大學和科系')
    console.log('   解決方案：在應用中設定目標大學和科系')
  } else if (!profile?.target_university_name && profile?.target_university_id) {
    console.log('⚠️  問題：有目標大學ID但沒有大學名稱')
    console.log('   解決方案：重新設定目標，或手動更新 profiles 表')
  } else if (profile?.target_university_name && profile?.target_major_name) {
    console.log('✅ 數據完整：目標大學和科系都已設定')
    console.log('   如果 AI 仍然無法讀取，可能是 Edge Function 需要重新部署')
  } else {
    console.log('⚠️  部分數據缺失，請檢查上述資訊')
  }
}

checkUserData().catch(console.error)

