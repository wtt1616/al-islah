@echo off
echo ========================================
echo iSAR Database Setup for MySQL Server
echo ========================================
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: MySQL not found in PATH!
    echo.
    echo Please either:
    echo 1. Install MySQL Server from: https://dev.mysql.com/downloads/installer/
    echo 2. Add MySQL bin directory to your PATH
    echo 3. Use setup-xampp.bat if you have XAMPP installed
    echo.
    pause
    exit /b 1
)

echo Found MySQL installation
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
echo Please enter your MySQL root password when prompted.
echo.

REM Execute schema.sql
mysql -u root -p < "%~dp0database\schema.sql"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database setup failed!
    echo.
    echo Common issues:
    echo - Incorrect password
    echo - MySQL server not running
    echo - Permissions issue
    echo.
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
echo IMPORTANT: Update your .env file with MySQL password!
echo Edit: C:\Users\Lenovo\iSAR\.env
echo Set: DB_PASSWORD=your_mysql_password
echo.
echo Next steps:
echo 1. Update .env file with your MySQL password
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo 4. Login with: admin@isar.com / admin123
echo.
pause
