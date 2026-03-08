@echo off
title WorkplaceAI - Stop Services
color 0F

echo.
echo  ==================================================
echo           WorkplaceAI - Stop Services
echo  ==================================================
echo.

:: Stop Node.js processes on port 8080
echo  Stopping application server...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>nul
)

:: Stop Docker if running
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  Stopping Docker containers...
    docker-compose down >nul 2>nul
)

echo.
echo   All services stopped OK
echo.
pause
