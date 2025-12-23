@echo off
REM Database Backup Script for iSAR
REM Run this script to create a timestamped backup of the database

REM Configuration
set DB_NAME=isar_db
set DB_USER=root
set DB_HOST=localhost
set DB_PORT=3306
set BACKUP_DIR=C:\Users\Lenovo\iSAR\backups

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Generate timestamp for filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"

REM Backup filename
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%TIMESTAMP%.sql

echo ================================================
echo iSAR Database Backup
echo ================================================
echo Database: %DB_NAME%
echo Backup file: %BACKUP_FILE%
echo ================================================

REM Run mysqldump
echo Creating backup...
mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %DB_NAME% --single-transaction --routines --triggers > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Backup created successfully!
    echo File: %BACKUP_FILE%

    REM Show file size
    for %%A in ("%BACKUP_FILE%") do echo Size: %%~zA bytes

    REM Keep only last 10 backups (delete older ones)
    echo.
    echo Cleaning up old backups (keeping last 10)...
    for /f "skip=10 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\%DB_NAME%_*.sql" 2^>nul') do (
        echo Deleting old backup: %%F
        del "%BACKUP_DIR%\%%F"
    )
) else (
    echo.
    echo ERROR: Backup failed! Check if MySQL is running and credentials are correct.
)

echo.
echo ================================================
pause
