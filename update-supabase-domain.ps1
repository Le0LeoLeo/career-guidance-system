# 更新 Supabase URL 為自定義域名腳本
# 使用方法: .\update-supabase-domain.ps1 -NewDomain "https://sage.example.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewDomain,
    
    [string]$OldDomain = "https://naqyczuuariosniudbsr.supabase.co"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "更新 Supabase URL 為自定義域名" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 驗證新域名格式
if ($NewDomain -notmatch "^https?://") {
    Write-Host "❌ 錯誤：域名必須以 http:// 或 https:// 開頭" -ForegroundColor Red
    Write-Host "   範例：https://sage.example.com" -ForegroundColor Yellow
    exit 1
}

Write-Host "舊的 Supabase URL: $OldDomain" -ForegroundColor Yellow
Write-Host "新的 Supabase URL: $NewDomain" -ForegroundColor Green
Write-Host ""

# 確認操作
$confirm = Read-Host "確定要更新所有文件中的 Supabase URL 嗎？(Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "開始更新文件..." -ForegroundColor Cyan
Write-Host ""

# 需要更新的文件列表
$filesToUpdate = @(
    "app.js",
    "test-ai-functionality.js",
    "fix-database-field.js",
    "add-majors-tool.html",
    "diagnose-ai-target-issue.js",
    "browser-diagnose-ai-target.js"
)

$updatedCount = 0
$errorCount = 0

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            $originalContent = $content
            
            # 替換各種可能的 Supabase URL 格式
            $content = $content -replace [regex]::Escape($OldDomain), $NewDomain
            $content = $content -replace "const SUPABASE_URL = ['`"]https://[^'`"]+['`"]", "const SUPABASE_URL = '$NewDomain'"
            $content = $content -replace "SUPABASE_URL.*=.*['`"]https://[^'`"]+['`"]", "SUPABASE_URL = '$NewDomain'"
            
            # 如果內容有變化，寫入文件
            if ($content -ne $originalContent) {
                Set-Content $file -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✅ 已更新: $file" -ForegroundColor Green
                $updatedCount++
            } else {
                Write-Host "⏭️  跳過: $file (未找到需要更新的內容)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ 錯誤更新 $file : $_" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "⚠️  文件不存在: $file" -ForegroundColor Yellow
    }
}

# 更新測試文件
$testFiles = @(
    "test\app.test.js",
    "test\setup.js"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            $originalContent = $content
            
            # 替換 localhost URL（如果有的話）
            $content = $content -replace "http://localhost", $NewDomain
            
            if ($content -ne $originalContent) {
                Set-Content $file -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✅ 已更新: $file" -ForegroundColor Green
                $updatedCount++
            }
        } catch {
            Write-Host "❌ 錯誤更新 $file : $_" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "更新完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "成功更新: $updatedCount 個文件" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "錯誤: $errorCount 個文件" -ForegroundColor Red
}
Write-Host ""

# 顯示後續步驟
Write-Host "📋 後續步驟：" -ForegroundColor Cyan
Write-Host "1. 在 Supabase Dashboard 中配置自定義域名" -ForegroundColor White
Write-Host "2. 設定 DNS 記錄（CNAME 或 A 記錄）" -ForegroundColor White
Write-Host "3. 等待 DNS 傳播和 SSL 憑證配置（5-60 分鐘）" -ForegroundColor White
Write-Host "4. 更新 Supabase Auth 的 Site URL 和 Redirect URLs" -ForegroundColor White
Write-Host "5. 測試應用功能" -ForegroundColor White
Write-Host ""
Write-Host "詳細說明請參考: CONFIGURE_CUSTOM_DOMAIN.md" -ForegroundColor Yellow
Write-Host ""

# 詢問是否要查看更新的文件
$viewFiles = Read-Host "是否要查看 app.js 中的更新？(Y/N)"
if ($viewFiles -eq "Y" -or $viewFiles -eq "y") {
    Write-Host ""
    Write-Host "app.js 中的 Supabase 配置：" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Get-Content app.js | Select-String -Pattern "SUPABASE_URL" | ForEach-Object {
        Write-Host $_.Line -ForegroundColor White
    }
    Write-Host "----------------------------------------" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ 腳本執行完成！" -ForegroundColor Green






