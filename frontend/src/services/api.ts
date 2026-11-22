// API service layer for ForecastGuard
// In production, VITE_API_URL points to the deployed backend (e.g. https://forecastguard-api.onrender.com)
// In development, it falls back to '' so Vite's proxy forwards /api → localhost:8000
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 30000,          // 30 s — model loading on cold start can be slow
})

export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}

export async function getOverview() {
  const { data } = await api.get('/overview')
  return data
}

export async function getModelInfo() {
  const { data } = await api.get('/model-info')
  return data
}

export async function getFeatureSchema() {
  const { data } = await api.get('/feature-schema')
  return data
}

export async function runPrediction(payload: {
  features: Record<string, number>
  subset: string
  region: string
}) {
  const { data } = await api.post('/predict', payload)
  return data
}

export async function getHistorical(params: {
  subset?: string
  region?: string
  year?: string
  outcome?: string
  limit?: number
  offset?: number
}) {
  const { data } = await api.get('/historical', { params })
  return data
}

export async function getModelComparison(subset?: string) {
  const { data } = await api.get('/model-comparison', { params: subset ? { subset } : {} })
  return data
}

export async function getValidation() {
  const { data } = await api.get('/validation')
  return data
}

export async function getRegions() {
  const { data } = await api.get('/regions')
  return data
}

export async function getAlerts(status?: string) {
  const { data } = await api.get('/alerts', { params: status ? { status } : {} })
  return data
}

export async function updateAlertStatus(alertId: string, status: string, notes?: string) {
  const { data } = await api.patch(`/alerts/${alertId}`, { status, notes })
  return data
}
