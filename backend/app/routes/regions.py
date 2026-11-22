"""
ForecastGuard - Regions Route
Handles GET /api/regions and regional statistics
"""

from fastapi import APIRouter
from app.services.data_service import REGIONS_INFO, DataService

router = APIRouter(prefix="/api", tags=["Regions"])

@router.get("/regions")
def get_regions():
    """Returns geographical coordinates, bounds, and climatology thresholds for Western Ghats zones."""
    return {
        "regions": list(REGIONS_INFO.values()),
        "domain": {
            "name": "Western Ghats, India",
            "lat_bounds": [8.0, 21.0],
            "lon_bounds": [72.5, 77.5],
            "monsoon_season": "JJAS (June, July, August, September)",
            "primary_lead": 5
        }
    }
