@echo off
cd /d "%~dp0"
echo ===================================
echo   GitHub Sync Tool
echo ===================================
echo.

:: Stage all changes
echo [1/3] Staging all files...
git add .

:: Prompt for commit message
echo.
set /p msg="Enter commit message (or press Enter for 'Auto-update'): "
if "%msg%"=="" set msg=Auto-update

:: Commit changes
echo.
echo [2/3] Committing changes: "%msg%"...
git commit -m "%msg%"

:: Push changes
echo.
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ===================================
echo   Sync Complete!
echo ===================================
pause
