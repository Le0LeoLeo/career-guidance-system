# 整合開發服務器和自動測試的腳本
# 同時啟動 HTTP 服務器和測試監視器

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  開發環境啟動器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "功能:" -ForegroundColor Yellow
Write-Host "  1. HTTP 開發服務器 (http://localhost:8000)" -ForegroundColor White
Write-Host "  2. 自動測試監視器" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服務" -ForegroundColor Yellow
Write-Host ""

# 檢查 Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤: 未找到 Node.js" -ForegroundColor Red
    exit 1
}

# 檢查 Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤: 未找到 Python" -ForegroundColor Red
    exit 1
}

# 檢查依賴
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "正在安裝依賴..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host ""
Write-Host "正在啟動服務..." -ForegroundColor Cyan
Write-Host ""

# 啟動測試監視器（後台）
$testJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run test:watch
}

# 等待一下讓測試監視器啟動
Start-Sleep -Seconds 2

# 啟動 HTTP 服務器（前台）
Write-Host "HTTP 服務器: http://localhost:8000" -ForegroundColor Green
Write-Host "測試監視器: 運行中（後台）" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服務" -ForegroundColor Yellow
Write-Host ""

try {
    python -m http.server 8000
} finally {
    # 清理：停止測試監視器
    Write-Host ""
    Write-Host "正在停止測試監視器..." -ForegroundColor Yellow
    Stop-Job $testJob
    Remove-Job $testJob
    Write-Host "所有服務已停止" -ForegroundColor Green
}



