@echo off
echo =========================================
echo   FieldSmartPro - Start All Services
echo =========================================
echo.

echo [1/3] Starting Docker PostgreSQL...
docker start fieldsmartpro-db >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker container not found, creating new one...
    docker run --name fieldsmartpro-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
    timeout /t 10 /nobreak >nul
    echo Database ready!
) else (
    echo Database started!
)

echo.
echo [2/3] Starting API Server (port 3001)...
start "FieldSmartPro API" cmd /k "cd apps\api && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Web App (port 3000)...
start "FieldSmartPro Web" cmd /k "cd apps\web && npm run dev"

echo.
echo =========================================
echo   All Services Starting!
echo =========================================
echo.
echo   API:       http://localhost:3001
echo   Web App:   http://localhost:3000
echo   Prisma:    Run 'npm run studio' in apps/api
echo.
echo   Press Ctrl+C in each window to stop
echo =========================================
echo.
pause
