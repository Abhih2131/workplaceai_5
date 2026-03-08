@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title WorkplaceAI - Local Startup
color 0F

echo.
echo ==================================================
echo           WorkplaceAI - Local Startup
echo ==================================================
echo.

set MISSING=0
set NODE_OK=0
set NPM_OK=0

:: -- Check Node.js --
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found
    set MISSING=1
) else (
    for /f "tokens=*" %%v in ('node -e "process.stdout.write(String(process.versions.node.split('.')[0]))"') do set NODE_MAJOR=%%v
    if !NODE_MAJOR! LSS 20 (
        echo [!] Node.js v!NODE_MAJOR! found. v20+ required.
        set MISSING=1
    ) else (
        echo [OK] Node.js v!NODE_MAJOR! detected
        set NODE_OK=1
    )
)

:: -- Check npm --
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] npm not found
    set MISSING=1
) else (
    for /f "tokens=*" %%v in ('npm -v 2^>nul') do set NPM_VER=%%v
    echo [OK] npm v%NPM_VER% detected
    set NPM_OK=1
)

if %MISSING% EQU 1 (
    echo.
    echo Missing required software. Please install Node.js v20+ from https://nodejs.org
    pause
    exit /b 1
)

:: -- Install dependencies if needed --
if not exist node_modules (
    echo.
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: -- Copy local env if needed --
if exist .env.local (
    if not exist .env (
        copy .env.local .env >nul
    )
)

echo.
echo Starting development server on http://localhost:8080 ...

:: -- Start Vite in a separate window so this script can wait for readiness --
start "WorkplaceAI Dev Server" cmd /k "cd /d ""%~dp0"" && npm run dev"

:: -- Wait until port 8080 is listening (max 60s) --
set RETRY=0
:WAIT_FOR_SERVER
set PORT_OPEN=
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do set PORT_OPEN=1
if defined PORT_OPEN goto OPEN_BROWSER
set /a RETRY+=1
if %RETRY% GEQ 60 goto TIMEOUT
timeout /t 1 /nobreak >nul
goto WAIT_FOR_SERVER

:OPEN_BROWSER
echo Server is ready. Opening browser...
start "" "http://localhost:8080"
exit /b 0

:TIMEOUT
echo.
echo [WARN] Server did not start within 60 seconds.
echo Open this manually once the server is ready: http://localhost:8080
pause
exit /b 1
