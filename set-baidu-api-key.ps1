# 设置百度 API Key 脚本
# 用于正确设置 BAIDU_API_KEY 环境变量到 Supabase Edge Functions

Write-Host "=== 设置百度 API Key ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Supabase CLI
Write-Host "检查 Supabase CLI..." -ForegroundColor Yellow
try {
    $cliVersion = npx supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Supabase CLI 可用: $cliVersion" -ForegroundColor Green
    } else {
        Write-Host "Supabase CLI 不可用，请先安装" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Supabase CLI 不可用，请先安装" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 检查登录状态
Write-Host "检查登录状态..." -ForegroundColor Yellow
try {
    npx supabase projects list 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "已登录 Supabase" -ForegroundColor Green
    } else {
        Write-Host "需要登录 Supabase" -ForegroundColor Yellow
        Write-Host "正在打开浏览器登录..." -ForegroundColor Cyan
        npx supabase login
    }
} catch {
    Write-Host "需要登录 Supabase" -ForegroundColor Yellow
    Write-Host "正在打开浏览器登录..." -ForegroundColor Cyan
    npx supabase login
}

Write-Host ""

# 链接项目
Write-Host "链接项目..." -ForegroundColor Yellow
$projectRef = "naqyczuuariosniudbsr"
try {
    npx supabase link --project-ref $projectRef 2>&1 | Out-Null
    Write-Host "项目已链接" -ForegroundColor Green
} catch {
    Write-Host "项目可能已链接，继续..." -ForegroundColor Yellow
}

Write-Host ""

# 获取当前 API Key（如果存在）
Write-Host "检查当前 API Key..." -ForegroundColor Yellow
try {
    $secrets = npx supabase secrets list 2>&1
    if ($secrets -match "BAIDU_API_KEY") {
        Write-Host "当前已设置 BAIDU_API_KEY" -ForegroundColor Yellow
        Write-Host "注意：将覆盖现有值" -ForegroundColor Yellow
    } else {
        Write-Host "BAIDU_API_KEY 未设置" -ForegroundColor Yellow
    }
} catch {
    Write-Host "无法检查当前设置，继续..." -ForegroundColor Yellow
}

Write-Host ""

# 提示输入 API Key
Write-Host "请输入百度 API Key：" -ForegroundColor Cyan
Write-Host "格式要求：" -ForegroundColor Yellow
Write-Host "  - 千帆平台格式：bce-v3/xxx-xxx-xxx" -ForegroundColor White
Write-Host "  - 示例：bce-v3/1234567890abcdef/2024-01-01/your-region/qianfan/qianfan" -ForegroundColor Gray
Write-Host ""
Write-Host "提示：可以直接粘贴，脚本会自动清理空白字符和控制字符" -ForegroundColor Gray
Write-Host ""

$apiKey = Read-Host "API Key"

# 清理 API Key
if ($apiKey) {
    # 去除首尾空白
    $apiKey = $apiKey.Trim()
    
    # 去除控制字符（ASCII 0-31 和 127-159）
    $apiKey = $apiKey -replace '[\x00-\x1F\x7F-\x9F]', ''
    
    Write-Host ""
    Write-Host "清理后的 API Key 长度: $($apiKey.Length)" -ForegroundColor Cyan
    Write-Host "前30个字符: $($apiKey.Substring(0, [Math]::Min(30, $apiKey.Length)))" -ForegroundColor Gray
    
    # 验证格式
    if ($apiKey -match '^bce-v3/') {
        Write-Host "✅ API Key 格式正确（千帆格式）" -ForegroundColor Green
    } elseif ($apiKey.Length -gt 0) {
        Write-Host "⚠️  API Key 不是千帆格式（bce-v3/开头）" -ForegroundColor Yellow
        Write-Host "   如果使用 OAuth 2.0，请确保同时设置 BAIDU_SECRET_KEY" -ForegroundColor Yellow
        $confirm = Read-Host "是否继续设置？(y/n)"
        if ($confirm -ne 'y' -and $confirm -ne 'Y') {
            Write-Host "已取消" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "❌ API Key 为空" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "正在设置 API Key..." -ForegroundColor Yellow
    
    # 设置环境变量
    try {
        $result = npx supabase secrets set BAIDU_API_KEY=$apiKey 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ BAIDU_API_KEY 设置成功！" -ForegroundColor Green
            Write-Host ""
            Write-Host "下一步：" -ForegroundColor Cyan
            Write-Host "1. 等待 1-2 分钟让设置生效" -ForegroundColor White
            Write-Host "2. 在测试页面测试 Edge Function" -ForegroundColor White
            Write-Host "3. 如果仍有问题，检查 Supabase Dashboard 中的函数日志" -ForegroundColor White
        } else {
            Write-Host "❌ 设置失败" -ForegroundColor Red
            Write-Host "错误信息: $result" -ForegroundColor Red
            Write-Host ""
            Write-Host "请手动运行以下命令：" -ForegroundColor Yellow
            Write-Host "npx supabase secrets set BAIDU_API_KEY=$apiKey" -ForegroundColor Cyan
            exit 1
        }
    } catch {
        Write-Host "❌ 设置时发生错误: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ 未输入 API Key" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "完成！" -ForegroundColor Green

