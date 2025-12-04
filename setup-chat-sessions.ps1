# ========== 使用 Supabase CLI 建立 chat_sessions 表 ==========
# 此脚本会自动执行 SQL 来创建必要的数据库表

Write-Host "🚀 开始设置 chat_sessions 表..." -ForegroundColor Cyan

# 检查 Supabase CLI
Write-Host "`n📋 检查 Supabase CLI..." -ForegroundColor Yellow
$cliCheck = npx supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI 未找到，请先安装：" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase CLI 可用" -ForegroundColor Green

# 检查项目链接
Write-Host "`n📋 检查项目链接..." -ForegroundColor Yellow
$projectCheck = npx supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  项目未链接，尝试链接..." -ForegroundColor Yellow
    Write-Host "   项目 ID: naqyczuuariosniudbsr" -ForegroundColor Cyan
    
    # 尝试链接项目
    npx supabase link --project-ref naqyczuuariosniudbsr 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 项目链接失败，请手动执行：" -ForegroundColor Red
        Write-Host "   npx supabase link --project-ref naqyczuuariosniudbsr" -ForegroundColor Yellow
        Write-Host "`n或者使用 Supabase Dashboard：" -ForegroundColor Yellow
        Write-Host "   1. 访问: https://supabase.com/dashboard/project/naqyczuuariosniudbsr/sql/new" -ForegroundColor Cyan
        Write-Host "   2. 复制 chat_sessions_table.sql 的内容" -ForegroundColor Cyan
        Write-Host "   3. 粘贴到 SQL Editor 并执行" -ForegroundColor Cyan
        exit 1
    }
}
Write-Host "✅ 项目已链接" -ForegroundColor Green

# 检查 SQL 文件
$sqlFile = "chat_sessions_table.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL 文件不存在: $sqlFile" -ForegroundColor Red
    exit 1
}
Write-Host "✅ SQL 文件存在: $sqlFile" -ForegroundColor Green

# 执行 SQL
Write-Host "`n🔧 执行 SQL 创建表..." -ForegroundColor Yellow
Write-Host "   注意：这将删除现有的 chat_messages 表（如果存在）" -ForegroundColor Yellow
Write-Host ""

# 读取 SQL 文件内容
$sqlContent = Get-Content $sqlFile -Raw -Encoding UTF8

# 使用 Supabase CLI 执行 SQL
# 注意：Supabase CLI 的 db execute 命令需要本地数据库
# 对于远程项目，我们需要使用其他方法

Write-Host "⚠️  检测到这是远程项目，Supabase CLI 的 db execute 需要本地数据库。" -ForegroundColor Yellow
Write-Host "`n📝 请使用以下方法之一：" -ForegroundColor Cyan
Write-Host ""
Write-Host "方法 1: 使用 Supabase Dashboard（推荐）" -ForegroundColor Green
Write-Host "   1. 访问: https://supabase.com/dashboard/project/naqyczuuariosniudbsr/sql/new" -ForegroundColor White
Write-Host "   2. 复制以下 SQL 文件内容：" -ForegroundColor White
Write-Host "      $sqlFile" -ForegroundColor Cyan
Write-Host "   3. 粘贴到 SQL Editor" -ForegroundColor White
Write-Host "   4. 点击 Run 执行" -ForegroundColor White
Write-Host ""
Write-Host "方法 2: 使用 Supabase API（需要 Access Token）" -ForegroundColor Green
Write-Host "   需要先获取 Supabase Access Token" -ForegroundColor Yellow
Write-Host ""

# 尝试使用 psql 或提供手动指导
Write-Host "💡 提示：如果你有数据库连接字符串，可以使用 psql：" -ForegroundColor Cyan
Write-Host "   psql <connection_string> -f $sqlFile" -ForegroundColor White
Write-Host ""

# 显示 SQL 文件路径
$fullPath = (Resolve-Path $sqlFile).Path
Write-Host "📄 SQL 文件位置：" -ForegroundColor Cyan
Write-Host "   $fullPath" -ForegroundColor White
Write-Host ""

# 询问是否要打开文件
$openFile = Read-Host "是否要打开 SQL 文件查看内容？(Y/N)"
if ($openFile -eq 'Y' -or $openFile -eq 'y') {
    notepad $sqlFile
}

Write-Host "`n✅ 脚本执行完成" -ForegroundColor Green
Write-Host "   执行 SQL 后，请刷新应用页面 (F5)" -ForegroundColor Yellow

