import { useEffect, useState, useCallback } from 'react'
import { getFeatureSchema, runPrediction } from '../services/api'
import {
  Card, SectionHeader, ProbabilityGauge, RiskBadge, Spinner, ErrorBanner, ModelStatusDot
} from '../components/ui'
import { FlaskConical, RotateCcw, Send, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { PredictionResult, FeatureMeta, FeatureGroup, TestPreset, TestHistoryEntry } from '../types'
import { RISK_COLORS } from '../types'

const SUBSETS = ['stratified', 'absolute', 'heavy']
const REGIONS = ['WG_North', 'WG_Central', 'WG_South']
const REGION_LABELS: Record<string, string> = {
  WG_North: 'Western Ghats North',
  WG_Central: 'Western Ghats Central',
  WG_South: 'Western Ghats South',
}

interface SchemaData {
  groups: FeatureGroup[]
  features: Record<string, FeatureMeta>
  presets: TestPreset[]
}

function FeatureInput({
  name, meta, value, onChange
}: {
  name: string; meta: FeatureMeta; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="mb-3">
      <label className="block text-blue-200/80 text-xs font-semibold mb-1">
        {meta.display_name}
        <span className="ml-2 text-blue-400/40 font-normal">[{meta.unit}]</span>
      </label>
      <input
        type="number"
        step="0.01"
        min={meta.min}
        max={meta.max}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-white/5 border border-blue-500/15 rounded-lg px-3 py-2 text-white text-sm
          focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
      />
      <p className="text-blue-400/40 text-xs mt-0.5">{meta.description}</p>
    </div>
  )
}

function ShapBar({ value, maxAbs, name }: { value: number; maxAbs: number; name: string }) {
  const pct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0
  const color = value > 0 ? '#ef4444' : '#10b981'
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-blue-200/70 text-xs w-44 flex-shrink-0 truncate">{name}</span>
      <div className="flex-1 relative h-4 bg-white/5 rounded">
        <div className="absolute top-0 bottom-0 rounded"
          style={{
            width: `${pct}%`,
            background: color,
            left: value >= 0 ? '50%' : `${50 - pct}%`,
            opacity: 0.8
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-blue-400/20" />
      </div>
      <span className="text-xs font-mono w-14 text-right flex-shrink-0"
        style={{ color }}>
        {value >= 0 ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  )
}

export default function TestModel() {
  const [schema, setSchema] = useState<SchemaData | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaError, setSchemaError] = useState('')

  const [values, setValues] = useState<Record<string, number>>({})
  const [subset, setSubset] = useState('stratified')
  const [region, setRegion] = useState('WG_Central')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [predError, setPredError] = useState('')
  const [history, setHistory] = useState<TestHistoryEntry[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getFeatureSchema()
      .then((data: SchemaData) => {
        setSchema(data)
        // Initialize values from defaults
        const defaults: Record<string, number> = {}
        Object.entries(data.features || {}).forEach(([k, v]) => {
          defaults[k] = v.default
        })
        setValues(defaults)
        // Open all groups by default
        const expanded: Record<string, boolean> = {}
        data.groups.forEach((g: FeatureGroup) => { expanded[g.id] = true })
        setExpandedGroups(expanded)
      })
      .catch(e => setSchemaError(e.message || 'Could not load feature schema'))
      .finally(() => setSchemaLoading(false))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setPredError('')
    setResult(null)
    try {
      const r = await runPrediction({ features: values, subset, region })
      setResult(r)
      // Add to history
      const entry: TestHistoryEntry = {
        ...r,
        id: `${Date.now()}`,
        submitted_at: new Date().toLocaleString('en-IN'),
        region_label: REGION_LABELS[region] || region
      }
      setHistory(prev => [entry, ...prev.slice(0, 19)])
    } catch (e: any) {
      setPredError(e.response?.data?.detail || e.message || 'Prediction failed')
    } finally {
      setSubmitting(false)
    }
  }, [values, subset, region])

  const applyPreset = (preset: TestPreset) => {
    setValues(prev => ({ ...prev, ...preset.features }))
    setSubset(preset.subset)
    setRegion(preset.region)
  }

  const resetForm = () => {
    if (!schema) return
    const defaults: Record<string, number> = {}
    Object.entries(schema.features).forEach(([k, v]) => { defaults[k] = v.default })
    setValues(defaults)
    setResult(null)
    setPredError('')
  }

  if (schemaLoading) return <div className="flex justify-center items-center h-96"><Spinner size="lg" /></div>
  if (schemaError) return <div className="p-6"><ErrorBanner message={schemaError} /></div>
  if (!schema) return null

  const riskColor = result ? (RISK_COLORS[result.risk_level] || '#94a3b8') : '#38bdf8'
  const maxAbs = result?.factors?.length ? Math.max(...result.factors.map(f => f.abs_contribution)) : 1

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Test Model</h1>
            <p className="text-blue-400/60 text-sm">Enter meteorological parameters to run the trained ML model</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Input form — 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          {/* Config row */}
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-blue-300/70 text-xs font-semibold block mb-1">Evaluation Subset</label>
                <select value={subset} onChange={e => setSubset(e.target.value)}
                  className="w-full bg-white/5 border border-blue-500/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400/50">
                  {SUBSETS.map(s => <option key={s} value={s} className="bg-[#0d1529]">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-blue-300/70 text-xs font-semibold block mb-1">Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full bg-white/5 border border-blue-500/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400/50">
                  {REGIONS.map(r => <option key={r} value={r} className="bg-[#0d1529]">{REGION_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Presets */}
          <Card>
            <SectionHeader title="Quick Presets" subtitle="Sample input configurations" />
            <div className="space-y-2">
              {schema.presets?.map((p) => (
                <button key={p.id} onClick={() => applyPreset(p)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-white/4 hover:bg-white/8 border border-blue-500/10 hover:border-blue-400/20 transition-all">
                  <p className="text-blue-200 text-sm font-medium">{p.name}</p>
                  <p className="text-blue-400/50 text-xs mt-0.5 line-clamp-1">{p.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Feature inputs */}
          <form onSubmit={handleSubmit}>
            {schema.groups?.map((group: FeatureGroup) => (
              <Card key={group.id} className="mb-3">
                <button type="button" className="flex items-center justify-between w-full mb-2"
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}>
                  <div>
                    <h3 className="text-cyan-300 text-sm font-semibold">{group.title}</h3>
                    <p className="text-blue-400/50 text-xs">{group.description}</p>
                  </div>
                  {expandedGroups[group.id] ? <ChevronUp className="h-4 w-4 text-blue-400/50" /> : <ChevronDown className="h-4 w-4 text-blue-400/50" />}
                </button>
                {expandedGroups[group.id] && group.features.map((featName) => {
                  const meta = schema.features[featName]
                  if (!meta) return null
                  return (
                    <FeatureInput
                      key={featName}
                      name={featName}
                      meta={meta}
                      value={values[featName] ?? meta.default}
                      onChange={(v) => setValues(prev => ({ ...prev, [featName]: v }))}
                    />
                  )
                })}
              </Card>
            ))}

            {/* Submit buttons */}
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                  bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                  text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-blue-500/20">
                {submitting ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Analyzing...' : 'Analyze Forecast Risk'}
              </button>
              <button type="button" onClick={resetForm}
                className="px-4 py-3 rounded-xl bg-white/6 hover:bg-white/10 border border-blue-500/15 text-blue-300 transition-all">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Results — 3 cols */}
        <div className="xl:col-span-3 space-y-4">
          {predError && <ErrorBanner message={predError} />}

          {result ? (
            <>
              {/* Probability display */}
              <Card>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ProbabilityGauge percent={result.probability_percent} color={riskColor} />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-blue-400/60 text-xs uppercase tracking-wide mb-1">Risk Assessment</p>
                      <RiskBadge level={result.risk_level} size="lg" />
                    </div>
                    <div>
                      <p className="text-blue-400/60 text-xs uppercase tracking-wide mb-1">Prediction Result</p>
                      <p className="text-white font-bold text-2xl">{result.probability_percent}%</p>
                      <p className="text-blue-400/50 text-xs">Bust probability (Day-5)</p>
                    </div>
                    <div className="rounded-lg bg-white/4 border border-blue-500/10 p-3">
                      <p className="text-blue-200/80 text-xs">{result.risk_summary}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-500/10">
                  <p className="text-blue-200/70 text-sm leading-relaxed">{result.interpretation}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <ModelStatusDot loaded={result.model_status === 'active_loaded'} />
                  <span className="text-blue-400/40 text-xs">Model: {result.model_type} · Subset: {result.subset}</span>
                </div>
                <p className="text-amber-400/50 text-xs mt-2">
                  ⚠ Presentation thresholds: Low ≤30%, Moderate 31–60%, High &gt;60%. Not scientifically validated cutoffs.
                </p>
              </Card>

              {/* SHAP explanation */}
              <Card>
                <SectionHeader title="Why did the model predict this?"
                  subtitle="TreeSHAP feature attributions — contributions in log-odds space" />
                {result.factors.length > 0 ? (
                  <div>
                    {result.factors.map(f => (
                      <ShapBar key={f.feature} value={f.contribution} maxAbs={maxAbs} name={f.display_name} />
                    ))}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-blue-500/08 text-xs text-blue-400/40">
                      <span>◄ Decreases risk</span>
                      <span>Increases risk ►</span>
                    </div>
                    <p className="text-blue-400/40 text-xs mt-2">
                      Attributions are TreeSHAP contributions from XGBoost pred_contribs (log-odds scale).
                    </p>
                  </div>
                ) : (
                  <p className="text-blue-400/50 text-sm">Feature attribution not available for this prediction.</p>
                )}
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20">
              <FlaskConical className="h-12 w-12 text-blue-400/20 mb-4" />
              <p className="text-blue-400/50 text-sm">Fill in the parameters and click "Analyze Forecast Risk"</p>
              <p className="text-blue-400/30 text-xs mt-2">Predictions are computed by the actual trained ML model</p>
            </Card>
          )}

          {/* Test history */}
          {history.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Test History" subtitle="Session predictions (not persisted)" />
                <button onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-xs text-blue-400/50 hover:text-rose-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />Clear
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map(h => (
                  <div key={h.id} className="flex items-center gap-3 py-2 border-b border-blue-500/08 last:border-0">
                    <div className="flex-1">
                      <p className="text-blue-200 text-sm">{h.submitted_at}</p>
                      <p className="text-blue-400/50 text-xs">{h.region_label} · {h.subset}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{h.probability_percent}%</p>
                      <RiskBadge level={h.risk_level} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
