/**
 * 检查和修复 target_university_name 字段
 * 使用方法: node fix-database-field.js
 * 
 * 注意：需要先安装 @supabase/supabase-js
 * npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcXljenV1YXJpb3NuaXVkYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzM2ODQsImV4cCI6MjA4MDM0OTY4NH0.6gLqwj0OBNHatfoPC_Pm0zANzQLS1KE9xJ2Vf2dQB7s';

// 注意：这个脚本需要 Supabase 的 service_role key 来执行 ALTER TABLE
// 如果没有 service_role key，请使用 Supabase Dashboard 的 SQL Editor

async function checkAndFixField() {
  console.log('🔍 检查数据库字段...\n');

  try {
    // 使用 @supabase/supabase-js
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 检查字段是否存在（通过尝试查询）
    console.log('1. 检查 target_university_name 字段是否存在...');
    
    const { data: profiles, error: queryError } = await supabase
      .from('profiles')
      .select('target_university_name')
      .limit(1);

    if (queryError) {
      if (queryError.message.includes('column') && queryError.message.includes('does not exist')) {
        console.log('❌ 字段不存在！');
        console.log('\n📝 请执行以下操作：');
        console.log('   1. 打开 Supabase Dashboard → SQL Editor');
        console.log('   2. 执行以下 SQL：');
        console.log('\n   ALTER TABLE profiles');
        console.log('   ADD COLUMN IF NOT EXISTS target_university_name TEXT;');
        console.log('\n   或者，如果你有 service_role key，可以修改此脚本使用它。');
        return;
      } else {
        throw queryError;
      }
    }

    console.log('✅ 字段已存在！\n');

    // 检查有多少记录缺少这个字段的值
    console.log('2. 检查数据完整性...');
    
    const { data: allProfiles, error: countError } = await supabase
      .from('profiles')
      .select('id, target_university_id, target_university_name, target_major_name');

    if (countError) {
      throw countError;
    }

    const totalProfiles = allProfiles.length;
    const profilesWithId = allProfiles.filter(p => p.target_university_id).length;
    const profilesWithName = allProfiles.filter(p => p.target_university_name).length;
    const profilesWithMajor = allProfiles.filter(p => p.target_major_name).length;

    console.log(`   总记录数: ${totalProfiles}`);
    console.log(`   有目标大学ID: ${profilesWithId}`);
    console.log(`   有目标大学名称: ${profilesWithName}`);
    console.log(`   有目标科系: ${profilesWithMajor}\n`);

    if (totalProfiles === 0) {
      console.log('⚠️  注意：查询到 0 条记录。');
      console.log('   这可能是因为：');
      console.log('   1. 数据库中确实没有 profiles 记录');
      console.log('   2. RLS (Row Level Security) 策略限制了查询');
      console.log('   3. 需要使用 service_role key 来查询所有记录');
      console.log('\n   建议：在 Supabase Dashboard → Table Editor → profiles 中手动检查数据。\n');
      return;
    }

    // 找出有 university_id 但没有 university_name 的记录
    const needsUpdate = allProfiles.filter(
      p => p.target_university_id && !p.target_university_name
    );

    if (needsUpdate.length > 0) {
      console.log(`3. 发现 ${needsUpdate.length} 条记录需要更新大学名称...`);
      
      // 获取所有大学数据
      const { data: universities, error: uniError } = await supabase
        .from('universities')
        .select('id, name, nameEn');

      if (uniError) {
        console.log('⚠️  无法获取大学数据，请手动更新');
        return;
      }

      const universityMap = new Map();
      universities.forEach(uni => {
        universityMap.set(uni.id, uni.name || uni.nameEn || `大学ID: ${uni.id}`);
      });

      // 更新记录
      let updated = 0;
      for (const profile of needsUpdate) {
        const universityName = universityMap.get(profile.target_university_id);
        if (universityName) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ target_university_name: universityName })
            .eq('id', profile.id);

          if (!updateError) {
            updated++;
            console.log(`   ✅ 已更新用户 ${profile.id}: ${universityName}`);
          } else {
            console.log(`   ❌ 更新用户 ${profile.id} 失败:`, updateError.message);
          }
        } else {
          console.log(`   ⚠️  找不到大学ID ${profile.target_university_id} 对应的大学名称`);
        }
      }

      console.log(`\n✅ 已更新 ${updated} 条记录！`);
    } else {
      console.log('✅ 所有记录都有完整的大学名称！');
    }

    console.log('\n✨ 检查完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('\n💡 提示：');
    console.error('   如果遇到权限错误，请使用 Supabase Dashboard 的 SQL Editor 手动执行 SQL。');
    console.error('   或者，如果你有 service_role key，可以修改此脚本使用它。');
  }
}

// 运行脚本
checkAndFixField();

