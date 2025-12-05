# Firebase 批量更新脚本使用说明

## 概述

`admin-seed.js` 是一个 Node.js 脚本，用于批量更新 Firebase Firestore 中的 `universities` 集合，为每所大学添加 `admission_scores` 和 `majors` 字段。

## 功能

- 自动读取 Firestore 中所有大学数据
- 根据学校名称、地区等信息智能判断所属 Tier
- 为每所大学设置相应的 `admission_min` 录取分数
- 为缺少科系数据的大学添加默认科系列表
- 批量更新，支持大量数据处理

## 分數判斷規則

脚本会根据以下规则判断学校的录取分数：

| Tier | 学校类型 | admission_min |
|------|---------|---------------|
| Top Tier | 清華、北大、復旦、浙大 | 680 |
| Tier 1 | 中山、廈門、華南理工、武漢、南開、天津 | 590 |
| Tier 2 | 深圳大學、暨南大學、其他 211/985 | 480 |
| Tier 3 | 普通一本/二本（預設值） | 380 |
| Taiwan Top | 台大、成大、清華、交大 | 650 |
| Taiwan Mid | 台灣中字輩/私立老牌 | 500 |
| Macau | 澳門大學 | 550 |
| Hong Kong Top 3 | HKU, HKUST, CUHK | 700 |

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 获取 Firebase 服务账号密钥

1. 登录 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目：`cpaapp-8c4d6`
3. 进入 **Project Settings** (项目设置)
4. 切换到 **Service Accounts** (服务账号) 标签
5. 点击 **Generate new private key** (生成新的私钥)
6. 下载 JSON 文件并重命名为 `serviceAccountKey.json`
7. 将文件放在项目根目录（与 `admin-seed.js` 同级）

### 3. 确保 `.gitignore` 包含密钥文件

确保 `serviceAccountKey.json` 不会被提交到版本控制：

```
serviceAccountKey.json
```

## 使用方法

### 运行脚本

```bash
npm run seed
```

或者直接运行：

```bash
node admin-seed.js
```

### 脚本执行流程

1. 读取 `serviceAccountKey.json` 初始化 Firebase Admin SDK
2. 连接 Firestore 数据库
3. 获取所有大学文档
4. 对每所大学：
   - 检查 ID 是否包含中文（跳过无效记录）
   - 根据学校信息判断 Tier 和录取分数
   - 如果缺少 `admission_scores`，添加该字段
   - 如果缺少 `majors`，添加默认科系列表
5. 批量提交更新（每 500 条一批）
6. 显示更新统计信息

## 输出示例

```
🚀 开始批量更新大学数据...

📊 找到 200 所大学

✅ 已更新 150 所大学...
✅ 已更新 200 所大学...

✨ 批量更新完成！
✅ 已更新: 180 所大学
⏭️  跳过: 20 所大学（已有数据或无效ID）
📊 总计: 200 所大学

🎉 所有操作完成！
```

## 数据结构

### admission_scores 字段

```javascript
{
  admission_min: 680,        // 最低录取分数
  tier: "Top Tier",          // 所属层级
  updated_at: Timestamp      // 更新时间
}
```

### majors 字段

```javascript
[
  "計算機科學",
  "軟件工程",
  "工商管理",
  // ... 更多科系
]
```

## 注意事项

1. **备份数据**：运行脚本前建议先备份 Firestore 数据
2. **权限要求**：确保服务账号具有 Firestore 的读写权限
3. **批量限制**：Firestore 批量操作限制为 500 条，脚本会自动分批处理
4. **幂等性**：脚本会检查现有数据，不会覆盖已有的 `admission_scores` 和 `majors` 字段
5. **中文 ID 过滤**：脚本会自动跳过包含中文的文档 ID（这些可能是无效记录）

## 自定义修改

### 修改录取分数规则

编辑 `admin-seed.js` 中的 `getAdmissionScore()` 函数，添加或修改判断逻辑。

### 修改默认科系

编辑 `admin-seed.js` 中的 `getDefaultMajors()` 函数，自定义默认科系列表。

## 故障排除

### 错误：无法读取 serviceAccountKey.json

- 确保文件存在于项目根目录
- 检查文件名称是否正确（区分大小写）
- 确保文件格式为有效的 JSON

### 错误：权限不足

- 检查服务账号是否具有 Firestore 的读写权限
- 在 Firebase Console 中验证服务账号状态

### 错误：连接超时

- 检查网络连接
- 验证 Firebase 项目 ID 是否正确

## 技术支持

如有问题，请检查：
1. Node.js 版本（建议 v18+）
2. Firebase Admin SDK 版本
3. Firestore 数据库连接状态

