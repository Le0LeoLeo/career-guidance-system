# 本地開發伺服器腳本
# 使用方式：在 PowerShell 中執行 .\dev-server.ps1

Write-Host "正在啟動本地開發伺服器..." -ForegroundColor Green
Write-Host "伺服器地址: http://localhost:8000" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止伺服器" -ForegroundColor Yellow
Write-Host ""

# 檢查 Python 是否安裝
try {
    $pythonVersion = python --version 2>&1
    Write-Host "使用 $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤: 未找到 Python，請先安裝 Python" -ForegroundColor Red
    exit 1
}

# 啟動 HTTP 伺服器
python -m http.server 8000

