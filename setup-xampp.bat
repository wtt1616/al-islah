@echo off
echo ========================================
echo iSAR Database Setup for XAMPP
echo ========================================
echo.

REM Check if XAMPP MySQL exists
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ERROR: XAMPP MySQL not found!
    echo Please install XAMPP first from: https://www.apachefriends.org/
    echo.
    pause
    exit /b 1
)

echo Found XAMPP MySQL installation
echo.

REM Check if schema.sql exists
if not exist "%~dp0database\schema.sql" (
    echo ERROR: schema.sql not found!
    echo Expected location: %~dp0database\schema.sql
    echo.
    pause
    exit /b 1
)

echo Creating database and tables...
echo.

REM Execute schema.sql (XAMPP usually has no password by default)
C:\xampp\mysql\bin\mysql.exe -u root < "%~dp0database\schema.sql" 2>error.log

if %errorlevel% neq 0 (
    echo ERROR: Database setup failed!
    echo Check error.log for details
    echo.
    echo If you have set a MySQL password, please use setup-mysql.bat instead
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database: isar_db
echo Tables: 4 (users, prayer_times, availability, schedules)
echo Default users: 6 (Admin, Head Imam, 2 Imams, 2 Bilals)
echo.
echo Next steps:
echo 1. Make sure MySQL is running in XAMPP Control Panel
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo 4. Login with: admin@isar.com / admin123
echo.
pause
