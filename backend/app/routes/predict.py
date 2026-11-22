"""
ForecastGuard - Prediction Route
Handles POST /api/predict and GET /api/model-info / GET /api/feature-schema
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import logging

from app.ml.predictor import Predictor
from app.ml.model_loader import ModelLoader
from app.ml.feature_schema import (
    CORE_FEATURE_NAMES,
    FEATURE_METADATA,
    FEATURE_GROUPS,
    TEST_PRESETS
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Prediction"])

class PredictRequest(BaseModel):
    features: Dict[str, float] = Field(
        ...,
        description="Dictionary of input feature names and numeric values. Must match model schema."
    )
    subset: Optional[str] = Field("stratified", description="Evaluation subset: 'stratified', 'absolute', or 'heavy'")
    region: Optional[str] = Field("WG_Central", description="Western Ghats region: WG_North, WG_Central, or WG_South")

@router.get("/model-info")
def get_model_info():
    """Returns the loaded model status, metadata, and supported feature schemas."""
    loader = ModelLoader.get_instance()
    meta = loader.get_metadata()
    return {
        **meta,
        "feature_schema": FEATURE_METADATA,
        "feature_groups": FEATURE_GROUPS,
        "test_presets": TEST_PRESETS,
        "core_features": CORE_FEATURE_NAMES
    }

@router.get("/feature-schema")
def get_feature_schema():
    """Returns detailed descriptions, units, and ranges for all model features."""
    return {
        "groups": FEATURE_GROUPS,
        "features": FEATURE_METADATA,
        "presets": TEST_PRESETS
    }

@router.post("/predict")
def run_prediction(req: PredictRequest):
    """
    Accepts model-supported meteorological features and returns actual ML predicted bust probability
    along with TreeSHAP feature attributions.
    """
    try:
        predictor = Predictor()
        result = predictor.predict(
            features=req.features,
            subset=req.subset or "stratified",
            region=req.region or "WG_Central"
        )
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
