@echo off
echo.
echo ========================================
echo  Forum de L'excellence - Frontend Server
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo.
    echo Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the frontend server
echo.
echo Starting frontend server on port 5173...
echo.
echo Access the application at: http://localhost:5173
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo Error: Failed to start frontend server
    pause
)
