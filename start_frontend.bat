@echo off
echo ============================================
echo  ForecastGuard - Frontend Dev Server
echo  React + Vite (proxied to :8000)
echo ============================================
echo.
cd /d "%~dp0frontend"
set NODE_PATH=%~dp0nodejs
set PATH=%NODE_PATH%;%PATH%
echo Starting Vite dev server on http://localhost:5173 ...
node node_modules\vite\bin\vite.js
