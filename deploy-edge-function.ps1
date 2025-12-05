# 部署 Supabase Edge Function 脚本
# 使用方法：通过 Supabase Dashboard 或 Supabase CLI

Write-Host "🚀 部署 Supabase Edge Function" -ForegroundColor Cyan
Write-Host ""

# 检查 Supabase CLI
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "⚠️  Supabase CLI 未安装" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请选择部署方式：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方式 1: 通过 Supabase Dashboard 部署（推荐）" -ForegroundColor Green
    Write-Host "  1. 访问: https://supabase.com/dashboard/project/naqyczuuariosniudbsr/functions"
    Write-Host "  2. 点击 'ask-ai' 函数"
    Write-Host "  3. 点击 'Deploy' 或 'Redeploy'"
    Write-Host "  4. 确保环境变量已设置："
    Write-Host "     - BAIDU_API_KEY"
    Write-Host "     - BAIDU_SECRET_KEY (可选)"
    Write-Host ""
    Write-Host "方式 2: 安装 Supabase CLI 后部署" -ForegroundColor Green
    Write-Host "  1. 安装: npm install -g supabase"
    Write-Host "  2. 登录: supabase login"
    Write-Host "  3. 链接项目: supabase link --project-ref naqyczuuariosniudbsr"
    Write-Host "  4. 部署: supabase functions deploy ask-ai"
    Write-Host ""
    
    $choice = Read-Host "是否现在安装 Supabase CLI? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "正在安装 Supabase CLI..." -ForegroundColor Cyan
        npm install -g supabase
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Supabase CLI 安装成功！" -ForegroundColor Green
            Write-Host ""
            Write-Host "接下来请执行：" -ForegroundColor Yellow
            Write-Host "  1. supabase login"
            Write-Host "  2. supabase link --project-ref naqyczuuariosniudbsr"
            Write-Host "  3. supabase functions deploy ask-ai"
        } else {
            Write-Host "❌ 安装失败，请手动安装" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ Supabase CLI 已安装" -ForegroundColor Green
    Write-Host ""
    Write-Host "检查登录状态..." -ForegroundColor Cyan
    $loginStatus = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  未登录，请先登录：" -ForegroundColor Yellow
        Write-Host "  supabase login" -ForegroundColor Cyan
    } else {
        Write-Host "✅ 已登录" -ForegroundColor Green
        Write-Host ""
        Write-Host "开始部署 Edge Function..." -ForegroundColor Cyan
        supabase functions deploy ask-ai
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ 部署成功！" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ 部署失败，请检查错误信息" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📝 部署后请确保：" -ForegroundColor Yellow
Write-Host "  1. 环境变量 BAIDU_API_KEY 已设置"
Write-Host "  2. 环境变量 BAIDU_SECRET_KEY 已设置（如果使用 OAuth）"
Write-Host "  3. 在 Supabase Dashboard 中验证函数状态"
Write-Host ""
