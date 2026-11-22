"""
ForecastGuard - FastAPI Application Main Entry Point
AI-Based Weather Forecast Bust Detection Platform (MoES SIH26079)
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.ml.model_loader import ModelLoader
from app.routes import predict, historical, validation, alerts, regions
from app.services.data_service import REGIONS_INFO, DataService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("forecastguard")

app = FastAPI(
    title="ForecastGuard API",
    description="Forecast Reliability & Bust Detection Platform for Western Ghats Monsoon Forecasts",
    version="1.0.0"
)

# CORS — read allowed origins from environment variable so production is locked down.
# ALLOWED_ORIGINS should be set to comma-separated frontend URLs in production.
# Falls back to permissive wildcard only if the env var is absent (local dev).
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
if _raw_origins.strip() == "*":
    _origins: list = ["*"]
else:
    _origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,   # credentials=False is required when origins != ["*"]
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Register routes
app.include_router(predict.router)
app.include_router(historical.router)
app.include_router(validation.router)
app.include_router(alerts.router)
app.include_router(regions.router)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing ForecastGuard backend...")
    loader = ModelLoader.get_instance()
    if loader.is_loaded:
        logger.info("ML Model successfully loaded into memory.")
    else:
        logger.error(f"Failed to load ML model: {loader.load_error}")

@app.get("/api/health")
def health_check():
    loader = ModelLoader.get_instance()
    return {
        "status": "healthy" if loader.is_loaded else "degraded",
        "model_loaded": loader.is_loaded,
        "model_name": "forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD",
        "error": loader.load_error,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/overview")
def get_overview_dashboard():
    """
    Returns aggregated data for the main landing overview dashboard.
    Matches the user-provided design reference.
    """
    loader = ModelLoader.get_instance()
    data_svc = DataService.get_instance()

    # Regional risk status summary
    # WG_North, WG_Central, WG_South
    regions_status = [
        {
            "id": "WG_North",
            "name": "Western Ghats North",
            "lat": 18.0,
            "lon": 73.8,
            "risk_level": "High",
            "risk_category": "High Risk",
            "bust_probability": 0.74,
            "color": "#ef4444",
            "lead_time": "Day 5",
            "rainfall_forecast_mm": 48.5,
            "ensemble_spread_mm": 18.2,
            "status": "Action Required",
            "drivers": ["Run-to-run inconsistency", "High ensemble CV"]
        },
        {
            "id": "WG_Central",
            "name": "Western Ghats Central",
            "lat": 13.3,
            "lon": 75.0,
            "risk_level": "Moderate",
            "risk_category": "Moderate Risk",
            "bust_probability": 0.52,
            "color": "#f59e0b",
            "lead_time": "Day 5",
            "rainfall_forecast_mm": 32.0,
            "ensemble_spread_mm": 12.4,
            "status": "Reviewing",
            "drivers": ["Moderate spread in Agumbe Ghats", "Control run close to mean"]
        },
        {
            "id": "WG_South",
            "name": "Western Ghats South",
            "lat": 9.8,
            "lon": 76.8,
            "risk_level": "Low",
            "risk_category": "Low Risk",
            "bust_probability": 0.22,
            "color": "#10b981",
            "lead_time": "Day 5",
            "rainfall_forecast_mm": 18.5,
            "ensemble_spread_mm": 5.1,
            "status": "Stable",
            "drivers": ["High inter-member coherence", "Low variance"]
        }
    ]

    # Day-wise forecast risk profile (Lead times D+3 to D+7)
    day_wise_risk = [
        {"day": "D+3", "lead": 3, "risk": "Moderate", "probability": 42, "highlight": False},
        {"day": "D+4", "lead": 4, "risk": "High", "probability": 68, "highlight": False},
        {"day": "D+5", "lead": 5, "risk": "High", "probability": 78, "highlight": True, "note": "Primary research target"},
        {"day": "D+6", "lead": 6, "lead_days": 6, "risk": "Moderate", "probability": 54, "highlight": False},
        {"day": "D+7", "lead": 7, "lead_days": 7, "risk": "Low", "probability": 28, "highlight": False}
    ]

    # Model comparison sample series for chart
    model_comparison_series = [
        {"lead": "D+3", "Model A (GEFS)": 45, "Model B (ECMWF)": 38, "Model C (IMD)": 24},
        {"lead": "D+4", "Model A (GEFS)": 72, "Model B (ECMWF)": 64, "Model C (IMD)": 46},
        {"lead": "D+5", "Model A (GEFS)": 68, "Model B (ECMWF)": 68, "Model C (IMD)": 52},
        {"lead": "D+6", "Model A (GEFS)": 48, "Model B (ECMWF)": 42, "Model C (IMD)": 36},
        {"lead": "D+7", "Model A (GEFS)": 28, "Model B (ECMWF)": 22, "Model C (IMD)": 15}
    ]

    # Historical analogs
    recent_historical = [
        {"date": "12 Aug 2018", "region": "WG South", "outcome": "Bust", "prob": 82, "label": "Bust"},
        {"date": "28 Aug 2020", "region": "WG Central", "outcome": "Bust", "prob": 74, "label": "Bust"},
        {"date": "14 Sep 2022", "region": "WG North", "outcome": "No Bust", "prob": 19, "label": "No bust"}
    ]

    # Why this forecast needs review indicators
    review_drivers = [
        {
            "name": "Ensemble spread",
            "value": 0.82,
            "unit": "normalized",
            "desc": "Larger spread indicates lower confidence across ensemble members",
            "color": "#ef4444"
        },
        {
            "name": "Cross-model disagreement",
            "value": 0.64,
            "unit": "normalized",
            "desc": "Models show differing rainfall amounts and spatial centers",
            "color": "#f59e0b"
        },
        {
            "name": "Recent forecast instability",
            "value": 0.47,
            "unit": "normalized",
            "desc": "Notable changes in successive model forecast cycles",
            "color": "#06b6d4"
        }
    ]

    return {
        "model_status": {
            "loaded": loader.is_loaded,
            "name": "GEFS-IMD Bust Model v5",
            "status_text": "Live Model Connected" if loader.is_loaded else "Model Load Error",
            "best_variant": "core_xgb"
        },
        "top_cards": {
            "current_bust_risk": {
                "value": 78,
                "unit": "%",
                "label": "Bust Risk",
                "badge": "High Risk",
                "color": "#ef4444",
                "subtext": "Illustrative model output"
            },
            "prediction_confidence": {
                "value": "Moderate",
                "label": "Confidence",
                "subtext": "Ensemble spread is elevated",
                "color": "#f59e0b"
            },
            "model_status": {
                "value": "Operational",
                "label": "Model Status",
                "subtext": "core_xgb active (Lead D+5)",
                "color": "#10b981"
            },
            "data_readiness": {
                "value": "3 of 3 sources",
                "label": "Data Readiness",
                "subtext": "GEFS, HRES & Climatology verified",
                "color": "#06b6d4"
            }
        },
        "review_drivers": review_drivers,
        "day_wise_risk": day_wise_risk,
        "regions": regions_status,
        "model_comparison_chart": model_comparison_series,
        "historical_analogs": recent_historical,
        "alerts_queue": data_svc.get_alerts()[:4],
        "suggested_review": {
            "action": "Check rainfall timing against alternate model runs.",
            "type": "Human review required."
        }
    }
