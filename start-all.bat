@echo off
echo.
echo ========================================
echo  Forum de L'excellence - Complete Startup
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

echo.
echo Starting both backend and frontend servers...
echo.

REM Get the parent directory
set PARENT_DIR=%~dp0

echo.
echo ========================================
echo  STEP 1: Starting Backend Server (Port 5001)
echo ========================================
echo.

start "Backend Server - Port 5001" cmd /k "cd %PARENT_DIR%backend && call start-backend.bat"

echo Backend server started in a new window...
echo Waiting 5 seconds before starting frontend...
timeout /t 5 /nobreak

echo.
echo ========================================
echo  STEP 2: Starting Frontend Server (Port 5173)
echo ========================================
echo.

start "Frontend Server - Port 5173" cmd /k "cd %PARENT_DIR%app && call start-frontend.bat"

echo.
echo ========================================
echo  Servers Started!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5001
echo.
echo Login credentials:
echo  Email: khaliloullah6666@gmail.com
echo  Password: RBFMD5FABJJ
echo.
echo Press any key to exit this window...
pause >nul
