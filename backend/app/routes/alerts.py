"""
ForecastGuard - Alerts Route
Handles GET /api/alerts and PATCH /api/alerts/{alert_id}
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services.data_service import DataService

router = APIRouter(prefix="/api", tags=["Alerts"])

class UpdateAlertStatusRequest(BaseModel):
    status: str # "Pending", "Reviewing", "Resolved"
    notes: Optional[str] = None

@router.get("/alerts")
def get_alerts(status: Optional[str] = Query(None, description="Pending, Reviewing, or Resolved")):
    service = DataService.get_instance()
    return {"alerts": service.get_alerts(status)}

@router.patch("/alerts/{alert_id}")
def update_alert(alert_id: str, req: UpdateAlertStatusRequest):
    service = DataService.get_instance()
    updated = service.update_alert_status(alert_id, req.status, req.notes)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return {"message": "Status updated successfully", "alert": updated}
