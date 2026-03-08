@echo off
echo ============================================
echo  HR Analytics Dashboard - Local Startup
echo ============================================
echo.

:: Check if Docker is available
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [Option 1] Docker detected. Starting with Docker...
    echo.
    docker-compose up --build -d
    echo.
    echo Dashboard is starting at: http://localhost:8080
    echo.
    echo To stop: docker-compose down
    pause
    exit /b
)

:: Fallback: use npm
echo [Option 2] Docker not found. Starting with npm...
echo.

:: Copy local env
if not exist .env (
    copy .env.local .env
    echo Copied .env.local to .env
)

:: Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting development server...
echo Dashboard will open at: http://localhost:8080
echo.
call npm run dev
pause
