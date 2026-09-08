@echo off
setlocal
echo ===================================================
echo     Starting LetterPort LMS (Backend & Frontend)
echo ===================================================

:: Ensure Node is in PATH
set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%

:: Start Backend API in a separate window
echo Starting Backend API on http://localhost:5000 ...
start "LetterPort Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start Frontend UI in a separate window
echo Starting Frontend Next.js UI on http://localhost:3000 ...
start "LetterPort Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Services launched!
echo - Backend API: http://localhost:5000/api
echo - Frontend UI: http://localhost:3000
echo.
pause
