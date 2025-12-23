@echo off
REM Database Restore Script for iSAR
REM Run this script to restore from a backup file

REM Configuration
set DB_NAME=isar_db
set DB_USER=root
set DB_HOST=localhost
set DB_PORT=3306
set BACKUP_DIR=C:\Users\Lenovo\iSAR\backups

echo ================================================
echo iSAR Database Restore
echo ================================================
echo.

REM Check if backup directory exists
if not exist "%BACKUP_DIR%" (
    echo ERROR: Backup directory does not exist: %BACKUP_DIR%
    pause
    exit /b 1
)

REM List available backups
echo Available backups:
echo ------------------
set count=0
for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\%DB_NAME%_*.sql" 2^>nul') do (
    set /a count+=1
    echo !count!. %%F
)
setlocal enabledelayedexpansion
set count=0
for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\%DB_NAME%_*.sql" 2^>nul') do (
    set /a count+=1
    echo !count!. %%F
)
endlocal

echo.
echo Enter the full backup filename to restore (or drag and drop the file):
set /p BACKUP_FILE=

REM Check if file exists
if not exist "%BACKUP_FILE%" (
    if exist "%BACKUP_DIR%\%BACKUP_FILE%" (
        set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_FILE%
    ) else (
        echo ERROR: Backup file not found: %BACKUP_FILE%
        pause
        exit /b 1
    )
)

echo.
echo WARNING: This will OVERWRITE all data in database '%DB_NAME%'!
echo Backup file: %BACKUP_FILE%
echo.
set /p CONFIRM=Are you sure you want to continue? (yes/no):

if /i not "%CONFIRM%"=="yes" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
echo Restoring database...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %DB_NAME% < "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Database restored successfully!
) else (
    echo.
    echo ERROR: Restore failed! Check if MySQL is running and credentials are correct.
)

echo.
pause
