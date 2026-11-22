import { useEffect, useState } from 'react'
import { getValidation } from '../services/api'
import { Card, SectionHeader, Spinner, ErrorBanner } from '../components/ui'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ShieldCheck, Info } from 'lucide-react'

const METRIC_LABELS: Record<string, string> = {
  roc_auc: 'ROC-AUC',
  pr_auc: 'PR-AUC',
  precision_top20: 'Prec@20%',
  recall_top20: 'Recall@20%',
  brier_skill: 'Brier Skill',
}

const SUBSET_COLORS: Record<string, string> = {
  stratified: '#38bdf8',
  absolute: '#a78bfa',
  heavy: '#f59e0b',
}

export default function Validation() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSubset, setActiveSubset] = useState('stratified')

  useEffect(() => {
    getValidation()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-96"><Spinner size="lg" /></div>
  if (error) return <div className="p-6"><ErrorBanner message={error} /></div>

  const sub = data?.subsets?.[activeSubset]
  const bestModel = sub?.best_model
  const allModels = sub?.models || []
  const subsets = Object.keys(data?.subsets || {})

  // Build radar data for best model comparison across subsets
  const radarMetrics = ['roc_auc', 'pr_auc', 'precision_top20', 'recall_top20', 'brier_skill']
  const radarData = radarMetrics.map(m => {
    const row: Record<string, any> = { metric: METRIC_LABELS[m] }
    subsets.forEach(s => {
      const best = data.subsets[s]?.best_model
      row[s] = best ? best[m as keyof typeof best] : 0
    })
    return row
  })

  // Build bar data for current subset
  const barData = allModels.map((m: any) => ({
    model: m.model.replace('p_', ''),
    'ROC-AUC': m.roc_auc,
    'PR-AUC': m.pr_auc,
    'Brier Skill': m.brier_skill,
  }))

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Model Validation</h1>
          <p className="text-blue-400/60 text-sm">Scientific evaluation on held-out folds (OOF) · 2000–2019 JJAS seasons</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 flex gap-3">
        <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-200/80 text-sm">{data?.disclaimer}</p>
      </div>

      {/* Subset tabs */}
      <div className="flex gap-2">
        {subsets.map(s => (
          <button key={s} onClick={() => setActiveSubset(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
              ${activeSubset === s
                ? 'border-opacity-50 text-white'
                : 'bg-white/4 text-blue-300/60 border-blue-500/10 hover:border-blue-400/20'}`}
            style={activeSubset === s ? {
              background: `${SUBSET_COLORS[s]}20`,
              borderColor: `${SUBSET_COLORS[s]}40`,
              color: SUBSET_COLORS[s]
            } : {}}>
            {s}
          </button>
        ))}
      </div>

      {/* Top metrics for best model */}
      {bestModel && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {radarMetrics.map(m => (
            <Card key={m}>
              <p className="text-blue-400/60 text-xs uppercase tracking-wide mb-2">{METRIC_LABELS[m]}</p>
              <p className="text-cyan-300 font-bold text-2xl">{Number(bestModel[m]).toFixed(3)}</p>
              <p className="text-blue-400/40 text-xs mt-1">core_xgb (best)</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart: all models */}
        <Card>
          <SectionHeader title={`${activeSubset} subset — All models`} subtitle="ROC-AUC, PR-AUC and Brier Skill" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="model" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 1]} />
              <Tooltip contentStyle={{ background: '#0d1529', border: '1px solid rgba(56,139,253,0.2)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="ROC-AUC" fill="#38bdf8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="PR-AUC" fill="#a78bfa" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Brier Skill" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar chart: best model across subsets */}
        <Card>
          <SectionHeader title="Best model across evaluation subsets" subtitle="Radar of core_xgb performance per subset" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              {subsets.map(s => (
                <Radar key={s} name={s} dataKey={s} stroke={SUBSET_COLORS[s]}
                  fill={SUBSET_COLORS[s]} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1529', border: '1px solid rgba(56,139,253,0.2)', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Full table */}
      <Card>
        <SectionHeader title={`Full metrics — ${activeSubset}`} subtitle="All model variants" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-500/10 text-blue-400/60 text-xs uppercase tracking-wide">
                {['Model', 'ROC-AUC', 'PR-AUC', 'Prec@20%', 'Recall@20%', 'Brier Skill'].map(h => (
                  <th key={h} className={`text-${h === 'Model' ? 'left' : 'right'} py-2 px-3`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allModels.map((m: any) => (
                <tr key={m.model} className={`border-b border-blue-500/05 hover:bg-white/3
                  ${m.model === 'p_core_xgb' ? 'bg-cyan-500/5' : ''}`}>
                  <td className="py-2 px-3 text-blue-200 font-medium">
                    {m.model}
                    {m.model === 'p_core_xgb' && <span className="ml-2 text-xs text-cyan-400">★ best</span>}
                    {m.model === 'p_clim' && <span className="ml-2 text-xs text-blue-400/40">baseline</span>}
                  </td>
                  {['roc_auc', 'pr_auc', 'precision_top20', 'recall_top20', 'brier_skill'].map(key => (
                    <td key={key} className="text-right py-2 px-3 font-mono text-xs text-blue-200/80">
                      {Number(m[key]).toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-blue-400/30 text-xs mt-3">
          Source: results_summary_v5_wg_dataset_GEFS_IMD.csv · Research period: {data?.research_period} · Primary lead: D+{data?.research_target_lead}
        </p>
      </Card>
    </div>
  )
}
