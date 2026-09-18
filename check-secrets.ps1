# Security Check Script - Find Potential Secrets Before Committing
# Run this before pushing to GitHub

Write-Host "=== Security Check - Scanning for Potential Secrets ===" -ForegroundColor Cyan
Write-Host ""

$foundIssues = $false

# Check if .env files are properly gitignored
Write-Host "Checking .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "✓ .env files are gitignored" -ForegroundColor Green
    } else {
        Write-Host "✗ WARNING: .env files might not be gitignored!" -ForegroundColor Red
        $foundIssues = $true
    }
} else {
    Write-Host "✗ WARNING: No .gitignore file found!" -ForegroundColor Red
    $foundIssues = $true
}

Write-Host ""

# Check for .env files in staging area
Write-Host "Checking for .env files in git..." -ForegroundColor Yellow
try {
    $trackedEnvFiles = git ls-files | Where-Object { $_ -match "\.env$" -and $_ -notmatch "\.env\.example" }
    if ($trackedEnvFiles) {
        Write-Host "✗ WARNING: Found .env files in git!" -ForegroundColor Red
        $trackedEnvFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        $foundIssues = $true
    } else {
        Write-Host "✓ No .env files in git" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Git not initialized yet or not installed" -ForegroundColor Yellow
}

Write-Host ""

# Search for common secret patterns in code
Write-Host "Scanning for hardcoded secrets in code files..." -ForegroundColor Yellow
Write-Host "(This may take a moment...)" -ForegroundColor Gray
Write-Host ""

$patterns = @{
    "Password" = 'password\s*[=:]\s*[''"`][^''"`]{3,}'
    "API Key" = 'api[_-]?key\s*[=:]\s*[''"`][^''"`]{10,}'
    "Secret" = 'secret\s*[=:]\s*[''"`][^''"`]{10,}'
    "Token" = 'token\s*[=:]\s*[''"`][^''"`]{20,}'
    "Private Key" = '-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----'
}

$excludeDirs = @("node_modules", ".git", ".next", "dist", "build", ".turbo")
$includeExts = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json")

foreach ($patternName in $patterns.Keys) {
    $pattern = $patterns[$patternName]
    
    try {
        $results = Get-ChildItem -Recurse -Include $includeExts -Exclude "*.example.*" |
            Where-Object { 
                $path = $_.FullName
                $exclude = $false
                foreach ($dir in $excludeDirs) {
                    if ($path -match [regex]::Escape($dir)) {
                        $exclude = $true
                        break
                    }
                }
                -not $exclude
            } |
            Select-String -Pattern $pattern -CaseSensitive:$false
        
        if ($results) {
            Write-Host "⚠ Found potential $patternName patterns:" -ForegroundColor Yellow
            foreach ($result in $results) {
                $relativePath = $result.Path -replace [regex]::Escape($PWD), "."
                Write-Host "  $relativePath : Line $($result.LineNumber)" -ForegroundColor Yellow
                Write-Host "    $($result.Line.Trim())" -ForegroundColor Gray
            }
            Write-Host ""
            $foundIssues = $true
        }
    } catch {
        # Silently continue if pattern search fails
    }
}

# Check for .pem files
Write-Host "Checking for certificate files (.pem)..." -ForegroundColor Yellow
$pemFiles = Get-ChildItem -Recurse -Filter "*.pem" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" }

if ($pemFiles) {
    Write-Host "⚠ Found .pem files (should be gitignored):" -ForegroundColor Yellow
    $pemFiles | ForEach-Object { 
        $relativePath = $_.FullName -replace [regex]::Escape($PWD), "."
        Write-Host "  - $relativePath" -ForegroundColor Yellow 
    }
    $foundIssues = $true
} else {
    Write-Host "✓ No .pem files found" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Scan Complete ===" -ForegroundColor Cyan
Write-Host ""

if ($foundIssues) {
    Write-Host "⚠ POTENTIAL ISSUES FOUND!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the warnings above before pushing to GitHub." -ForegroundColor Yellow
    Write-Host "Note: Some warnings may be false positives (e.g., in comments or documentation)." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Actions to take:" -ForegroundColor Cyan
    Write-Host "1. Review each flagged file manually" -ForegroundColor White
    Write-Host "2. Move secrets to .env files" -ForegroundColor White
    Write-Host "3. Ensure .env files are in .gitignore" -ForegroundColor White
    Write-Host "4. Use .env.example for templates (without real values)" -ForegroundColor White
} else {
    Write-Host "✓ No obvious issues found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code appears safe to commit." -ForegroundColor Green
    Write-Host "Remember: Always double-check manually before pushing sensitive projects." -ForegroundColor Gray
}

Write-Host ""
pause
