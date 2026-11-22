"""
ForecastGuard - Data Service
Loads and serves historical predictions, model comparison benchmarks, and alert queues.
Preserves original CSV data without modification.
"""

import os
import csv
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def _find_artifacts_dir() -> str:
    """Find the artifacts directory regardless of run location."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(this_dir, "..", "..", "artifacts"),           # backend/artifacts/
        os.path.join(this_dir, "..", "..", "..", "artifacts"),      # project-root/artifacts/
        os.path.join(os.getcwd(), "artifacts"),
        os.path.join(os.getcwd(), "..", "artifacts"),
    ]
    for c in candidates:
        norm = os.path.normpath(c)
        if os.path.isdir(norm):
            return norm
    return os.path.normpath(candidates[0])  # fallback even if not found

ARTIFACTS_DIR = _find_artifacts_dir()

# Regional definitions from research joblib model metadata
REGIONS_INFO = {
    "WG_North": {
        "id": "WG_North",
        "name": "Western Ghats North",
        "state_coverage": "Maharashtra, Goa",
        "lat_range": [15.0, 21.0],
        "lon_range": [72.5, 75.5],
        "center": [18.0, 73.8],
        "bounds": [[15.0, 72.5], [21.0, 75.5]],
        "climatology_heavy_threshold_mm": 14.55,
        "description": "Konkan coast and Northern Sahyadri ranges. Subject to intense offshore vortex-driven rainfall bursts."
    },
    "WG_Central": {
        "id": "WG_Central",
        "name": "Western Ghats Central",
        "state_coverage": "Karnataka (Coastal & Malnad)",
        "lat_range": [11.5, 15.0],
        "lon_range": [73.5, 76.5],
        "center": [13.3, 75.0],
        "bounds": [[11.5, 73.5], [15.0, 76.5]],
        "climatology_heavy_threshold_mm": 17.72,
        "description": "Agumbe and central orographic barrier. Exceptional orographic enhancement of low-level monsoon westerlies."
    },
    "WG_South": {
        "id": "WG_South",
        "name": "Western Ghats South",
        "state_coverage": "Kerala, Tamil Nadu border",
        "lat_range": [8.0, 11.5],
        "lon_range": [75.0, 77.5],
        "center": [9.8, 76.8],
        "bounds": [[8.0, 75.0], [11.5, 77.5]],
        "climatology_heavy_threshold_mm": 18.21,
        "description": "Anaimalai and Cardamom Hills. Steep terrain forcing extreme rain episodes such as the August 2018 deluge."
    }
}

class DataService:
    _instance: Optional["DataService"] = None

    def __init__(self, artifacts_dir: Optional[str] = None):
        self.artifacts_dir = artifacts_dir or ARTIFACTS_DIR
        self._alerts_state: List[Dict[str, Any]] = self._init_default_alerts()

    @classmethod
    def get_instance(cls) -> "DataService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_csv_path(self, filename: str) -> str:
        primary = os.path.join(self.artifacts_dir, filename)
        if os.path.exists(primary):
            return primary
        # Fallback path if directory structure varies
        alt = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "artifacts", filename))
        if os.path.exists(alt):
            return alt
        raise FileNotFoundError(f"Artifact CSV not found: {filename}")

    def get_model_comparison(self, subset_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Parses results_summary_v5_wg_dataset_GEFS_IMD.csv.
        Returns evaluation metrics for all model variants.
        """
        path = self._get_csv_path("results_summary_v5_wg_dataset_GEFS_IMD.csv")
        results = []
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            # Row format: [subset, model_name, roc_auc, pr_auc, prec@top20%, recall@top20%, brier_skill]
            for row in reader:
                if not row or len(row) < 7:
                    continue
                subset = row[0].strip()
                model_name = row[1].strip()
                if subset_filter and subset.lower() != subset_filter.lower():
                    continue

                def safe_float(v):
                    try:
                        return round(float(v), 4)
                    except (ValueError, TypeError):
                        return 0.0

                results.append({
                    "subset": subset,
                    "model": model_name,
                    "roc_auc": safe_float(row[2]),
                    "pr_auc": safe_float(row[3]),
                    "precision_top20": safe_float(row[4]),
                    "recall_top20": safe_float(row[5]),
                    "brier_skill": safe_float(row[6])
                })
        return results

    def get_historical_predictions(
        self,
        subset: str = "stratified",
        region: Optional[str] = None,
        year: Optional[str] = None,
        outcome: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Parses OOF predictions from the matching subset CSV.
        """
        filename_map = {
            "stratified": "oof_predictions_stratified_v5_wg_dataset_GEFS_IMD.csv",
            "absolute": "oof_predictions_absolute_v5_wg_dataset_GEFS_IMD.csv",
            "heavy": "oof_predictions_heavy_v5_wg_dataset_GEFS_IMD.csv"
        }
        fname = filename_map.get(subset.lower(), filename_map["stratified"])
        path = self._get_csv_path(fname)

        rows = []
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                # Apply filters
                if region and r["region"] != region:
                    continue
                if year and r["year"] != str(year):
                    continue
                if outcome is not None:
                    if outcome == "bust" and r["y"] != "1":
                        continue
                    if outcome == "nobust" and r["y"] != "0":
                        continue

                # Format record
                p_xgb = float(r.get("p_core_xgb", 0.0))
                rows.append({
                    "valid_time": r["valid_time"],
                    "year": int(r["year"]),
                    "region": r["region"],
                    "lead": int(r["lead"]),
                    "actual_bust": int(r["y"]),
                    "p_clim": round(float(r.get("p_clim", 0.0)), 4),
                    "p_fcrain": round(float(r.get("p_fcrain", 0.0)), 4),
                    "p_core_logit": round(float(r.get("p_core_logit", 0.0)), 4),
                    "p_core_xgb": round(p_xgb, 4),
                    "p_core_blend": round(float(r.get("p_core_blend", 0.0)), 4),
                    "p_plus_xgb": round(float(r.get("p_plus_xgb", 0.0)), 4),
                    "risk_category": "High Risk" if p_xgb > 0.6 else "Moderate Risk" if p_xgb > 0.3 else "Low Risk",
                    "probability_percent": round(p_xgb * 100, 1)
                })

        total_count = len(rows)
        # Sort descending by date
        rows.sort(key=lambda x: x["valid_time"], reverse=True)
        paginated = rows[offset: offset + limit]

        # Calculate quick summary statistics
        bust_count = sum(1 for r in rows if r["actual_bust"] == 1)
        return {
            "total_records": total_count,
            "bust_count": bust_count,
            "no_bust_count": total_count - bust_count,
            "bust_rate": round(bust_count / max(total_count, 1), 4),
            "subset": subset,
            "limit": limit,
            "offset": offset,
            "records": paginated
        }

    def get_validation_summary(self) -> Dict[str, Any]:
        """Provides high-level validation aggregates and ROC/PR metric tables."""
        all_metrics = self.get_model_comparison()
        subsets = ["stratified", "absolute", "heavy"]
        summary = {}

        for sub in subsets:
            sub_metrics = [m for m in all_metrics if m["subset"] == sub]
            # Find best model in this subset (by PR-AUC or ROC-AUC)
            best_model = max(sub_metrics, key=lambda x: x["roc_auc"]) if sub_metrics else None
            baseline_clim = next((m for m in sub_metrics if m["model"] == "p_clim"), None)
            baseline_fcrain = next((m for m in sub_metrics if m["model"] == "p_fcrain"), None)

            summary[sub] = {
                "subset": sub,
                "best_model": best_model,
                "baseline_clim": baseline_clim,
                "baseline_fcrain": baseline_fcrain,
                "models": sub_metrics
            }

        return {
            "subsets": summary,
            "research_target_lead": 5,
            "research_period": "2000-2019 (JJAS Monsoon)",
            "disclaimer": "Historical evaluation metrics are based on the supplied research dataset. Performance on future forecasts may differ."
        }

    def _init_default_alerts(self) -> List[Dict[str, Any]]:
        """Initializes sample alert review queue based on real extreme historical cases."""
        return [
            {
                "id": "ALT-2018-08-08-S",
                "region": "WG_South",
                "region_name": "Western Ghats South (Kerala)",
                "forecast_date": "2018-08-08",
                "lead_time": 5,
                "bust_probability": 0.84,
                "risk_category": "High Risk",
                "key_drivers": ["Extreme ensemble spread (3.9)", "HRES wet surge (+1.4)", "Ensemble CV > 1.3"],
                "status": "Pending",
                "notes": "Large multi-model disagreement during catastrophic monsoon peak. Action required: compare alternate ECMWF/IMD runs.",
                "created_at": "2026-09-17T06:00:00Z"
            },
            {
                "id": "ALT-2019-07-24-N",
                "region": "WG_North",
                "region_name": "Western Ghats North (Konkan)",
                "forecast_date": "2019-07-24",
                "lead_time": 5,
                "bust_probability": 0.72,
                "risk_category": "High Risk",
                "key_drivers": ["Run-to-run inconsistency", "Ensemble fraction > 25mm = 0.65"],
                "status": "Reviewing",
                "notes": "Successive GEFS runs show jump in offshore shearline position. Reviewing member spread.",
                "created_at": "2026-09-17T07:15:00Z"
            },
            {
                "id": "ALT-2016-07-12-C",
                "region": "WG_Central",
                "region_name": "Western Ghats Central (Karnataka)",
                "forecast_date": "2016-07-12",
                "lead_time": 5,
                "bust_probability": 0.52,
                "risk_category": "Moderate Risk",
                "key_drivers": ["Moderate spread in Agumbe Ghats", "Control run close to mean"],
                "status": "Resolved",
                "notes": "Concurred with ensemble mean. Lead forecaster verified synoptic trough stability.",
                "created_at": "2026-09-17T08:30:00Z"
            },
            {
                "id": "ALT-2014-08-20-S",
                "region": "WG_South",
                "region_name": "Western Ghats South",
                "forecast_date": "2014-08-20",
                "lead_time": 5,
                "bust_probability": 0.28,
                "risk_category": "Low Risk",
                "key_drivers": ["Coherent ensemble cluster", "Low standard deviation"],
                "status": "Resolved",
                "notes": "Forecast deemed stable. Verified no bust.",
                "created_at": "2026-09-17T09:00:00Z"
            }
        ]

    def get_alerts(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        if status:
            return [a for a in self._alerts_state if a["status"].lower() == status.lower()]
        return self._alerts_state

    def update_alert_status(self, alert_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for a in self._alerts_state:
            if a["id"] == alert_id:
                a["status"] = new_status
                if notes:
                    a["notes"] = notes
                return a
        return None
