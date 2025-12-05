# 修復百度 API 認證問題
# 使用方法：.\fix-baidu-api.ps1

Write-Host "🔧 修復百度 API 認證問題..." -ForegroundColor Cyan
Write-Host ""

# 檢查 Supabase CLI
Write-Host "📋 檢查 Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI 未安裝" -ForegroundColor Red
    Write-Host "請先安裝：npx supabase --version" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI 已安裝" -ForegroundColor Green
Write-Host ""

# 檢查登入狀態
Write-Host "📋 檢查 Supabase 登入狀態..." -ForegroundColor Yellow
try {
    $loginCheck = npx supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  尚未登入，請先登入：" -ForegroundColor Yellow
        Write-Host "   npx supabase login" -ForegroundColor Gray
        exit 1
    }
    Write-Host "✅ 已登入 Supabase" -ForegroundColor Green
} catch {
    Write-Host "⚠️  無法檢查登入狀態" -ForegroundColor Yellow
}

Write-Host ""

# 顯示當前設置的 secrets
Write-Host "📋 當前設置的 Secrets：" -ForegroundColor Yellow
npx supabase secrets list
Write-Host ""

# 提示用戶輸入真實的 API Key
Write-Host "⚠️  重要：您需要提供真實的百度 API 密鑰" -ForegroundColor Red
Write-Host ""
Write-Host "百度 API Key 有兩種格式：" -ForegroundColor Yellow
Write-Host "  1. 千帆平台格式（推薦）：bce-v3/ALTAK-xxx/xxx" -ForegroundColor White
Write-Host "  2. OAuth 2.0 格式：需要 API Key 和 Secret Key" -ForegroundColor White
Write-Host ""

Write-Host "如何獲取百度 API Key：" -ForegroundColor Cyan
Write-Host "  1. 前往百度智能雲：https://cloud.baidu.com/" -ForegroundColor White
Write-Host "  2. 登入並創建應用" -ForegroundColor White
Write-Host "  3. 在千帆平台獲取 API Key" -ForegroundColor White
Write-Host ""

$hasApiKey = Read-Host "您是否已有百度 API Key？(Y/N)"
if ($hasApiKey -ne "Y" -and $hasApiKey -ne "y") {
    Write-Host ""
    Write-Host "💡 請先獲取百度 API Key，然後重新執行此腳本" -ForegroundColor Yellow
    Write-Host "   獲取指南：https://cloud.baidu.com/product/wenxinworkshop" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "請選擇認證方式：" -ForegroundColor Yellow
Write-Host "  1. 千帆平台 API Key（格式：bce-v3/xxx）" -ForegroundColor White
Write-Host "  2. OAuth 2.0（需要 API Key 和 Secret Key）" -ForegroundColor White
Write-Host ""

$authMethod = Read-Host "請輸入選項 (1 或 2)"

if ($authMethod -eq "1") {
    Write-Host ""
    Write-Host "請輸入千帆平台 API Key（格式：bce-v3/xxx）：" -ForegroundColor Yellow
    $apiKey = Read-Host "API Key"
    
    if (-not $apiKey -or -not $apiKey.StartsWith("bce-v3/")) {
        Write-Host "❌ API Key 格式不正確，應以 'bce-v3/' 開頭" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🔧 設置 API Key..." -ForegroundColor Cyan
    npx supabase secrets set BAIDU_API_KEY=$apiKey
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ API Key 設置成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ API Key 設置失敗" -ForegroundColor Red
        exit 1
    }
    
} elseif ($authMethod -eq "2") {
    Write-Host ""
    Write-Host "請輸入 OAuth 2.0 API Key：" -ForegroundColor Yellow
    $apiKey = Read-Host "API Key"
    
    Write-Host "請輸入 OAuth 2.0 Secret Key：" -ForegroundColor Yellow
    $secretKey = Read-Host "Secret Key"
    
    if (-not $apiKey -or -not $secretKey) {
        Write-Host "❌ API Key 和 Secret Key 不能為空" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🔧 設置 API Key 和 Secret Key..." -ForegroundColor Cyan
    npx supabase secrets set BAIDU_API_KEY=$apiKey
    npx supabase secrets set BAIDU_SECRET_KEY=$secretKey
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ API Key 和 Secret Key 設置成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ 設置失敗" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ 無效的選項" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 重新部署 Edge Function
Write-Host "📋 重新部署 Edge Function..." -ForegroundColor Yellow
$deploy = Read-Host "是否現在重新部署 ask-ai 函數？(Y/N)"
if ($deploy -eq "Y" -or $deploy -eq "y") {
    Write-Host ""
    Write-Host "🚀 正在部署..." -ForegroundColor Cyan
    npx supabase functions deploy ask-ai
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 修復完成！請刷新瀏覽器頁面並測試 AI 聊天功能。" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 部署失敗，請檢查錯誤訊息" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "💡 請記得執行以下命令重新部署：" -ForegroundColor Yellow
    Write-Host "   npx supabase functions deploy ask-ai" -ForegroundColor Gray
}

Write-Host ""

