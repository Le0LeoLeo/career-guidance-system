/**
 * 综合诊断脚本：检查 AI 无法读取目标大学信息的问题
 * 
 * 使用方法：
 * node diagnose-ai-target-issue.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync, existsSync } from 'fs'

dotenv.config()

// 尝试从多个来源获取配置
let supabaseUrl = process.env.VITE_SUPABASE_URL
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// 如果环境变量不存在，尝试从 app.js 读取
if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const appJsContent = readFileSync('app.js', 'utf-8')
    const urlMatch = appJsContent.match(/const SUPABASE_URL = ['"]([^'"]+)['"]/)
    const keyMatch = appJsContent.match(/const SUPABASE_ANON_KEY = ['"]([^'"]+)['"]/)
    
    if (urlMatch) supabaseUrl = urlMatch[1]
    if (keyMatch) supabaseAnonKey = keyMatch[1]
  } catch (error) {
    // 忽略错误，继续使用环境变量
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 错误：缺少 Supabase 配置')
  console.log('请确保以下之一：')
  console.log('   1. .env 文件中有 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  console.log('   2. 或者在 app.js 中有 SUPABASE_URL 和 SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseIssue() {
  console.log('🔍 开始诊断 AI 无法读取目标大学信息的问题...\n')
  console.log('='.repeat(60))
  
  // 步骤 1: 检查数据库字段
  console.log('\n📋 步骤 1: 检查数据库字段')
  console.log('-'.repeat(60))
  
  try {
    // 尝试查询字段是否存在
    const { data: testQuery, error: testError } = await supabase
      .from('profiles')
      .select('target_university_name')
      .limit(1)
    
    if (testError) {
      if (testError.message?.includes('column') || 
          testError.message?.includes('field') || 
          testError.code === 'PGRST116') {
        console.log('❌ 问题发现：target_university_name 字段不存在')
        console.log('\n💡 解决方案：')
        console.log('   1. 打开 Supabase Dashboard → SQL Editor')
        console.log('   2. 执行以下 SQL：')
        console.log('      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_university_name TEXT;')
        console.log('   3. 然后重新运行此脚本')
        return { needsField: true }
      } else {
        console.log('⚠️  查询字段时出错：', testError.message)
      }
    } else {
      console.log('✅ target_university_name 字段存在')
    }
  } catch (error) {
    console.error('❌ 检查字段时发生错误：', error.message)
  }
  
  // 步骤 2: 检查用户认证
  console.log('\n📋 步骤 2: 检查用户认证')
  console.log('-'.repeat(60))
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('❌ 问题发现：用户未登录或认证失败')
    console.log('   错误：', authError?.message || '无法获取用户')
    console.log('\n💡 解决方案：')
    console.log('   1. 在浏览器中登录应用')
    console.log('   2. 或者使用 Supabase Dashboard 手动检查数据')
    return { needsAuth: true }
  }
  
  console.log('✅ 用户已认证')
  console.log('   用户ID：', user.id)
  console.log('   用户邮箱：', user.email || '无')
  
  // 步骤 3: 检查用户数据
  console.log('\n📋 步骤 3: 检查用户数据')
  console.log('-'.repeat(60))
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_university_id, target_university_name, target_major_name, target_admission_score')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.log('❌ 查询用户数据失败：', profileError.message)
    if (profileError.code === 'PGRST116') {
      console.log('   这可能是字段不存在的错误')
    }
    return { hasError: true, error: profileError }
  }
  
  if (!profile) {
    console.log('⚠️  用户记录不存在')
    console.log('\n💡 解决方案：在应用中设定目标大学和科系')
    return { noProfile: true }
  }
  
  console.log('✅ 用户记录存在')
  console.log('   目标大学ID：', profile.target_university_id || '❌ 无')
  console.log('   目标大学名称：', profile.target_university_name || '❌ 无')
  console.log('   目标科系：', profile.target_major_name || '❌ 无')
  console.log('   目标分数：', profile.target_admission_score || '❌ 无')
  
  // 步骤 4: 检查数据完整性
  console.log('\n📋 步骤 4: 检查数据完整性')
  console.log('-'.repeat(60))
  
  const issues = []
  const fixes = []
  
  if (!profile.target_university_id && !profile.target_major_name) {
    issues.push('用户尚未设定目标大学和科系')
    fixes.push('在应用中设定目标大学和科系')
  } else if (!profile.target_university_name && profile.target_university_id) {
    issues.push('有目标大学ID但没有大学名称')
    fixes.push('需要从 universities 表查询或更新大学名称')
    
    // 尝试从 universities 表查询
    console.log('   尝试从 universities 表查询大学名称...')
    const { data: university, error: uniError } = await supabase
      .from('universities')
      .select('id, name, nameEn')
      .eq('id', profile.target_university_id)
      .single()
    
    if (!uniError && university) {
      const uniName = university.name || university.nameEn
      console.log('   ✅ 找到大学：', uniName)
      
      // 更新 profiles 表
      console.log('   正在更新 profiles 表...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ target_university_name: uniName })
        .eq('id', user.id)
      
      if (updateError) {
        console.log('   ❌ 更新失败：', updateError.message)
      } else {
        console.log('   ✅ 已更新 target_university_name 字段')
        profile.target_university_name = uniName
      }
    } else {
      console.log('   ⚠️  无法从 universities 表获取大学信息')
      if (uniError) {
        console.log('   错误：', uniError.message)
      }
    }
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️  发现以下问题：')
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`)
    })
    console.log('\n💡 解决方案：')
    fixes.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix}`)
    })
  } else {
    console.log('✅ 数据完整')
  }
  
  // 步骤 5: 检查 Edge Function
  console.log('\n📋 步骤 5: 检查 Edge Function')
  console.log('-'.repeat(60))
  
  // 模拟 Edge Function 的查询逻辑
  console.log('   模拟 Edge Function 查询...')
  
  // 使用服务端密钥（如果有）或匿名密钥
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const clientForFunction = serviceKey 
    ? createClient(supabaseUrl, serviceKey)
    : supabase
  
  // 创建带认证的客户端（模拟 Edge Function 的行为）
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    const functionClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }
    })
    
    const { data: functionProfile, error: functionError } = await functionClient
      .from('profiles')
      .select('target_university_id, target_university_name, target_major_name, target_admission_score')
      .eq('id', user.id)
      .single()
    
    if (functionError) {
      console.log('   ⚠️  Edge Function 模拟查询失败：', functionError.message)
    } else if (functionProfile) {
      console.log('   ✅ Edge Function 可以正常查询用户数据')
      console.log('      目标大学名称：', functionProfile.target_university_name || '无')
      console.log('      目标科系：', functionProfile.target_major_name || '无')
    }
  } else {
    console.log('   ⚠️  无法获取认证 token，跳过 Edge Function 模拟测试')
  }
  
  // 总结
  console.log('\n' + '='.repeat(60))
  console.log('📊 诊断总结')
  console.log('='.repeat(60))
  
  const summary = {
    fieldExists: !testError || (!testError.message?.includes('column') && testError.code !== 'PGRST116'),
    userAuthenticated: !!user,
    hasProfile: !!profile,
    hasTargetUniversity: !!(profile?.target_university_id || profile?.target_university_name),
    hasTargetMajor: !!profile?.target_major_name,
    hasUniversityName: !!profile?.target_university_name,
    allDataComplete: !!(profile?.target_university_id && profile?.target_university_name && profile?.target_major_name)
  }
  
  console.log('字段存在：', summary.fieldExists ? '✅' : '❌')
  console.log('用户认证：', summary.userAuthenticated ? '✅' : '❌')
  console.log('有用户记录：', summary.hasProfile ? '✅' : '❌')
  console.log('有目标大学：', summary.hasTargetUniversity ? '✅' : '❌')
  console.log('有目标科系：', summary.hasTargetMajor ? '✅' : '❌')
  console.log('有大学名称：', summary.hasUniversityName ? '✅' : '❌')
  console.log('数据完整：', summary.allDataComplete ? '✅' : '❌')
  
  if (summary.allDataComplete) {
    console.log('\n✅ 所有检查通过！数据应该可以正常传递给 AI')
    console.log('\n💡 如果 AI 仍然无法读取，请：')
    console.log('   1. 确认 Edge Function 已重新部署：supabase functions deploy ask-ai')
    console.log('   2. 刷新浏览器页面')
    console.log('   3. 重新测试 AI 功能')
  } else {
    console.log('\n⚠️  发现问题，请按照上述解决方案修复')
  }
  
  return summary
}

// 运行诊断
diagnoseIssue()
  .then((result) => {
    console.log('\n✅ 诊断完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 诊断过程中发生错误：', error)
    console.error('错误堆栈：', error.stack)
    process.exit(1)
  })

