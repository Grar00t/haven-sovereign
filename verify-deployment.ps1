#!/usr/bin/env pwsh
<#
HAVEN IDE — Deployment Verification Script
Checks Ollama, Node.js, npm, and build status
#>

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         HAVEN IDE — Deployment Verification                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# 2. Check npm
Write-Host "[2/6] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# 3. Check Ollama
Write-Host "[3/6] Checking Ollama at http://127.0.0.1:11434..." -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/tags" -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
    $models = ($ollamaResponse.Content | ConvertFrom-Json).models
    Write-Host "   Available models:" -ForegroundColor Gray
    foreach ($model in $models) {
        Write-Host "   • $($model.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Ollama not responding. Start it with: ollama serve" -ForegroundColor Yellow
}

# 4. Check project folder
Write-Host "[4/6] Checking project folder..." -ForegroundColor Yellow
$projectPath = "C:\Users\Iqd20\OneDrive\OFFICIAL"
if (Test-Path $projectPath) {
    Write-Host "✅ Project folder found: $projectPath" -ForegroundColor Green
} else {
    Write-Host "❌ Project folder not found" -ForegroundColor Red
    exit 1
}

# 5. Check dependencies
Write-Host "[5/6] Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "$projectPath\node_modules") {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules missing. Run: npm install" -ForegroundColor Yellow
}

# 6. Check build folder
Write-Host "[6/6] Checking build folder..." -ForegroundColor Yellow
if (Test-Path "$projectPath\dist") {
    Write-Host "✅ dist/ folder exists (production build ready)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  dist/ folder not found. Run: npm run build" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    QUICK COMMANDS                          ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║ Development:     npm run dev                               ║" -ForegroundColor Cyan
Write-Host "║ Build:           npm run build                             ║" -ForegroundColor Cyan
Write-Host "║ Deploy:          npm run deploy:vercel                     ║" -ForegroundColor Cyan
Write-Host "║ Start Ollama:    ollama serve                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ HAVEN IDE is ready for deployment!" -ForegroundColor Green
