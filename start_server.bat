@echo off
title SmartFinance - Local Web Server
cls
echo ================================================================
echo   SmartFinance - Starting Local Development Server
echo ================================================================
echo.
echo  Google OAuth requires an HTTP web origin (http://localhost:5500)
echo  instead of opening files directly via file://
echo.
echo  Starting server at: http://localhost:5500
echo.
start http://localhost:5500/index.html
python -m http.server 5500
pause
