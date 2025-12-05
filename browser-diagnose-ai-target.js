/**
 * 浏览器诊断脚本：检查 AI 无法读取目标大学信息的问题
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具（F12）
 * 2. 切换到 Console 标签
 * 3. 复制并粘贴此脚本的所有内容
 * 4. 按 Enter 执行
 * 
 * 或者：
 * 在 Console 中输入：diagnoseAITargetIssue()
 */

async function diagnoseAITargetIssue() {
  console.log('🔍 开始诊断 AI 无法读取目标大学信息的问题...\n')
  console.log('='.repeat(60))
  
  // 检查 1: Supabase 客户端
  console.log('\n📋 检查 1: Supabase 客户端')
  console.log('-'.repeat(60))
  
  if (typeof supabase === 'undefined' || !supabase) {
    console.error('❌ Supabase 客户端未初始化')
    console.log('💡 请确认页面已完全载入，或重新整理页面')
    return
  }
  console.log('✅ Supabase 客户端已初始化')
  
  // 检查 2: 用户认证
  console.log('\n📋 检查 2: 用户认证')
  console.log('-'.repeat(60))
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('❌ 用户未登录或认证失败')
    console.log('   错误：', authError?.message || '无法获取用户')
    console.log('\n💡 解决方案：')
    console.log('   1. 确认你已登录应用')
    console.log('   2. 如果已登录，尝试刷新页面')
    return
  }
  
  console.log('✅ 用户已认证')
  console.log('   用户ID：', user.id)
  console.log('   用户邮箱：', user.email || '无')
  
  // 检查 3: 用户数据
  console.log('\n📋 检查 3: 用户数据')
  console.log('-'.repeat(60))
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_university_id, target_university_name, target_major_name, target_admission_score')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.error('❌ 查询用户数据失败：', profileError.message)
    console.log('   错误代码：', profileError.code)
    
    if (profileError.message?.includes('column') || 
        profileError.message?.includes('field') || 
        profileError.code === 'PGRST116') {
      console.log('\n⚠️  可能的原因：target_university_name 字段不存在')
      console.log('💡 解决方案：')
      console.log('   1. 打开 Supabase Dashboard → SQL Editor')
      console.log('   2. 执行以下 SQL：')
      console.log('      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_university_name TEXT;')
    }
    return
  }
  
  if (!profile) {
    console.log('⚠️  用户记录不存在')
    console.log('\n💡 解决方案：在应用中设定目标大学和科系')
    return
  }
  
  console.log('✅ 用户记录存在')
  console.log('   目标大学ID：', profile.target_university_id || '❌ 无')
  console.log('   目标大学名称：', profile.target_university_name || '❌ 无')
  console.log('   目标科系：', profile.target_major_name || '❌ 无')
  console.log('   目标分数：', profile.target_admission_score || '❌ 无')
  
  // 检查 4: 数据完整性
  console.log('\n📋 检查 4: 数据完整性')
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
        console.log('   💡 可能需要手动更新，或检查 RLS 策略')
      } else {
        console.log('   ✅ 已更新 target_university_name 字段')
        console.log('   💡 请刷新页面后重新测试 AI 功能')
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
  
  // 检查 5: Edge Function 模拟测试
  console.log('\n📋 检查 5: Edge Function 模拟测试')
  console.log('-'.repeat(60))
  
  console.log('   模拟 Edge Function 查询（使用认证 token）...')
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    console.log('   ⚠️  无法获取认证 token')
    console.log('   💡 这可能是 Edge Function 无法读取用户数据的原因')
  } else {
    console.log('   ✅ 有认证 token（长度：', session.access_token.length, '）')
    
    // 模拟 Edge Function 的查询
    const functionClient = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      }
    )
    
    const { data: functionProfile, error: functionError } = await functionClient
      .from('profiles')
      .select('target_university_id, target_university_name, target_major_name, target_admission_score')
      .eq('id', user.id)
      .single()
    
    if (functionError) {
      console.log('   ⚠️  Edge Function 模拟查询失败：', functionError.message)
      console.log('   💡 这可能是 Edge Function 无法读取用户数据的原因')
    } else if (functionProfile) {
      console.log('   ✅ Edge Function 可以正常查询用户数据')
      console.log('      目标大学名称：', functionProfile.target_university_name || '无')
      console.log('      目标科系：', functionProfile.target_major_name || '无')
      
      if (functionProfile.target_university_name && functionProfile.target_major_name) {
        console.log('   ✅ 数据完整，AI 应该能够读取')
      } else {
        console.log('   ⚠️  数据不完整，AI 可能无法正确回答')
      }
    }
  }
  
  // 检查 6: 测试 Edge Function 调用
  console.log('\n📋 检查 6: 测试 Edge Function 调用')
  console.log('-'.repeat(60))
  
  console.log('   测试调用 Edge Function...')
  
  try {
    const { data, error } = await supabase.functions.invoke('ask-ai', {
      body: { 
        prompt: '我的理想大学是什么？',
        history: []
      }
    })
    
    if (error) {
      console.log('   ❌ Edge Function 调用失败：', error.message)
      console.log('   💡 可能的原因：')
      console.log('      1. Edge Function 未部署')
      console.log('      2. 网络连接问题')
      console.log('      3. 认证问题')
    } else {
      console.log('   ✅ Edge Function 调用成功')
      console.log('   AI 回答：', data?.response?.substring(0, 200) || '无回答')
      
      // 检查回答是否包含目标大学信息
      if (data?.response) {
        const response = data.response.toLowerCase()
        const hasTargetInfo = response.includes(profile.target_university_name?.toLowerCase() || '') ||
                             response.includes(profile.target_major_name?.toLowerCase() || '')
        
        if (hasTargetInfo) {
          console.log('   ✅ AI 回答中包含了目标信息')
        } else {
          console.log('   ⚠️  AI 回答中可能没有包含目标信息')
          console.log('   💡 可能需要检查 Edge Function 日志')
        }
      }
    }
  } catch (error) {
    console.log('   ❌ 调用 Edge Function 时发生异常：', error.message)
  }
  
  // 总结
  console.log('\n' + '='.repeat(60))
  console.log('📊 诊断总结')
  console.log('='.repeat(60))
  
  const summary = {
    userAuthenticated: !!user,
    hasProfile: !!profile,
    hasTargetUniversity: !!(profile?.target_university_id || profile?.target_university_name),
    hasTargetMajor: !!profile?.target_major_name,
    hasUniversityName: !!profile?.target_university_name,
    allDataComplete: !!(profile?.target_university_id && profile?.target_university_name && profile?.target_major_name)
  }
  
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
    console.log('   2. 查看 Edge Function 日志：supabase functions logs ask-ai')
    console.log('   3. 刷新浏览器页面')
    console.log('   4. 重新测试 AI 功能')
  } else {
    console.log('\n⚠️  发现问题，请按照上述解决方案修复')
  }
  
  return summary
}

// 自动执行（如果页面已载入）
if (typeof window !== 'undefined' && document.readyState === 'complete') {
  console.log('✅ 页面已载入，可以执行诊断')
  console.log('执行诊断请输入: diagnoseAITargetIssue()')
} else if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('✅ 页面载入完成，可以执行诊断')
    console.log('执行诊断请输入: diagnoseAITargetIssue()')
  })
}

// 导出函数（如果在 Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = diagnoseAITargetIssue
}

