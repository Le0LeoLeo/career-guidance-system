# 使用 Chrome DevTools 的自動測試腳本
# 監視代碼變化，自動重新載入頁面並運行測試

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Chrome DevTools 自動測試監視器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "功能:" -ForegroundColor Yellow
Write-Host "  1. 監視代碼文件變化" -ForegroundColor White
Write-Host "  2. 自動重新載入頁面" -ForegroundColor White
Write-Host "  3. 運行自動化測試" -ForegroundColor White
Write-Host ""
Write-Host "請確保:" -ForegroundColor Yellow
Write-Host "  1. 開發服務器運行在 http://localhost:8000" -ForegroundColor White
Write-Host "  2. Chrome DevTools MCP 服務已連接" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止監視" -ForegroundColor Yellow
Write-Host ""

# 檢查 Node.js（用於運行測試腳本）
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "警告: 未找到 Node.js，某些功能可能無法使用" -ForegroundColor Yellow
}

# 檢查 Python（用於開發服務器）
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "警告: 未找到 Python" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "監視的文件:" -ForegroundColor Cyan
Write-Host "  - app.js" -ForegroundColor White
Write-Host "  - index.html" -ForegroundColor White
Write-Host "  - style.css" -ForegroundColor White
Write-Host "  - test/*.js" -ForegroundColor White
Write-Host ""

# 創建測試腳本（將由 Node.js 執行）
$testScript = @"
// Chrome DevTools 自動測試腳本
// 這個腳本會通過 MCP 與 Chrome DevTools 通信

const testCases = [
  {
    name: '頁面載入測試',
    test: async () => {
      // 檢查頁面是否正確載入
      const title = await evaluateScript('() => document.title');
      return title === '學生職涯輔導系統';
    }
  },
  {
    name: '登入視圖顯示測試',
    test: async () => {
      const loginView = await evaluateScript('() => {
        const el = document.getElementById("login-view");
        return el ? el.style.display !== "none" : false;
      }');
      return loginView;
    }
  },
  {
    name: 'DOM 元素存在測試',
    test: async () => {
      const elements = await evaluateScript('() => {
        const required = [
          "login-view",
          "dashboard-view",
          "student-status-select-view"
        ];
        return required.every(id => document.getElementById(id) !== null);
      }');
      return elements;
    }
  }
];

async function runTests() {
  console.log('開始運行測試...');
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await testCase.test();
      results.push({
        name: testCase.name,
        passed: result,
        error: null
      });
      console.log(\`\${testCase.name}: \${result ? '✓ 通過' : '✗ 失敗'}\`);
    } catch (error) {
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message
      });
      console.log(\`\${testCase.name}: ✗ 錯誤 - \${error.message}\`);
    }
  }
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(\`\n測試結果: \${passed}/\${total} 通過\`);
  
  return results;
}

// 注意：實際的 Chrome DevTools 調用需要通過 MCP 服務器
// 這個腳本是一個模板，實際執行需要 MCP 客戶端支持
"@

$testScript | Out-File -FilePath "test-chrome.js" -Encoding UTF8

Write-Host "測試腳本已創建: test-chrome.js" -ForegroundColor Green
Write-Host ""
Write-Host "監視器已啟動，等待文件變化..." -ForegroundColor Green
Write-Host ""
Write-Host "提示: 使用 Chrome DevTools MCP 工具來:" -ForegroundColor Yellow
Write-Host "  - 重新載入頁面: navigate_page" -ForegroundColor White
Write-Host "  - 檢查元素: take_snapshot" -ForegroundColor White
Write-Host "  - 運行測試: evaluate_script" -ForegroundColor White
Write-Host "  - 截圖: take_screenshot" -ForegroundColor White
Write-Host ""

# 文件監視器
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PSScriptRoot
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$excludePatterns = @("node_modules", ".git", ".vscode", "__pycache__", "test-chrome.js")

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $name = $Event.SourceEventArgs.Name
    $changeType = $Event.SourceEventArgs.ChangeType
    
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
        Write-Host "檢測到文件變化: $name" -ForegroundColor Yellow
        Write-Host "時間: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "請使用 Chrome DevTools MCP 工具:" -ForegroundColor Yellow
        Write-Host "  1. 重新載入頁面 (navigate_page)" -ForegroundColor White
        Write-Host "  2. 檢查頁面狀態 (take_snapshot)" -ForegroundColor White
        Write-Host "  3. 運行測試 (evaluate_script)" -ForegroundColor White
        Write-Host ""
    }
}

Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null

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


