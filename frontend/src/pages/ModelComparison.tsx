import { useEffect, useState } from 'react'
import { getModelComparison } from '../services/api'
import { Card, SectionHeader, Spinner, ErrorBanner } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { GitCompare } from 'lucide-react'
import type { ModelMetric } from '../types'

const SUBSETS = ['stratified', 'absolute', 'heavy']
const METRICS = [
  { key: 'roc_auc', label: 'ROC-AUC', desc: 'Discriminative ability (1=perfect, 0.5=random)' },
  { key: 'pr_auc', label: 'PR-AUC', desc: 'Precision-recall tradeoff (imbalanced classes)' },
  { key: 'precision_top20', label: 'Prec@top20%', desc: 'Precision among top-20% predicted busts' },
  { key: 'recall_top20', label: 'Recall@top20%', desc: 'Fraction of actual busts captured at top-20% threshold' },
  { key: 'brier_skill', label: 'Brier Skill', desc: 'Probabilistic calibration vs climatology baseline (>0 = skill)' },
]

const MODEL_DISPLAY: Record<string, string> = {
  p_clim: 'Climatology',
  p_fcrain: 'Fc.Rain Only',
  p_core_logit: 'Core Logit',
  p_core_xgb: 'Core XGB ★',
  p_core_blend: 'Core Blend',
  p_plus_logit: 'Plus Logit',
  p_plus_xgb: 'Plus XGB',
  p_plus_blend: 'Plus Blend',
  p_full_logit: 'Full Logit',
}

const BAR_COLORS = ['#38bdf8','#06b6d4','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#a3e635','#fb923c']

export default function ModelComparison() {
  const [data, setData] = useState<ModelMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subset, setSubset] = useState('stratified')
  const [activeMetric, setActiveMetric] = useState('roc_auc')

  const loadData = (s: string) => {
    setLoading(true)
    getModelComparison(s)
      .then((d: any) => setData(d.models || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData(subset) }, [subset])

  // Format data for the bar chart
  const chartData = data.length ? [{
    name: activeMetric,
    ...Object.fromEntries(data.map(m => [MODEL_DISPLAY[m.model] || m.model, m[activeMetric as keyof ModelMetric]]))
  }] : []

  const metaActive = METRICS.find(m => m.key === activeMetric)

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <GitCompare className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Model Comparison</h1>
          <p className="text-blue-400/60 text-sm">Evaluation metrics from results_summary_v5_wg_dataset_GEFS_IMD.csv</p>
        </div>
      </div>

      {/* Subset filter */}
      <div className="flex gap-2">
        {SUBSETS.map(s => (
          <button key={s} onClick={() => setSubset(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border
              ${subset === s
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30'
                : 'bg-white/4 text-blue-300/60 border-blue-500/10 hover:border-blue-400/20'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> :
       error ? <ErrorBanner message={error} /> : (
        <>
          {/* Metric selector + chart */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Metric cards */}
            <div className="space-y-2">
              {METRICS.map(m => (
                <button key={m.key} onClick={() => setActiveMetric(m.key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all
                    ${activeMetric === m.key
                      ? 'bg-blue-500/15 border-blue-400/30 text-cyan-300'
                      : 'bg-white/3 border-blue-500/10 text-blue-300/70 hover:border-blue-400/20'}`}>
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs opacity-60 mt-0.5 line-clamp-2">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Bar chart */}
            <div className="lg:col-span-3">
              <Card>
                <SectionHeader title={`${metaActive?.label} — ${subset} subset`} subtitle={metaActive?.desc} />
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.map(m => ({
                    model: MODEL_DISPLAY[m.model] || m.model,
                    value: m[activeMetric as keyof ModelMetric] as number,
                    best: m.model === 'p_core_xgb'
                  }))} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="model" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 1]} />
                    <Tooltip
                      formatter={(v: any) => [Number(v).toFixed(4), metaActive?.label]}
                      contentStyle={{ background: '#0d1529', border: '1px solid rgba(56,139,253,0.2)', borderRadius: 8 }}
                    />
                    {activeMetric === 'roc_auc' && (
                      <ReferenceLine y={0.5} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Random (0.5)', fill: '#94a3b8', fontSize: 10 }} />
                    )}
                    <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]}
                      label={{ position: 'top', fill: '#94a3b8', fontSize: 10,
                        formatter: (v: any) => Number(v).toFixed(3) }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>

          {/* Full metrics table */}
          <Card>
            <SectionHeader title="Full Metrics Table" subtitle={`All models · ${subset} evaluation subset`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-500/10">
                    <th className="text-left text-blue-400/60 text-xs font-semibold py-2 px-3">Model</th>
                    {METRICS.map(m => (
                      <th key={m.key} className={`text-right text-xs font-semibold py-2 px-3
                        ${activeMetric === m.key ? 'text-cyan-300' : 'text-blue-400/60'}`}>
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.model} className={`border-b border-blue-500/05 hover:bg-white/3 transition-colors
                      ${row.model === 'p_core_xgb' ? 'bg-cyan-500/5' : ''}`}>
                      <td className="py-2 px-3 text-blue-200 font-medium">
                        {MODEL_DISPLAY[row.model] || row.model}
                        {row.model === 'p_core_xgb' && (
                          <span className="ml-2 text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-full border border-cyan-500/20">best</span>
                        )}
                        {row.model === 'p_clim' && (
                          <span className="ml-2 text-xs text-blue-400/50 bg-blue-500/5 px-1.5 py-0.5 rounded-full border border-blue-500/15">baseline</span>
                        )}
                      </td>
                      {METRICS.map(m => {
                        const val = row[m.key as keyof ModelMetric] as number
                        return (
                          <td key={m.key} className={`text-right py-2 px-3 font-mono text-xs
                            ${activeMetric === m.key ? 'text-cyan-300 font-semibold' : 'text-blue-200/80'}`}>
                            {val.toFixed(4)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-blue-400/30 text-xs mt-3">Source: results_summary_v5_wg_dataset_GEFS_IMD.csv · ★ = selected best model (core_xgb)</p>
          </Card>
        </>
      )}
    </div>
  )
}
