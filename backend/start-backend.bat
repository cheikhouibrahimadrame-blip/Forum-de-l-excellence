@echo off
echo.
echo ========================================
echo  Forum de L'excellence - Backend Server
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

REM Check if .env file exists
if not exist ".env" (
    echo Warning: .env file not found
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:khaliloulah66@127.0.0.1:5432/forum_excellence?connect_timeout=10
        echo PORT=5001
        echo INSTITUTION_DOMAINS=gmail.com,institution.edu
    ) > .env
    echo .env file created with default values
)

REM Start the backend server
echo.
echo Starting backend server on port 5001...
echo.

npm run dev

if errorlevel 1 (
    echo.
    echo Error: Failed to start backend server
    echo Make sure PostgreSQL is running and the database is accessible
    pause
)
