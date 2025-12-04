# Setup chat_sessions table using Supabase Dashboard
# This script will guide you through the process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup chat_sessions Table" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "chat_sessions_table.sql"

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "SQL file found: $sqlFile" -ForegroundColor Green
Write-Host ""

# Display instructions
Write-Host "Please follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/naqyczuuariosniudbsr/sql/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Copy the SQL content from: $sqlFile" -ForegroundColor White
Write-Host ""
Write-Host "3. Paste into SQL Editor and click Run" -ForegroundColor White
Write-Host ""
Write-Host "4. After execution, refresh your app page (F5)" -ForegroundColor White
Write-Host ""

# Ask if user wants to open the SQL file
$response = Read-Host "Open SQL file in notepad? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    notepad $sqlFile
}

# Ask if user wants to open browser
$response = Read-Host "Open Supabase Dashboard in browser? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    Start-Process "https://supabase.com/dashboard/project/naqyczuuariosniudbsr/sql/new"
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

