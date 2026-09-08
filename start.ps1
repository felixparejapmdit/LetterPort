# LetterPort PowerShell Launcher
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + $env:PATH

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    LetterPort Letter Management System (LMS)      " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$backendJob = Start-Job -ScriptBlock {
    param($root)
    $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + $env:PATH
    Set-Location "$root\backend"
    npm run dev
} -ArgumentList $PSScriptRoot

Write-Host "Backend API booting on http://localhost:8766..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Set-Location "$PSScriptRoot\frontend"
Write-Host "Starting Next.js Frontend on http://localhost:8765..." -ForegroundColor Green
npm run dev
