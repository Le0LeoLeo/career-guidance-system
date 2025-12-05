/**
 * Firebase Firestore 批量更新脚本
 * 为所有大学添加 admission_scores 和 majors 字段
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 初始化 Firebase Admin SDK
// 注意：需要先下载 serviceAccountKey.json 文件
// 从 Firebase Console -> Project Settings -> Service Accounts 下载
let serviceAccount;
try {
  const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ 无法读取 serviceAccountKey.json 文件');
  console.error('请从 Firebase Console 下载服务账号密钥文件');
  console.error('路径：Firebase Console -> Project Settings -> Service Accounts -> Generate new private key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * 根据学校名称判断所属 Tier 并返回录取分数
 */
function getAdmissionScore(university) {
  const name = (university.name || '').toLowerCase();
  const nameEn = (university.nameEn || '').toLowerCase();
  const location = (university.location || '').toLowerCase();
  const city = (university.city || '').toLowerCase();
  
  // Top Tier (清華、北大、復旦、浙大)
  if (
    name.includes('清華') || name.includes('清华') ||
    name.includes('北京大學') || name.includes('北京大学') || name.includes('北大') ||
    name.includes('復旦') || name.includes('复旦') ||
    name.includes('浙江大學') || name.includes('浙江大学') || name.includes('浙大') ||
    nameEn.includes('tsinghua') || nameEn.includes('peking') || nameEn.includes('fudan') || nameEn.includes('zhejiang')
  ) {
    return { admission_min: 680, tier: 'Top Tier' };
  }

  // Tier 1 (中山、廈門、華南理工、武漢、南開、天津)
  if (
    name.includes('中山大學') || name.includes('中山大学') ||
    name.includes('廈門大學') || name.includes('厦门大学') ||
    name.includes('華南理工') || name.includes('华南理工') ||
    name.includes('武漢大學') || name.includes('武汉大学') ||
    name.includes('南開大學') || name.includes('南开大学') ||
    name.includes('天津大學') || name.includes('天津大学') ||
    nameEn.includes('sun yat-sen') || nameEn.includes('xiamen') || 
    nameEn.includes('south china') || nameEn.includes('wuhan') ||
    nameEn.includes('nankai') || nameEn.includes('tianjin')
  ) {
    return { admission_min: 590, tier: 'Tier 1' };
  }

  // Tier 2 (深圳大學、暨南大學、其他 211/985)
  if (
    name.includes('深圳大學') || name.includes('深圳大学') ||
    name.includes('暨南大學') || name.includes('暨南大学') ||
    name.includes('211') || name.includes('985') ||
    (city.includes('深圳') || city.includes('廣州') || city.includes('广州') || city.includes('上海') || city.includes('北京')) ||
    nameEn.includes('shenzhen') || nameEn.includes('jinan')
  ) {
    return { admission_min: 480, tier: 'Tier 2' };
  }

  // 台灣頂尖 (台大、成大、清華、交大)
  if (
    name.includes('台灣大學') || name.includes('台湾大学') || name.includes('台大') ||
    name.includes('成功大學') || name.includes('成功大学') || name.includes('成大') ||
    name.includes('國立清華') || name.includes('国立清华') ||
    name.includes('交通大學') || name.includes('交通大学') || name.includes('交大') ||
    nameEn.includes('national taiwan') || nameEn.includes('ntu') ||
    nameEn.includes('national cheng kung') || nameEn.includes('ncku') ||
    (location.includes('台灣') || location.includes('台湾') || location.includes('taiwan'))
  ) {
    return { admission_min: 650, tier: 'Taiwan Top' };
  }

  // 台灣中字輩/私立老牌
  if (
    name.includes('中興') || name.includes('中兴') ||
    name.includes('中央') || name.includes('中山') ||
    name.includes('政治') || name.includes('淡江') ||
    name.includes('輔仁') || name.includes('東吳') || name.includes('东吴') ||
    (location.includes('台灣') || location.includes('台湾')) && 
    (name.includes('大學') || name.includes('大学'))
  ) {
    return { admission_min: 500, tier: 'Taiwan Mid' };
  }

  // 澳門大學
  if (
    name.includes('澳門') || name.includes('澳门') ||
    name.includes('macau') || name.includes('macao') ||
    location.includes('澳門') || location.includes('澳门')
  ) {
    return { admission_min: 550, tier: 'Macau' };
  }

  // 香港前三大 (HKU, HKUST, CUHK)
  if (
    name.includes('香港大學') || name.includes('香港大学') ||
    name.includes('香港科技') || name.includes('香港中文') ||
    nameEn.includes('hong kong university') || nameEn.includes('hku') ||
    nameEn.includes('hong kong university of science') || nameEn.includes('hkust') ||
    nameEn.includes('chinese university of hong kong') || nameEn.includes('cuhk') ||
    location.includes('香港') || location.includes('hong kong')
  ) {
    return { admission_min: 700, tier: 'Hong Kong Top 3' };
  }

  // Tier 3 (普通一本/二本) - 默认值
  return { admission_min: 380, tier: 'Tier 3' };
}

/**
 * 生成默认的 majors 数组（可以根据需要自定义）
 */
function getDefaultMajors(university) {
  // 如果已经有 majors 字段，保留原有数据
  if (university.majors && Array.isArray(university.majors) && university.majors.length > 0) {
    return university.majors;
  }

  // 根据学校类型和地区生成默认科系
  const defaultMajors = [
    '計算機科學', '計算機科學與技術', '軟件工程', '信息工程',
    '工商管理', '國際貿易', '金融學', '會計學',
    '英語', '日語', '中文', '新聞傳播',
    '機械工程', '電子工程', '土木工程', '建築學'
  ];

  // 可以根据学校特色添加更多科系
  return defaultMajors;
}

/**
 * 批量更新所有大学
 */
async function updateAllUniversities() {
  try {
    console.log('🚀 开始批量更新大学数据...\n');

    // 获取所有大学
    const universitiesRef = db.collection('universities');
    const snapshot = await universitiesRef.get();

    if (snapshot.empty) {
      console.log('❌ 没有找到任何大学数据');
      return;
    }

    console.log(`📊 找到 ${snapshot.size} 所大学\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore 批量操作限制

    for (const doc of snapshot.docs) {
      const university = doc.data();
      const universityId = doc.id;

      // 跳过包含中文的 ID（这些可能是无效记录）
      if (/[\u4e00-\u9fa5]/.test(universityId)) {
        skippedCount++;
        continue;
      }

      // 计算录取分数
      const scoreInfo = getAdmissionScore(university);
      
      // 准备更新数据
      const updateData = {};

      // 更新 admission_scores（如果还没有或者需要更新）
      if (!university.admission_scores || !university.admission_scores.admission_min) {
        updateData['admission_scores'] = {
          admission_min: scoreInfo.admission_min,
          tier: scoreInfo.tier,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        };
      }

      // 更新 majors（如果还没有）
      if (!university.majors || !Array.isArray(university.majors) || university.majors.length === 0) {
        updateData['majors'] = getDefaultMajors(university);
      }

      // 如果有需要更新的字段，添加到批量操作
      if (Object.keys(updateData).length > 0) {
        const docRef = universitiesRef.doc(universityId);
        batch.update(docRef, updateData);
        batchCount++;
        updatedCount++;

        // 每 500 条提交一次（Firestore 限制）
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`✅ 已更新 ${updatedCount} 所大学...`);
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }

    // 提交剩余的批量操作
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n✨ 批量更新完成！');
    console.log(`✅ 已更新: ${updatedCount} 所大学`);
    console.log(`⏭️  跳过: ${skippedCount} 所大学（已有数据或无效ID）`);
    console.log(`📊 总计: ${snapshot.size} 所大学\n`);

  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await updateAllUniversities();
    console.log('🎉 所有操作完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
main();

