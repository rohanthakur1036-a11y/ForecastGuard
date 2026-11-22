"""
ForecastGuard - Feature Schema Definition
Based on the trained research model: forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field

# Core feature names required by best model (core_xgb)
CORE_FEATURE_NAMES = [
    "log_fc_rain",
    "log_ens_mean_rain",
    "lead",
    "log_ens_spread",
    "log_ens_range_max",
    "log_ens_iqr1090",
    "ens_cv",
    "ens_frac_gt10",
    "ens_frac_gt25",
    "log_hres_ens_absdiff",
    "slog_hres_minus_ens",
    "hres_ens_rel"
]

PLUS_FEATURE_NAMES = CORE_FEATURE_NAMES + [
    "ens_skew",
    "ens_gap_ratio",
    "ens_frac_gt5",
    "log_ens_p90"
]

ALL_FEATURE_NAMES = PLUS_FEATURE_NAMES + [
    "log_recent_abs_err"
]

# Detailed metadata for each feature
FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    "log_fc_rain": {
        "display_name": "Log Forecast Rain",
        "raw_name": "Forecast Rainfall",
        "group": "rain_amount",
        "unit": "ln(1 + mm)",
        "raw_unit": "mm/day",
        "description": "Log-transformed forecast precipitation amount (natural log of 1 + forecast in mm).",
        "min": 0.0,
        "max": 7.0,
        "default": 3.4, # ~29 mm/day
        "raw_default": 29.0
    },
    "log_ens_mean_rain": {
        "display_name": "Log Ensemble Mean Rain",
        "raw_name": "Ensemble Mean Rain",
        "group": "rain_amount",
        "unit": "ln(1 + mm)",
        "raw_unit": "mm/day",
        "description": "Log-transformed ensemble mean precipitation across all GEFS members.",
        "min": 0.0,
        "max": 7.0,
        "default": 3.2, # ~23.5 mm/day
        "raw_default": 23.5
    },
    "lead": {
        "display_name": "Forecast Lead Time",
        "raw_name": "Lead Time",
        "group": "rain_amount",
        "unit": "days",
        "raw_unit": "days",
        "description": "Target forecast lead time in days. Model evaluated at Day 5.",
        "min": 3.0,
        "max": 7.0,
        "default": 5.0,
        "raw_default": 5.0
    },
    "log_ens_spread": {
        "display_name": "Log Ensemble Spread",
        "raw_name": "Ensemble Spread (Std Dev)",
        "group": "ens_spread",
        "unit": "ln(1 + mm)",
        "raw_unit": "mm",
        "description": "Standard deviation across ensemble members, log-transformed.",
        "min": 0.0,
        "max": 5.0,
        "default": 2.1, # ~7.2 mm
        "raw_default": 7.2
    },
    "log_ens_range_max": {
        "display_name": "Log Ensemble Range Max",
        "raw_name": "Ensemble Max-Min Range",
        "group": "ens_spread",
        "unit": "ln(1 + mm)",
        "raw_unit": "mm",
        "description": "Max minus min member forecast difference (spread breadth), log-transformed.",
        "min": 0.0,
        "max": 6.0,
        "default": 3.5, # ~32 mm
        "raw_default": 32.0
    },
    "log_ens_iqr1090": {
        "display_name": "Log Ensemble IQR (P10-P90)",
        "raw_name": "Ensemble 10-90th Percentile Range",
        "group": "ens_spread",
        "unit": "ln(1 + mm)",
        "raw_unit": "mm",
        "description": "Inter-quantile range between 10th and 90th percentiles of ensemble members.",
        "min": 0.0,
        "max": 5.5,
        "default": 2.6, # ~12.5 mm
        "raw_default": 12.5
    },
    "ens_cv": {
        "display_name": "Ensemble CV",
        "raw_name": "Coefficient of Variation",
        "group": "ens_spread",
        "unit": "ratio",
        "raw_unit": "ratio",
        "description": "Ensemble coefficient of variation (spread divided by ensemble mean).",
        "min": 0.0,
        "max": 3.0,
        "default": 0.65,
        "raw_default": 0.65
    },
    "ens_frac_gt10": {
        "display_name": "Ensemble Fraction > 10mm",
        "raw_name": "Fraction Members > 10mm",
        "group": "ens_spread",
        "unit": "fraction [0-1]",
        "raw_unit": "fraction [0-1]",
        "description": "Proportion of ensemble members forecasting > 10 mm rainfall.",
        "min": 0.0,
        "max": 1.0,
        "default": 0.70,
        "raw_default": 0.70
    },
    "ens_frac_gt25": {
        "display_name": "Ensemble Fraction > 25mm",
        "raw_name": "Fraction Members > 25mm",
        "group": "ens_spread",
        "unit": "fraction [0-1]",
        "raw_unit": "fraction [0-1]",
        "description": "Proportion of ensemble members forecasting heavy rainfall (> 25 mm).",
        "min": 0.0,
        "max": 1.0,
        "default": 0.45,
        "raw_default": 0.45
    },
    "log_hres_ens_absdiff": {
        "display_name": "Log |HRES - Ensemble Mean|",
        "raw_name": "HRES vs Ensemble Abs Diff",
        "group": "ctrl_vs_mean",
        "unit": "ln(1 + mm)",
        "raw_unit": "mm",
        "description": "Absolute difference between high-resolution control forecast and ensemble mean.",
        "min": 0.0,
        "max": 6.0,
        "default": 2.4, # ~10 mm diff
        "raw_default": 10.0
    },
    "slog_hres_minus_ens": {
        "display_name": "Signed Log (HRES - Ensemble)",
        "raw_name": "Signed Diff HRES - Ensemble",
        "group": "ctrl_vs_mean",
        "unit": "signed ln(1+|mm|)",
        "raw_unit": "mm",
        "description": "Signed log difference: positive if HRES forecasts wetter, negative if drier.",
        "min": -6.0,
        "max": 6.0,
        "default": 1.8,
        "raw_default": 5.0
    },
    "hres_ens_rel": {
        "display_name": "HRES Relative Disagreement",
        "raw_name": "HRES Relative Difference Ratio",
        "group": "ctrl_vs_mean",
        "unit": "ratio",
        "raw_unit": "ratio",
        "description": "Normalized discrepancy ratio (HRES - Ensemble Mean) / (Ensemble Mean + 1).",
        "min": -2.0,
        "max": 4.0,
        "default": 0.35,
        "raw_default": 0.35
    }
}

# Feature groups for user interface categorization
FEATURE_GROUPS = [
    {
        "id": "rain_amount",
        "title": "Rainfall Intensity & Forecast Lead",
        "description": "Forecast precipitation magnitude and lead time parameters.",
        "features": ["log_fc_rain", "log_ens_mean_rain", "lead"]
    },
    {
        "id": "ens_spread",
        "title": "Ensemble Spread & Member Uncertainty",
        "description": "Inter-member variance, range, and heavy rainfall fraction.",
        "features": [
            "log_ens_spread",
            "log_ens_range_max",
            "log_ens_iqr1090",
            "ens_cv",
            "ens_frac_gt10",
            "ens_frac_gt25"
        ]
    },
    {
        "id": "ctrl_vs_mean",
        "title": "Control vs Ensemble Inconsistency",
        "description": "Discrepancy between high-resolution deterministic model and ensemble mean.",
        "features": [
            "log_hres_ens_absdiff",
            "slog_hres_minus_ens",
            "hres_ens_rel"
        ]
    }
]

# Preset test scenarios for realistic testing
TEST_PRESETS = [
    {
        "id": "high_bust_kerala_2018",
        "name": "High Risk: Divergent Run with Elevated Spread",
        "description": "Severe ensemble disagreement, high coefficient of variation, and large HRES deviation typical of bust conditions.",
        "subset": "stratified",
        "region": "WG_South",
        "features": {
            "log_fc_rain": 4.5,
            "log_ens_mean_rain": 3.8,
            "lead": 5.0,
            "log_ens_spread": 3.2,
            "log_ens_range_max": 4.8,
            "log_ens_iqr1090": 3.6,
            "ens_cv": 1.45,
            "ens_frac_gt10": 0.85,
            "ens_frac_gt25": 0.70,
            "log_hres_ens_absdiff": 3.9,
            "slog_hres_minus_ens": 3.5,
            "hres_ens_rel": 1.25
        }
    },
    {
        "id": "low_bust_coherent",
        "name": "Low Risk: Coherent High-Agreement Forecast",
        "description": "Tight ensemble cluster, low spread, small HRES difference indicating high forecast reliability.",
        "subset": "stratified",
        "region": "WG_North",
        "features": {
            "log_fc_rain": 2.2,
            "log_ens_mean_rain": 2.1,
            "lead": 5.0,
            "log_ens_spread": 0.8,
            "log_ens_range_max": 1.5,
            "log_ens_iqr1090": 0.9,
            "ens_cv": 0.30,
            "ens_frac_gt10": 0.35,
            "ens_frac_gt25": 0.05,
            "log_hres_ens_absdiff": 0.5,
            "slog_hres_minus_ens": 0.2,
            "hres_ens_rel": 0.10
        }
    },
    {
        "id": "moderate_bust_central",
        "name": "Moderate Risk: Elevated Spread with Consistent Mean",
        "description": "Moderate spread and member dispersion, but control run remains near ensemble mean.",
        "subset": "stratified",
        "region": "WG_Central",
        "features": {
            "log_fc_rain": 3.4,
            "log_ens_mean_rain": 3.1,
            "lead": 5.0,
            "log_ens_spread": 2.2,
            "log_ens_range_max": 3.4,
            "log_ens_iqr1090": 2.4,
            "ens_cv": 0.75,
            "ens_frac_gt10": 0.65,
            "ens_frac_gt25": 0.35,
            "log_hres_ens_absdiff": 2.0,
            "slog_hres_minus_ens": 1.5,
            "hres_ens_rel": 0.40
        }
    }
]
