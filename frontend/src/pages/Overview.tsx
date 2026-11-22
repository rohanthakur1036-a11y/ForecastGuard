import { useEffect, useState } from 'react'
import { getOverview } from '../services/api'
import { Card, SectionHeader, RiskBadge, Spinner, ErrorBanner, DayRiskPill, StatCell } from '../components/ui'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { AlertTriangle, Activity, Database, CheckCircle2, MapPin, Clock } from 'lucide-react'

function TopCard({ icon, label, value, badge, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number
  badge?: string; sub?: string; color?: string
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-lg bg-white/5 text-cyan-400 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-blue-300/60 text-xs uppercase tracking-wide">{label}</p>
        <p className="text-white font-bold text-xl leading-tight mt-0.5" style={{ color: color }}>
          {value}
        </p>
        {badge && (
          <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: color || '#94a3b8', background: `${color || '#94a3b8'}18` }}>
            {badge}
          </span>
        )}
        {sub && <p className="text-blue-400/40 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function ReviewDriver({ name, value, desc, color }: { name: string; value: number; desc: string; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-blue-200/80 text-sm font-medium">{name}</span>
        <span className="text-white font-bold text-sm">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <p className="text-blue-400/50 text-xs mt-1">{desc}</p>
    </div>
  )
}

const MODEL_COLORS = ['#38bdf8', '#f59e0b', '#a78bfa']

export default function Overview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOverview()
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load overview'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <Spinner size="lg" />
    </div>
  )
  if (error) return <div className="p-6"><ErrorBanner message={error} /></div>

  const { top_cards, review_drivers, day_wise_risk, regions, model_comparison_chart, historical_analogs, alerts_queue, suggested_review, model_status } = data

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Title row */}
      <div>
        <h1 className="text-2xl font-bold text-white">Where could the forecast fail?</h1>
        <p className="text-blue-400/60 text-sm mt-1">Prioritize uncertain forecasts before decisions are made.</p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <TopCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Bust Risk"
          value={`${top_cards.current_bust_risk.value}%`}
          badge="High Risk"
          sub={top_cards.current_bust_risk.subtext}
          color="#ef4444"
        />
        <TopCard
          icon={<Activity className="h-5 w-5" />}
          label="Confidence"
          value={top_cards.prediction_confidence.value}
          sub={top_cards.prediction_confidence.subtext}
          color="#f59e0b"
        />
        <TopCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Model Status"
          value={model_status.loaded ? 'Operational' : 'Error'}
          sub={`core_xgb · Day-5 Lead`}
          color={model_status.loaded ? '#10b981' : '#ef4444'}
        />
        <TopCard
          icon={<Database className="h-5 w-5" />}
          label="Data Readiness"
          value={top_cards.data_readiness.value}
          sub={top_cards.data_readiness.subtext}
          color="#06b6d4"
        />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Map placeholder + region cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Regional outlook */}
          <Card>
            <SectionHeader
              icon={<MapPin className="h-4 w-4" />}
              title="Regional Risk Outlook"
              subtitle="Forecast bust risk for rainfall (Day 3–7) · Illustrative sample data"
            />
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs">
              {[['#ef4444', 'High risk'], ['#f59e0b', 'Moderate risk'], ['#10b981', 'Low risk']].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: color as string }} />
                  <span className="text-blue-300/70">{label}</span>
                </span>
              ))}
            </div>
            {/* Region cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {regions?.map((r: any) => (
                <div key={r.id} className="rounded-lg border p-3 glass-card-hover"
                  style={{ borderColor: `${r.color}30`, background: `${r.color}08` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-200 text-sm font-semibold">{r.name}</span>
                    <RiskBadge level={r.risk_level} />
                  </div>
                  <div className="text-white font-bold text-2xl mb-1">{Math.round(r.bust_probability * 100)}%</div>
                  <p className="text-blue-400/60 text-xs">Bust probability · {r.lead_time}</p>
                  <p className="text-blue-400/50 text-xs mt-1">{r.rainfall_forecast_mm} mm forecast · {r.ensemble_spread_mm} mm spread</p>
                  <div className="mt-2">
                    {r.drivers.slice(0, 2).map((d: string) => (
                      <span key={d} className="inline-block text-xs text-blue-300/60 bg-white/5 rounded px-1.5 py-0.5 mr-1 mb-1">{d}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Day-wise risk row */}
            <div>
              <p className="text-blue-400/60 text-xs mb-2 font-medium">Day-wise Forecast Risk</p>
              <div className="flex gap-2 flex-wrap">
                {day_wise_risk?.map((d: any) => (
                  <DayRiskPill key={d.day} day={d.day} risk={d.risk} probability={d.probability} highlight={d.highlight} />
                ))}
              </div>
            </div>
          </Card>

          {/* Model comparison chart */}
          <Card>
            <SectionHeader
              icon={<Activity className="h-4 w-4" />}
              title="Model Comparison"
              subtitle="Forecast rainfall (area average) · Illustrative"
            />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={model_comparison_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="lead" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" mm" />
                <Tooltip contentStyle={{ background: '#0d1529', border: '1px solid rgba(56,139,253,0.2)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {Object.keys(model_comparison_chart[0] || {}).filter(k => k !== 'lead').map((key, i) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
                    strokeWidth={2} dot={{ fill: MODEL_COLORS[i % MODEL_COLORS.length], r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Why review */}
          <Card>
            <SectionHeader
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Why this forecast needs review"
              subtitle="Key contributors to forecast uncertainty (Illustrative)"
            />
            {review_drivers?.map((d: any) => (
              <ReviewDriver key={d.name} name={d.name} value={d.value} desc={d.desc} color={d.color} />
            ))}
            {/* Suggested review */}
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/8 p-3">
              <p className="text-amber-300 text-sm font-semibold mb-1">Suggested review</p>
              <p className="text-amber-200/70 text-xs">{suggested_review?.action}</p>
              <p className="text-amber-400/60 text-xs mt-1 font-medium">{suggested_review?.type}</p>
            </div>
          </Card>

          {/* Historical analogs */}
          <Card>
            <SectionHeader icon={<Clock className="h-4 w-4" />} title="Similar historical cases"
              subtitle="Past cases with analogous conditions" />
            {historical_analogs?.map((h: any) => (
              <div key={h.date} className="flex items-center gap-3 py-2 border-b border-blue-500/08 last:border-0">
                <div className="flex-1">
                  <p className="text-blue-200 text-sm font-medium">{h.date}</p>
                  <p className="text-blue-400/50 text-xs">{h.region}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded bg-white/5 overflow-hidden">
                    <div className="h-full rounded" style={{
                      width: `${h.prob}%`,
                      background: h.prob > 60 ? '#ef4444' : h.prob > 30 ? '#f59e0b' : '#10b981'
                    }} />
                  </div>
                  <RiskBadge level={h.label === 'Bust' ? 'High' : 'Low'} size="sm" />
                </div>
              </div>
            ))}
          </Card>

          {/* Alert queue */}
          <Card>
            <SectionHeader icon={<AlertTriangle className="h-4 w-4" />} title="Alert review queue"
              subtitle="Regions flagged for human review" />
            <div className="space-y-2">
              {alerts_queue?.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-blue-200 text-sm">{a.region_name?.split(' ').slice(-1)[0] || a.region}</p>
                    <RiskBadge level={a.risk_category?.replace(' Risk', '') || 'High'} size="sm" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                    ${a.status === 'Pending' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' :
                      a.status === 'Reviewing' ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' :
                      'text-green-300 bg-green-500/10 border-green-500/20'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Validation summary */}
          <Card>
            <SectionHeader icon={<CheckCircle2 className="h-4 w-4" />} title="Historical validation"
              subtitle="Evaluate forecast bust detection on past seasons" />
            <p className="text-blue-400/50 text-xs mb-3">Held-out season · core_xgb · Stratified evaluation</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-blue-400/60 text-xs mb-1">ROC-AUC</p>
                <p className="text-cyan-300 font-bold text-lg">0.69</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400/60 text-xs mb-1">PR-AUC</p>
                <p className="text-cyan-300 font-bold text-lg">0.28</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400/60 text-xs mb-1">Brier Skill</p>
                <p className="text-cyan-300 font-bold text-lg">0.08</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
