@echo off
echo ============================================================
echo   ForecastGuard - Full Stack Launch
echo   SIH26079 - MoES Forecast Bust Detection
echo ============================================================
echo.
echo [1/2] Starting Backend (FastAPI + XGBoost Model) on :8000
echo       Wait 10-15 seconds for model to load...
echo.
start "ForecastGuard Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 12 seconds for backend to initialize...
timeout /t 12 /nobreak >nul

echo.
echo [2/2] Starting Frontend (React + Vite) on :5173
echo.
start "ForecastGuard Frontend" cmd /k "cd /d %~dp0frontend && set PATH=%~dp0nodejs;%PATH% && node node_modules\vite\bin\vite.js"

echo.
echo ============================================================
echo   Both servers are starting in separate windows.
echo   Open: http://localhost:5173
echo ============================================================
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
