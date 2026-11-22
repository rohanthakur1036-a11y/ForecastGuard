// Shared TypeScript types for ForecastGuard

export interface PredictionResult {
  probability: number
  probability_percent: number
  risk_category: string
  risk_level: string
  risk_color: string
  risk_summary: string
  interpretation: string
  subset: string
  region: string
  model_type: string
  base_margin: number | null
  features_used: Record<string, number>
  factors: ShapFactor[]
  timestamp: string
  model_status?: string
}

export interface ShapFactor {
  feature: string
  display_name: string
  raw_name: string
  group: string
  value: number
  unit: string
  contribution: number
  impact: 'increases_risk' | 'decreases_risk' | 'neutral'
  abs_contribution: number
}

export interface FeatureMeta {
  display_name: string
  raw_name: string
  group: string
  unit: string
  raw_unit: string
  description: string
  min: number
  max: number
  default: number
}

export interface FeatureGroup {
  id: string
  title: string
  description: string
  features: string[]
}

export interface TestPreset {
  id: string
  name: string
  description: string
  subset: string
  region: string
  features: Record<string, number>
}

export interface HistoricalRecord {
  valid_time: string
  year: number
  region: string
  lead: number
  actual_bust: number
  p_clim: number
  p_fcrain: number
  p_core_logit: number
  p_core_xgb: number
  p_core_blend: number
  p_plus_xgb: number
  risk_category: string
  probability_percent: number
}

export interface ModelMetric {
  subset: string
  model: string
  roc_auc: number
  pr_auc: number
  precision_top20: number
  recall_top20: number
  brier_skill: number
}

export interface Alert {
  id: string
  region: string
  region_name: string
  forecast_date: string
  lead_time: number
  bust_probability: number
  risk_category: string
  key_drivers: string[]
  status: 'Pending' | 'Reviewing' | 'Resolved'
  notes: string
  created_at: string
}

export interface RegionInfo {
  id: string
  name: string
  state_coverage: string
  lat_range: [number, number]
  lon_range: [number, number]
  center: [number, number]
  bounds: [[number, number], [number, number]]
  description: string
}

export type TestHistoryEntry = PredictionResult & {
  id: string
  submitted_at: string
  region_label: string
}

export const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  Moderate: '#f59e0b',
  High: '#ef4444',
  'Low Risk': '#10b981',
  'Moderate Risk': '#f59e0b',
  'High Risk': '#ef4444',
}
