# 自動測試監視腳本
# 監視代碼變化並自動運行測試

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  自動測試監視器已啟動" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "監視的文件:" -ForegroundColor Yellow
Write-Host "  - app.js" -ForegroundColor White
Write-Host "  - index.html" -ForegroundColor White
Write-Host "  - test/*.js" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止監視" -ForegroundColor Yellow
Write-Host ""

# 檢查 Node.js 是否安裝
try {
    $nodeVersion = node --version 2>&1
    Write-Host "使用 Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤: 未找到 Node.js，請先安裝 Node.js" -ForegroundColor Red
    Write-Host "下載地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 檢查是否已安裝依賴
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安裝依賴..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "錯誤: 依賴安裝失敗" -ForegroundColor Red
        exit 1
    }
    Write-Host "依賴安裝完成" -ForegroundColor Green
    Write-Host ""
}

# 首次運行測試
Write-Host "執行初始測試..." -ForegroundColor Cyan
npm run test
Write-Host ""

# 監視文件變化並自動運行測試
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PSScriptRoot
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# 排除不需要監視的文件夾
$excludePatterns = @("node_modules", ".git", ".vscode", "__pycache__")

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $name = $Event.SourceEventArgs.Name
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # 檢查是否應該忽略此文件
    $shouldIgnore = $false
    foreach ($pattern in $excludePatterns) {
        if ($path -like "*\$pattern\*") {
            $shouldIgnore = $true
            break
        }
    }
    
    # 只監視相關文件
    $relevantExtensions = @(".js", ".html", ".css")
    $isRelevant = $false
    foreach ($ext in $relevantExtensions) {
        if ($path -like "*$ext") {
            $isRelevant = $true
            break
        }
    }
    
    if (-not $shouldIgnore -and $isRelevant) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "檢測到文件變化: $name ($changeType)" -ForegroundColor Yellow
        Write-Host "路徑: $path" -ForegroundColor Gray
        Write-Host "正在運行測試..." -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        
        # 等待一小段時間，確保文件寫入完成
        Start-Sleep -Milliseconds 500
        
        # 運行測試
        npm run test
        
        Write-Host ""
        Write-Host "測試完成，繼續監視..." -ForegroundColor Green
        Write-Host ""
    }
}

# 註冊事件處理器
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null

Write-Host "監視器已啟動，等待文件變化..." -ForegroundColor Green
Write-Host ""

# 保持腳本運行
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Host ""
    Write-Host "監視器已停止" -ForegroundColor Yellow
}




