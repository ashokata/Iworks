@echo off
echo =====================================
echo   FieldSmartPro - Local Development
echo =====================================
echo.

echo Checking PostgreSQL...
psql -U postgres -c "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL is not running!
    echo.
    echo Please start PostgreSQL first:
    echo - Windows: Services -^> postgresql-x64-15
    echo - Or install Docker and run: docker run --name fieldsmartpro-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
    echo.
    pause
    exit /b 1
)
echo [OK] PostgreSQL is running

echo.
echo Checking database...
psql -U postgres -lqt | findstr fieldsmartpro >nul 2>&1
if %errorlevel% neq 0 (
    echo Creating database 'fieldsmartpro'...
    psql -U postgres -c "CREATE DATABASE fieldsmartpro;"
    echo [OK] Database created
) else (
    echo [OK] Database exists
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Setting up API...
cd apps\api
call npm install
call npm run generate

echo.
echo Running migrations...
call npm run migrate

echo.
echo =====================================
echo   Starting servers...
echo =====================================
echo.
echo API Server: http://localhost:3001
echo Web App: http://localhost:3000
echo.

cd ..\..
call npm run dev
