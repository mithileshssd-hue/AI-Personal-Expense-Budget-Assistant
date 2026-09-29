@echo off
title SmartFinance - Local Development Server
cls
echo ================================================================
echo   SmartFinance - Starting Local Development Server & API
echo ================================================================
echo.
echo  Starting Cloudflare D1 Worker API Backend at http://127.0.0.1:8787 ...
start "SmartFinance API Worker" cmd /k "cd /d "%~dp0" && node "node_modules\wrangler\bin\wrangler.js" dev --port 8787"
echo.
echo  Starting Frontend Web Server at http://localhost:5500 ...
echo.
start http://localhost:5500/login.html
python -m http.server 5500
pause
