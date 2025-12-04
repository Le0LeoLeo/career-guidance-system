# Deploy Supabase Edge Function Script (using npx, no global install required)
# For fixing FunctionsFetchError

Write-Host "Starting Edge Function deployment (using npx)..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found, please install Node.js first" -ForegroundColor Red
    Write-Host "Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check Supabase CLI (via npx)
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = npx supabase --version 2>&1
    Write-Host "Supabase CLI available: $version" -ForegroundColor Green
} catch {
    Write-Host "First run will automatically download Supabase CLI" -ForegroundColor Yellow
}

Write-Host ""

# Check if logged in
Write-Host "Checking Supabase login status..." -ForegroundColor Yellow
try {
    $projects = npx supabase projects list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Logged in to Supabase" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "Need to login to Supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening browser for login..." -ForegroundColor Yellow
    Write-Host "If browser doesn't open, manually run: npx supabase login" -ForegroundColor Cyan
    Write-Host ""
    
    # Try to login
    npx supabase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Login failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please login manually:" -ForegroundColor Yellow
        Write-Host "1. Run: npx supabase login" -ForegroundColor Cyan
        Write-Host "2. Or visit: https://supabase.com/dashboard/account/tokens" -ForegroundColor Cyan
        Write-Host "3. Create access token and set environment variable:" -ForegroundColor Cyan
        Write-Host "   `$env:SUPABASE_ACCESS_TOKEN='your_token_here'" -ForegroundColor White
        Write-Host ""
        Write-Host "Then run this script again" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Link to project
Write-Host "Linking to project..." -ForegroundColor Yellow
$projectRef = "naqyczuuariosniudbsr"
Write-Host "Project ID: $projectRef" -ForegroundColor Cyan

try {
    npx supabase link --project-ref $projectRef 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Project linked successfully" -ForegroundColor Green
    } else {
        Write-Host "Project may already be linked, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Project may already be linked, continuing..." -ForegroundColor Yellow
}

Write-Host ""

# Check environment variables
Write-Host "Checking environment variables..." -ForegroundColor Yellow
try {
    $secrets = npx supabase secrets list 2>&1
    if ($secrets -match "BAIDU_API_KEY") {
        Write-Host "BAIDU_API_KEY is set" -ForegroundColor Green
    } else {
        Write-Host "BAIDU_API_KEY is not set" -ForegroundColor Yellow
        Write-Host ""
        $apiKey = Read-Host "Enter Baidu API Key (format: bce-v3/xxx, press Enter to skip)"
        if ($apiKey) {
            npx supabase secrets set BAIDU_API_KEY=$apiKey
            if ($LASTEXITCODE -eq 0) {
                Write-Host "BAIDU_API_KEY set successfully" -ForegroundColor Green
            } else {
                Write-Host "Failed to set environment variable, please set manually later" -ForegroundColor Yellow
                Write-Host "Command: npx supabase secrets set BAIDU_API_KEY=bce-v3/your_key" -ForegroundColor Cyan
            }
        } else {
            Write-Host "Skipping environment variable setup, please set manually later" -ForegroundColor Yellow
            Write-Host "Command: npx supabase secrets set BAIDU_API_KEY=bce-v3/your_key" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Cannot check environment variables, please set manually" -ForegroundColor Yellow
    Write-Host "Command: npx supabase secrets set BAIDU_API_KEY=bce-v3/your_key" -ForegroundColor Cyan
}

Write-Host ""

# Check if Edge Function code exists
Write-Host "Checking Edge Function code..." -ForegroundColor Yellow
$functionPath = "supabase\functions\ask-ai\index.ts"
if (Test-Path $functionPath) {
    Write-Host "Edge Function code exists: $functionPath" -ForegroundColor Green
} else {
    Write-Host "Edge Function code not found: $functionPath" -ForegroundColor Red
    Write-Host "Please ensure the file exists before deploying" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Deploy Edge Function
Write-Host "Deploying Edge Function..." -ForegroundColor Yellow
Write-Host "Function name: ask-ai" -ForegroundColor Cyan
Write-Host ""

try {
    npx supabase functions deploy ask-ai
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Edge Function deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Deployment failed, please check error messages" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "Deployment failed, please check error messages" -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Yellow
try {
    $functions = npx supabase functions list 2>&1
    Write-Host $functions
    if ($functions -match "ask-ai") {
        Write-Host ""
        Write-Host "Edge Function 'ask-ai' deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Function 'ask-ai' not found, please check deployment logs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Cannot verify deployment status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! You can now test the Edge Function on the test page" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open test page: http://localhost:8000/test_qianfan_api.html" -ForegroundColor White
Write-Host "2. Fill in Supabase URL and Anon Key" -ForegroundColor White
Write-Host "3. Click 'Diagnose Connection' button to verify" -ForegroundColor White
Write-Host "4. Click 'Test Edge Function Call' to test functionality" -ForegroundColor White
Write-Host ""
Write-Host "If test fails, wait 1-2 minutes for deployment to take effect" -ForegroundColor Yellow
