// 测试 AI 功能脚本
// 用于验证 Edge Function 和目标大学信息是否正常工作

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcXljenV1YXJpb3NuaXVkYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzM2ODQsImV4cCI6MjA4MDM0OTY4NH0.6gLqwj0OBNHatfoPC_Pm0zANzQLS1KE9xJ2Vf2dQB7s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 开始测试 AI 功能...\n');

// 测试 1: 检查 Edge Function 是否可访问
async function testEdgeFunction() {
  console.log('1️⃣  测试 Edge Function 连接...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        prompt: '你好',
        history: []
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Edge Function 响应正常');
      console.log('   响应:', data.response ? '有回复' : '无回复');
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ Edge Function 响应错误:', response.status);
      console.log('   错误信息:', errorText.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('   ❌ 连接失败:', error.message);
    return false;
  }
}

// 测试 2: 检查数据库字段
async function testDatabaseFields() {
  console.log('\n2️⃣  测试数据库字段...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, target_university_id, target_university_name, target_major_name')
      .limit(5);

    if (error) {
      console.log('   ❌ 查询失败:', error.message);
      return false;
    }

    console.log(`   ✅ 查询成功，找到 ${profiles.length} 条记录`);
    
    if (profiles.length > 0) {
      const hasName = profiles.filter(p => p.target_university_name).length;
      console.log(`   ✅ 有 ${hasName} 条记录包含 target_university_name`);
      
      profiles.forEach((profile, index) => {
        console.log(`   记录 ${index + 1}:`);
        console.log(`     - 目标大学ID: ${profile.target_university_id || '无'}`);
        console.log(`     - 目标大学名称: ${profile.target_university_name || '无'}`);
        console.log(`     - 目标科系: ${profile.target_major_name || '无'}`);
      });
    } else {
      console.log('   ⚠️  没有找到用户记录（这是正常的，如果没有用户登录）');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ 测试失败:', error.message);
    return false;
  }
}

// 测试 3: 测试 AI 是否能读取目标大学信息
async function testAITargetReading() {
  console.log('\n3️⃣  测试 AI 读取目标大学信息...');
  try {
    // 先获取一个用户（如果有）
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, target_university_name, target_major_name')
      .limit(1)
      .single();

    if (!profiles || !profiles.target_university_name) {
      console.log('   ⚠️  没有找到包含目标大学信息的用户记录');
      console.log('   提示: 请在应用中先设定目标大学和科系');
      return false;
    }

    console.log(`   ✅ 找到用户记录，目标大学: ${profiles.target_university_name}`);
    
    // 测试 AI 是否能正确回答
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        prompt: '我的理想大学是什么？',
        history: [],
        user_id: profiles.id
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ AI 响应成功');
      console.log('   AI 回复:', data.response?.substring(0, 100) || '无回复');
      
      // 检查回复中是否包含目标大学名称
      if (data.response && data.response.includes(profiles.target_university_name)) {
        console.log('   ✅ AI 回复中包含了目标大学名称！');
        return true;
      } else {
        console.log('   ⚠️  AI 回复中未包含目标大学名称');
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ AI 响应错误:', response.status);
      console.log('   错误信息:', errorText.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('   ❌ 测试失败:', error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  const results = {
    edgeFunction: await testEdgeFunction(),
    databaseFields: await testDatabaseFields(),
    aiTargetReading: await testAITargetReading()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log('='.repeat(50));
  console.log(`Edge Function 连接: ${results.edgeFunction ? '✅ 通过' : '❌ 失败'}`);
  console.log(`数据库字段检查: ${results.databaseFields ? '✅ 通过' : '❌ 失败'}`);
  console.log(`AI 读取目标信息: ${results.aiTargetReading ? '✅ 通过' : '⚠️  需要数据'}`);
  console.log('='.repeat(50));

  if (results.edgeFunction && results.databaseFields) {
    console.log('\n✅ 基本功能正常！');
    if (!results.aiTargetReading) {
      console.log('💡 提示: 请在应用中设定目标大学和科系，然后再次测试');
    }
  } else {
    console.log('\n❌ 部分功能异常，请检查：');
    if (!results.edgeFunction) {
      console.log('   - Edge Function 可能未部署或配置错误');
    }
    if (!results.databaseFields) {
      console.log('   - 数据库连接或权限可能有问题');
    }
  }
}

runAllTests().catch(console.error);

