@echo off
echo Exporting iSAR Database...
echo.

set FILENAME=isar_db_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set FILENAME=%FILENAME: =0%

mysqldump -u root isar_db > %FILENAME%

if %errorlevel% equ 0 (
    echo.
    echo Database exported successfully to: %FILENAME%
    echo.
    echo Upload this file to your production server and import it with:
    echo mysql -u isar_user -p isar_db ^< %FILENAME%
) else (
    echo.
    echo Error exporting database!
)

pause
