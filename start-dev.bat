@echo off
title FieldSmartPro Dev Servers
echo Starting FieldSmartPro Development Servers...
echo.

REM Start backend API in a new window
start "Backend API (Port 4000)" cmd /k "cd apps\api && npm run dev"

REM Wait 5 seconds for backend to start
timeout /t 5 /nobreak

REM Start frontend in a new window
start "Frontend (Port 3007)" cmd /k "cd apps\web && npm run dev"

echo.
echo Both servers started!
echo Backend API: http://localhost:4000
echo Frontend: http://localhost:3007
echo.
echo Press any key to exit (servers will continue running in separate windows)
pause
