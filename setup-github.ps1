# GitHub Setup Script for NexaCRM
# Run this after installing Git

Write-Host "=== NexaCRM GitHub Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is NOT installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "After installation, restart this terminal and run this script again." -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""

# Check if Git is configured
$gitName = git config --global user.name
$gitEmail = git config --global user.email

if (-not $gitName -or -not $gitEmail) {
    Write-Host "Git is not configured yet." -ForegroundColor Yellow
    Write-Host ""
    $name = Read-Host "Enter your name"
    $email = Read-Host "Enter your email"
    
    git config --global user.name "$name"
    git config --global user.email "$email"
    
    Write-Host "✓ Git configured successfully!" -ForegroundColor Green
} else {
    Write-Host "✓ Git already configured:" -ForegroundColor Green
    Write-Host "  Name: $gitName"
    Write-Host "  Email: $gitEmail"
}

Write-Host ""

# Check if already a git repository
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

Write-Host ""

# Check status
Write-Host "Checking repository status..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Review the files above - make sure no sensitive data is included"
Write-Host "2. Run: git add ."
Write-Host "3. Run: git commit -m `"Initial commit: NexaCRM project`""
Write-Host "4. Create a repository on GitHub.com"
Write-Host "5. Run: git remote add origin https://github.com/YOUR_USERNAME/nexacrm.git"
Write-Host "6. Run: git branch -M main"
Write-Host "7. Run: git push -u origin main"
Write-Host ""
Write-Host "See GITHUB_SETUP_GUIDE.md for detailed instructions!" -ForegroundColor Green
Write-Host ""

pause
