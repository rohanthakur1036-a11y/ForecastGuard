@echo off
echo ============================================
echo  ForecastGuard - Backend Startup
echo  FastAPI + ML Model (core_xgb)
echo ============================================
echo.
cd /d "%~dp0backend"
echo Starting FastAPI server on http://localhost:8000 ...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
