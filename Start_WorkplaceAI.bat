@echo off
chcp 65001 >nul 2>nul
title WorkplaceAI - Local Startup
color 0F

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         WorkplaceAI – Local Startup              ║
echo  ║         HR Analytics Dashboard                   ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Checking system requirements...
echo.

set MISSING=0
set NODE_OK=0
set NPM_OK=0
set GIT_OK=0
set DOCKER_OK=0

:: ── Check Node.js ──
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [✗] Node.js          — Not Installed
    set MISSING=1
) else (
    for /f "tokens=1 delims=v" %%a in ('node -v 2^>nul') do set NODE_RAW=%%a
    for /f "tokens=1 delims=." %%b in ('node -v 2^>nul') do set NODE_MAJOR=%%b
    set NODE_MAJOR=%NODE_MAJOR:v=%
    call set NODE_MAJOR=%%NODE_MAJOR:v=%%
    for /f "delims=v. tokens=1" %%m in ('node -v') do set NODE_MAJOR=%%m
    :: Re-check with a simpler method
    for /f "tokens=*" %%v in ('node -e "process.stdout.write(String(process.versions.node.split(\".\")[0]))"') do set NODE_MAJOR=%%v
    if !NODE_MAJOR! LSS 20 (
        echo   [!] Node.js          — Version !NODE_MAJOR! found ^(v20+ required^)
        set MISSING=1
    ) else (
        echo   [✓] Node.js          — v!NODE_MAJOR! detected
        set NODE_OK=1
    )
)

:: ── Check NPM ──
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [✗] npm              — Not Installed
    set MISSING=1
) else (
    for /f "tokens=*" %%v in ('npm -v 2^>nul') do set NPM_VER=%%v
    echo   [✓] npm              — v%NPM_VER% detected
    set NPM_OK=1
)

:: ── Check Git (optional) ──
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [~] Git              — Not Installed ^(optional^)
) else (
    for /f "tokens=3" %%v in ('git --version 2^>nul') do set GIT_VER=%%v
    echo   [✓] Git              — v%GIT_VER% detected
    set GIT_OK=1
)

:: ── Check Docker (optional) ──
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [~] Docker           — Not Installed ^(optional^)
) else (
    echo   [✓] Docker           — Detected
    set DOCKER_OK=1
)

echo.

:: ── If missing required components, show help ──
if %MISSING% EQU 1 (
    echo  ╔══════════════════════════════════════════════════╗
    echo  ║       Missing Required Software                  ║
    echo  ╚══════════════════════════════════════════════════╝
    echo.
    echo   Please install the following before continuing:
    echo.
    if %NODE_OK% EQU 0 (
        echo     Node.js ^(v20 or higher^)
        echo     Download: https://nodejs.org
        echo.
    )
    if %NPM_OK% EQU 0 (
        echo     npm ^(comes with Node.js^)
        echo     Download: https://nodejs.org
        echo.
    )
    echo   After installing:
    echo     1. Restart your computer
    echo     2. Double-click Start_WorkplaceAI.bat again
    echo.
    pause
    exit /b 1
)

:: ── All checks passed ──
echo   All requirements verified ✓
echo.

:: ── Install dependencies if needed ──
if not exist node_modules (
    echo  Installing dependencies... ^(this may take a few minutes^)
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [ERROR] Dependency installation failed.
        echo  Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo.
    echo   Dependencies installed ✓
) else (
    echo   Dependencies already installed ✓
)

:: ── Copy local env if needed ──
if exist .env.local (
    if not exist .env (
        copy .env.local .env >nul
        echo   Local configuration applied ✓
    )
)

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Starting WorkplaceAI...                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo   Application server starting ✓
echo.
echo   Opening browser in 5 seconds...
echo.
echo   Application will be available at:
echo.
echo     http://localhost:8080
echo.
echo   To stop: Close this window or press Ctrl+C
echo.

:: ── Open browser after a short delay ──
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:8080"

:: ── Start the dev server ──
call npm run dev
