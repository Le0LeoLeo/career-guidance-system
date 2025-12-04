# GitHub 上傳腳本
# 請先將此腳本中的儲存庫網址替換成您的實際網址

# 確認在正確的目錄
cd C:\Users\acer\OneDrive\Desktop\AI_proj

# 初始化 Git（如果還沒有）
git init

# 添加所有文件
git add .

# 提交文件
git commit -m "Initial commit - Career Guidance System"

# 連接到 GitHub（請替換成您的儲存庫網址）
# git remote add origin https://github.com/您的用戶名/career-guidance-system.git

# 設定主分支
git branch -M main

# 推送到 GitHub
# git push -u origin main

Write-Host "請先執行以下步驟：" -ForegroundColor Yellow
Write-Host "1. 在 GitHub 建立新儲存庫" -ForegroundColor Cyan
Write-Host "2. 複製儲存庫的 HTTPS 網址" -ForegroundColor Cyan
Write-Host "3. 取消註解上面兩行（移除 # 符號）並填入您的儲存庫網址" -ForegroundColor Cyan
Write-Host "4. 重新執行此腳本" -ForegroundColor Cyan

