"""
ForecastGuard - Historical Analogs Route
Handles GET /api/historical
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.data_service import DataService

router = APIRouter(prefix="/api", tags=["Historical Analogs"])

@router.get("/historical")
def get_historical(
    subset: str = Query("stratified", description="stratified, absolute, or heavy"),
    region: Optional[str] = Query(None, description="WG_North, WG_Central, or WG_South"),
    year: Optional[str] = Query(None, description="Year between 2000 and 2019"),
    outcome: Optional[str] = Query(None, description="'bust' (y=1) or 'nobust' (y=0)"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    try:
        service = DataService.get_instance()
        data = service.get_historical_predictions(
            subset=subset,
            region=region,
            year=year,
            outcome=outcome,
            limit=limit,
            offset=offset
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
