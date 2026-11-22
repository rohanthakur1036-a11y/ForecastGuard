"""
ForecastGuard - Model Loader
Safely loads the trained joblib artifact WITHOUT modifying or retraining it.
"""

import os
import joblib
import warnings
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

MODEL_FILENAME = "forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib"

def _find_model_path() -> Optional[str]:
    """Search for the model file in several likely locations."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        # backend/artifacts/ (copied)
        os.path.join(this_dir, "..", "..", "artifacts", MODEL_FILENAME),
        # project-root/artifacts/
        os.path.join(this_dir, "..", "..", "..", "artifacts", MODEL_FILENAME),
        # CWD/artifacts/
        os.path.join(os.getcwd(), "artifacts", MODEL_FILENAME),
        # CWD/../artifacts/
        os.path.join(os.getcwd(), "..", "artifacts", MODEL_FILENAME),
    ]
    for path in candidates:
        normalized = os.path.normpath(path)
        if os.path.isfile(normalized):
            return normalized
    return None


class ModelLoader:
    _instance: Optional["ModelLoader"] = None
    _model_dict: Optional[Dict[str, Any]] = None
    _load_error: Optional[str] = None
    _model_path: Optional[str] = None

    def __init__(self):
        self._model_path = _find_model_path()
        self._load_model()

    @classmethod
    def get_instance(cls) -> "ModelLoader":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        if not self._model_path:
            self._load_error = (
                f"Model file '{MODEL_FILENAME}' not found. "
                "Ensure it is placed in the backend/artifacts/ directory."
            )
            logger.error(self._load_error)
            return

        try:
            logger.info(f"Loading model from: {self._model_path}")
            # Suppress XGBoost version-mismatch pickle warning (cosmetic only)
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", UserWarning)
                loaded = joblib.load(self._model_path)

            if not isinstance(loaded, dict):
                raise ValueError(
                    f"Expected dict artifact, got {type(loaded).__name__}. "
                    "Model file may be corrupt or mismatched."
                )

            # Validate required keys
            required_keys = ["models", "features", "regions"]
            missing = [k for k in required_keys if k not in loaded]
            if missing:
                raise ValueError(f"Model artifact missing required keys: {missing}")

            self._model_dict = loaded
            self._load_error = None
            logger.info(
                f"Model loaded OK. Best model: {loaded.get('best', 'unknown')}, "
                f"Subsets: {list(loaded.get('models', {}).keys())}, "
                f"Features: {len(loaded.get('features', []))}"
            )
        except Exception as exc:
            logger.error(f"Failed to load model: {exc}", exc_info=True)
            self._model_dict = None
            self._load_error = str(exc)

    @property
    def is_loaded(self) -> bool:
        return self._model_dict is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    @property
    def model_path(self) -> Optional[str]:
        return self._model_path

    @property
    def model_dict(self) -> Optional[Dict[str, Any]]:
        return self._model_dict

    def get_metadata(self) -> Dict[str, Any]:
        if not self.is_loaded:
            return {
                "status": "error",
                "error": self._load_error,
                "searched_path": self._model_path,
            }
        md = self._model_dict
        return {
            "status": "ready",
            "model_name": MODEL_FILENAME.replace(".joblib", ""),
            "best_model": md.get("best", "core_xgb"),
            "eval_lead": md.get("eval_lead", 5),
            "source": md.get("source", "GEFS"),
            "resolution": md.get("resolution", "240x121"),
            "truth": md.get("truth", "ERA5"),
            "subsets": list(md.get("models", {}).keys()),
            "regions": {
                k: {"lat": v["lat"], "lon": v["lon"]}
                for k, v in md.get("regions", {}).items()
            },
            "core_features": md.get("core_features", []),
            "plus_features": md.get("plus_features", []),
            "all_features": md.get("all_features", []),
            "years_range": [
                min(md.get("years", [2000])),
                max(md.get("years", [2019])),
            ],
            "feature_count": len(md.get("features", [])),
        }

    def get_xgb_model(self, subset: str = "stratified"):
        if not self.is_loaded:
            raise RuntimeError(f"Model not loaded: {self._load_error}")
        subsets = self._model_dict.get("models", {})
        if subset not in subsets:
            subset = "stratified"
        xgb = subsets[subset].get("xgb")
        if xgb is None:
            raise ValueError(f"No XGBoost model in subset '{subset}'")
        return xgb

    def get_rule_thresholds(self, subset: str = "stratified") -> Dict:
        if not self.is_loaded:
            return {}
        subsets = self._model_dict.get("models", {})
        if subset not in subsets:
            subset = "stratified"
        return subsets[subset].get("rule", {})
