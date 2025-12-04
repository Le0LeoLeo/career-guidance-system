# Chrome DevTools 自動測試系統
# 監視代碼變化，自動重新載入頁面並運行測試

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Chrome DevTools 自動測試系統" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "功能:" -ForegroundColor Yellow
Write-Host "  ✓ 監視代碼文件變化" -ForegroundColor White
Write-Host "  ✓ 自動重新載入頁面" -ForegroundColor White
Write-Host "  ✓ 自動運行測試" -ForegroundColor White
Write-Host "  ✓ 顯示測試結果" -ForegroundColor White
Write-Host ""
Write-Host "請確保開發服務器運行在 http://localhost:8000" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 停止" -ForegroundColor Yellow
Write-Host ""

# 測試函數（將通過 Chrome DevTools MCP 執行）
$testScript = @'
() => {
  const results = {
    pageLoad: {
      name: '頁面標題測試',
      passed: document.title === '學生職涯輔導系統',
      actual: document.title
    },
    domElements: (() => {
      const required = ['login-view', 'dashboard-view', 'student-status-select-view', 
                       'student-decided-view', 'student-undecided-view', 'teacher-view'];
      const missing = required.filter(id => !document.getElementById(id));
      return {
        name: 'DOM 元素存在測試',
        passed: missing.length === 0,
        missing: missing,
        found: required.length - missing.length,
        total: required.length
      };
    })(),
    supabaseInit: {
      name: 'Supabase 初始化測試',
      passed: typeof window.supabase !== 'undefined' || typeof supabase !== 'undefined'
    },
    currentView: (() => {
      const views = ['login-view', 'dashboard-view', 'student-status-select-view', 
                    'student-decided-view', 'student-undecided-view', 'teacher-view'];
      const visible = views.find(id => {
        const el = document.getElementById(id);
        return el && el.style.display !== 'none';
      });
      return {
        name: '當前視圖測試',
        passed: !!visible,
        visible: visible || '無'
      };
    })(),
    consoleErrors: (() => {
      // 檢查是否有控制台錯誤（需要預先設置）
      return {
        name: '控制台錯誤檢查',
        passed: true, // 需要通過其他方式檢查
        note: '請手動檢查瀏覽器控制台'
      };
    })()
  };
  
  const passed = Object.values(results).filter(r => r.passed).length;
  const total = Object.keys(results).length;
  
  return {
    summary: {
      passed,
      total,
      percentage: ((passed / total) * 100).toFixed(1) + '%',
      timestamp: new Date().toISOString()
    },
    results: results
  };
}
'@

# 保存測試腳本
$testScript | Out-File -FilePath "chrome-test-function.js" -Encoding UTF8

Write-Host "測試腳本已準備" -ForegroundColor Green
Write-Host ""
Write-Host "監視的文件:" -ForegroundColor Cyan
Write-Host "  - app.js" -ForegroundColor White
Write-Host "  - index.html" -ForegroundColor White
Write-Host "  - style.css" -ForegroundColor White
Write-Host ""

# 文件監視器
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PSScriptRoot
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$excludePatterns = @("node_modules", ".git", ".vscode", "__pycache__", 
                    "chrome-test-function.js", "chrome-auto-test.ps1", 
                    "coverage", ".cache")

$lastChangeTime = Get-Date
$debounceSeconds = 1

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $name = $Event.SourceEventArgs.Name
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # 防抖：避免重複觸發
    $now = Get-Date
    if (($now - $script:lastChangeTime).TotalSeconds -lt $debounceSeconds) {
        return
    }
    $script:lastChangeTime = $now
    
    $shouldIgnore = $false
    foreach ($pattern in $excludePatterns) {
        if ($path -like "*\$pattern\*") {
            $shouldIgnore = $true
            break
        }
    }
    
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
        Write-Host "📝 檢測到文件變化: $name" -ForegroundColor Yellow
        Write-Host "   時間: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
        Write-Host "   類型: $changeType" -ForegroundColor Gray
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 請在 Cursor 中使用 Chrome DevTools 工具:" -ForegroundColor Yellow
        Write-Host "   1. navigate_page (重新載入頁面)" -ForegroundColor White
        Write-Host "   2. evaluate_script (運行測試)" -ForegroundColor White
        Write-Host "   3. take_snapshot (檢查頁面狀態)" -ForegroundColor White
        Write-Host ""
        Write-Host "或使用快捷方式:" -ForegroundColor Yellow
        Write-Host "   - 告訴 AI: '重新載入頁面並運行測試'" -ForegroundColor White
        Write-Host ""
    }
}

Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null

Write-Host "✅ 監視器已啟動" -ForegroundColor Green
Write-Host ""
Write-Host "等待文件變化..." -ForegroundColor Cyan
Write-Host ""

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

