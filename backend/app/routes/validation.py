"""
ForecastGuard - Validation & Model Comparison Routes
Handles GET /api/validation and GET /api/model-comparison
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.data_service import DataService

router = APIRouter(prefix="/api", tags=["Validation & Comparison"])

@router.get("/model-comparison")
def get_model_comparison(subset: Optional[str] = Query(None, description="stratified, absolute, or heavy")):
    try:
        service = DataService.get_instance()
        data = service.get_model_comparison(subset_filter=subset)
        return {"models": data, "subset_filter": subset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validation")
def get_validation():
    try:
        service = DataService.get_instance()
        return service.get_validation_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
