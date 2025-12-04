# 部署 Supabase Edge Function 脚本
# 用于修复 FunctionsFetchError 错误

Write-Host "🚀 开始部署 Edge Function..." -ForegroundColor Cyan
Write-Host ""

# 检查 Supabase CLI 是否安装
Write-Host "📋 检查 Supabase CLI..." -ForegroundColor Yellow
try {
    $version = supabase --version 2>&1
    Write-Host "✅ Supabase CLI 已安装: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI 未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "正在安装 Supabase CLI..." -ForegroundColor Yellow
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version 2>&1
        Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
        Write-Host "正在通过 npm 安装 Supabase CLI..." -ForegroundColor Yellow
        npm install -g supabase
        Write-Host "✅ Supabase CLI 安装完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
        Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# 检查是否已登录
Write-Host "📋 检查 Supabase 登录状态..." -ForegroundColor Yellow
try {
    supabase projects list 2>&1 | Out-Null
    Write-Host "✅ 已登录 Supabase" -ForegroundColor Green
} catch {
    Write-Host "⚠️  需要登录 Supabase" -ForegroundColor Yellow
    Write-Host "正在打开浏览器登录..." -ForegroundColor Yellow
    supabase login
}

Write-Host ""

# 链接到项目
Write-Host "📋 链接到项目..." -ForegroundColor Yellow
$projectRef = "naqyczuuariosniudbsr"
Write-Host "项目 ID: $projectRef" -ForegroundColor Cyan

try {
    supabase link --project-ref $projectRef 2>&1 | Out-Null
    Write-Host "✅ 项目链接成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️  项目可能已链接，继续..." -ForegroundColor Yellow
}

Write-Host ""

# 检查环境变量
Write-Host "📋 检查环境变量..." -ForegroundColor Yellow
try {
    $secrets = supabase secrets list 2>&1
    if ($secrets -match "BAIDU_API_KEY") {
        Write-Host "✅ BAIDU_API_KEY 已设置" -ForegroundColor Green
    } else {
        Write-Host "⚠️  BAIDU_API_KEY 未设置" -ForegroundColor Yellow
        $apiKey = Read-Host "请输入百度 API Key (格式: bce-v3/xxx)"
        if ($apiKey) {
            supabase secrets set BAIDU_API_KEY=$apiKey
            Write-Host "✅ BAIDU_API_KEY 已设置" -ForegroundColor Green
        } else {
            Write-Host "⚠️  跳过环境变量设置，请稍后手动设置" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  无法检查环境变量，请手动设置" -ForegroundColor Yellow
    Write-Host "命令: supabase secrets set BAIDU_API_KEY=bce-v3/your_key" -ForegroundColor Cyan
}

Write-Host ""

# 部署 Edge Function
Write-Host "📋 部署 Edge Function..." -ForegroundColor Yellow
Write-Host "函数名称: ask-ai" -ForegroundColor Cyan

try {
    supabase functions deploy ask-ai
    Write-Host ""
    Write-Host "✅ Edge Function 部署成功！" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ 部署失败，请检查错误信息" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 验证部署
Write-Host "📋 验证部署..." -ForegroundColor Yellow
try {
    $functions = supabase functions list
    Write-Host $functions
    if ($functions -match "ask-ai") {
        Write-Host ""
        Write-Host "✅ Edge Function 'ask-ai' 已成功部署！" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  未找到 'ask-ai' 函数，请检查部署日志" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  无法验证部署状态" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 完成！现在可以在测试页面测试 Edge Function 了" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "1. 打开测试页面: http://localhost:8000/test_qianfan_api.html" -ForegroundColor White
Write-Host "2. 填写 Supabase URL 和 Anon Key" -ForegroundColor White
Write-Host "3. 点击 '🔍 诊断连接' 按钮验证" -ForegroundColor White
Write-Host "4. 点击 '🚀 测试 Edge Function 调用' 测试功能" -ForegroundColor White

