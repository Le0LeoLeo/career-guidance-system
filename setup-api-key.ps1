# 設置百度 API Key 到 Supabase Edge Function
# 使用方法：.\setup-api-key.ps1

$API_KEY = "bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980"

Write-Host "🔧 設置百度 API Key 到 Supabase Edge Function..." -ForegroundColor Cyan
Write-Host ""

# 檢查 Supabase CLI 是否安裝
Write-Host "📋 檢查 Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI 未安裝" -ForegroundColor Red
    Write-Host ""
    Write-Host "請先安裝 Supabase CLI：" -ForegroundColor Yellow
    Write-Host "  方式 1: 使用 npm" -ForegroundColor White
    Write-Host "    npm install -g supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  方式 2: 使用 Scoop (Windows)" -ForegroundColor White
    Write-Host "    scoop install supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  方式 3: 下載二進制文件" -ForegroundColor White
    Write-Host "    https://github.com/supabase/cli/releases" -ForegroundColor Gray
    Write-Host ""
    Write-Host "安裝完成後，請重新執行此腳本。" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI 已安裝" -ForegroundColor Green
Write-Host ""

# 檢查是否已登入
Write-Host "📋 檢查 Supabase 登入狀態..." -ForegroundColor Yellow
try {
    $loginCheck = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  尚未登入 Supabase，請先登入：" -ForegroundColor Yellow
        Write-Host "   supabase login" -ForegroundColor Gray
        Write-Host ""
        $login = Read-Host "是否現在登入？(Y/N)"
        if ($login -eq "Y" -or $login -eq "y") {
            supabase login
        } else {
            Write-Host "請先登入後再執行此腳本。" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "✅ 已登入 Supabase" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  無法檢查登入狀態，請手動確認" -ForegroundColor Yellow
}

Write-Host ""

# 檢查專案是否已連結
Write-Host "📋 檢查專案連結..." -ForegroundColor Yellow
$projectRef = "naqyczuuariosniudbsr"

try {
    $linkCheck = supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  專案尚未連結，正在連結..." -ForegroundColor Yellow
        supabase link --project-ref $projectRef
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 專案連結失敗" -ForegroundColor Red
            Write-Host "請手動執行：supabase link --project-ref $projectRef" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "✅ 專案已連結" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  無法檢查專案連結，嘗試連結..." -ForegroundColor Yellow
    supabase link --project-ref $projectRef
}

Write-Host ""

# 設置環境變數
Write-Host "📋 設置 API Key 環境變數..." -ForegroundColor Yellow
Write-Host "API Key: $($API_KEY.Substring(0, 20))..." -ForegroundColor Gray

try {
    supabase secrets set BAIDU_API_KEY=$API_KEY
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ API Key 設置成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ API Key 設置失敗" -ForegroundColor Red
        Write-Host "請手動執行：supabase secrets set BAIDU_API_KEY=$API_KEY" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ 設置環境變數時發生錯誤：$_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 驗證設置
Write-Host "📋 驗證環境變數..." -ForegroundColor Yellow
try {
    $secrets = supabase secrets list
    if ($secrets -match "BAIDU_API_KEY") {
        Write-Host "✅ 環境變數已設置" -ForegroundColor Green
    } else {
        Write-Host "⚠️  無法確認環境變數，但設置命令已執行" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  無法驗證環境變數" -ForegroundColor Yellow
}

Write-Host ""

# 提示部署
Write-Host "📋 下一步：部署 Edge Function" -ForegroundColor Cyan
Write-Host "執行以下命令部署 Edge Function：" -ForegroundColor Yellow
Write-Host "  supabase functions deploy ask-ai" -ForegroundColor Gray
Write-Host ""

$deploy = Read-Host "是否現在部署？(Y/N)"
if ($deploy -eq "Y" -or $deploy -eq "y") {
    Write-Host ""
    Write-Host "🚀 正在部署 Edge Function..." -ForegroundColor Cyan
    supabase functions deploy ask-ai
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 設置完成！現在可以測試您的 AI 聊天機器人了。" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 部署失敗，請檢查錯誤訊息" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "💡 請記得執行以下命令部署：" -ForegroundColor Yellow
    Write-Host "   supabase functions deploy ask-ai" -ForegroundColor Gray
}

Write-Host ""



