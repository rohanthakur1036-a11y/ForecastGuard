"""
ForecastGuard - Predictor Service
Runs real predictions and TreeSHAP explainability on the loaded research model.
"""

import math
import numpy as np
import xgboost as xgb
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging

from app.ml.model_loader import ModelLoader
from app.ml.feature_schema import (
    CORE_FEATURE_NAMES,
    FEATURE_METADATA,
    FEATURE_GROUPS
)

logger = logging.getLogger(__name__)

# Presentation risk thresholds (configurable)
RISK_THRESHOLDS = {
    "low": 0.30,
    "moderate": 0.60
}

def determine_risk_category(prob: float) -> Dict[str, str]:
    """Classify probability into risk category and presentation styling."""
    if prob <= RISK_THRESHOLDS["low"]:
        return {
            "level": "Low",
            "category": "Low Risk",
            "color": "#10b981", # emerald
            "bg_color": "rgba(16, 185, 129, 0.15)",
            "badge_class": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            "summary": "Ensemble spread and cross-model agreement indicate high forecast consistency."
        }
    elif prob <= RISK_THRESHOLDS["moderate"]:
        return {
            "level": "Moderate",
            "category": "Moderate Risk",
            "color": "#f59e0b", # amber
            "bg_color": "rgba(245, 158, 11, 0.15)",
            "badge_class": "text-amber-400 bg-amber-500/10 border-amber-500/30",
            "summary": "Elevated ensemble variability or moderate control run deviation detected."
        }
    else:
        return {
            "level": "High",
            "category": "High Risk",
            "color": "#ef4444", # rose/red
            "bg_color": "rgba(239, 68, 68, 0.15)",
            "badge_class": "text-rose-400 bg-rose-500/10 border-rose-500/30",
            "summary": "Significant ensemble spread, run inconsistency, or severe control divergence suggests high bust likelihood."
        }

class Predictor:
    def __init__(self, loader: Optional[ModelLoader] = None):
        self.loader = loader or ModelLoader.get_instance()

    def predict(
        self,
        features: Dict[str, float],
        subset: str = "stratified",
        region: Optional[str] = "WG_Central"
    ) -> Dict[str, Any]:
        """
        Executes prediction using the loaded research XGBoost model.
        Returns actual predicted probability, risk level, and exact SHAP feature attributions.
        """
        if not self.loader.is_loaded:
            raise RuntimeError(f"ML Model is not loaded: {self.loader.load_error}")

        model = self.loader.get_xgb_model(subset)
        if model is None:
            raise ValueError(f"No XGBoost model found for evaluation subset: {subset}")

        # Ensure all required core features are present with defaults if missing
        feature_vector = []
        clean_inputs = {}
        for feat in CORE_FEATURE_NAMES:
            val = features.get(feat)
            if val is None:
                meta = FEATURE_METADATA.get(feat, {})
                val = float(meta.get("default", 0.0))
            else:
                val = float(val)
            clean_inputs[feat] = val
            feature_vector.append(val)

        # Reshape for model input
        X = np.array([feature_vector], dtype=np.float32)

        # 1. Run actual prediction
        # predict_proba returns array shape (1, 2) where column 1 is probability of bust
        proba_matrix = model.predict_proba(X)
        bust_prob = float(proba_matrix[0][1])
        bust_percent = round(bust_prob * 100, 1)

        # 2. Risk classification
        risk_info = determine_risk_category(bust_prob)

        # 3. Compute TreeSHAP attributions using XGBoost's native booster pred_contribs
        shap_factors = []
        base_margin = None
        try:
            booster = model.get_booster()
            dmatrix = xgb.DMatrix(X, feature_names=CORE_FEATURE_NAMES)
            contribs = booster.predict(dmatrix, pred_contribs=True)[0]
            
            # The last element in contribs is the base margin (bias)
            feature_contribs = contribs[:-1]
            base_margin = float(contribs[-1])

            for feat_name, contrib in zip(CORE_FEATURE_NAMES, feature_contribs):
                c_val = float(contrib)
                meta = FEATURE_METADATA.get(feat_name, {})
                shap_factors.append({
                    "feature": feat_name,
                    "display_name": meta.get("display_name", feat_name),
                    "raw_name": meta.get("raw_name", feat_name),
                    "group": meta.get("group", "general"),
                    "value": clean_inputs[feat_name],
                    "unit": meta.get("unit", ""),
                    "contribution": round(c_val, 4),
                    "impact": "increases_risk" if c_val > 0 else "decreases_risk" if c_val < 0 else "neutral",
                    "abs_contribution": abs(c_val)
                })

            # Sort factors by impact magnitude (largest drivers first)
            shap_factors.sort(key=lambda x: x["abs_contribution"], reverse=True)
        except Exception as e:
            logger.warning(f"Could not compute SHAP pred_contribs: {e}")
            shap_factors = []

        # 4. Generate scientific interpretation
        top_positive = [f["display_name"] for f in shap_factors if f["contribution"] > 0][:2]
        top_negative = [f["display_name"] for f in shap_factors if f["contribution"] < 0][:2]

        interpretation_parts = [
            f"The day-5 forecast for {region or 'Western Ghats'} has an estimated bust probability of {bust_percent}% ({risk_info['category']})."
        ]
        if top_positive:
            interpretation_parts.append(
                f"Elevated risk is primarily driven by: {', '.join(top_positive)}."
            )
        if top_negative:
            interpretation_parts.append(
                f"Mitigating factors stabilizing the forecast include: {', '.join(top_negative)}."
            )

        return {
            "probability": bust_prob,
            "probability_percent": bust_percent,
            "risk_category": risk_info["category"],
            "risk_level": risk_info["level"],
            "risk_color": risk_info["color"],
            "risk_badge": risk_info["badge_class"],
            "risk_summary": risk_info["summary"],
            "interpretation": " ".join(interpretation_parts),
            "subset": subset,
            "region": region,
            "model_type": "core_xgb",
            "model_status": "active_loaded",
            "base_margin": base_margin,
            "features_used": clean_inputs,
            "factors": shap_factors,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
