import { useEffect, useState, useCallback } from 'react'
import { getHistorical } from '../services/api'
import { Card, SectionHeader, RiskBadge, Spinner, ErrorBanner } from '../components/ui'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { History, Filter } from 'lucide-react'
import type { HistoricalRecord } from '../types'

const SUBSETS = ['stratified', 'absolute', 'heavy']
const REGIONS = ['', 'WG_North', 'WG_Central', 'WG_South']
const REGION_LABELS: Record<string, string> = {
  '': 'All Regions',
  WG_North: 'WG North',
  WG_Central: 'WG Central',
  WG_South: 'WG South',
}
const YEARS = ['', ...Array.from({ length: 20 }, (_, i) => String(2000 + i))]
const OUTCOMES = ['', 'bust', 'nobust']

export default function HistoricalAnalogs() {
  const [data, setData] = useState<{ records: HistoricalRecord[]; total_records: number; bust_rate: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [subset, setSubset] = useState('stratified')
  const [region, setRegion] = useState('')
  const [year, setYear] = useState('')
  const [outcome, setOutcome] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(() => {
    setLoading(true)
    getHistorical({
      subset,
      region: region || undefined,
      year: year || undefined,
      outcome: outcome || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [subset, region, year, outcome, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [subset, region, year, outcome])

  // Build a trend chart from first 200 records sorted ascending
  const trendData = (data?.records || [])
    .slice(0, 100)
    .reverse()
    .map(r => ({
      date: r.valid_time.slice(0, 7),
      xgb: r.probability_percent,
      actual: r.actual_bust * 100
    }))

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Historical Analogs</h1>
          <p className="text-blue-400/60 text-sm">Out-of-fold predictions from GEFS/ERA5 research dataset (2000–2019)</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          {/* Subset */}
          <div className="flex gap-1">
            {SUBSETS.map(s => (
              <button key={s} onClick={() => setSubset(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                  ${subset === s ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/25' : 'text-blue-300/60 border-blue-500/10 hover:border-blue-400/20'}`}>
                {s}
              </button>
            ))}
          </div>
          {/* Region */}
          <select value={region} onChange={e => setRegion(e.target.value)}
            className="bg-white/5 border border-blue-500/15 rounded-lg px-3 py-1.5 text-sm text-blue-200 focus:outline-none focus:border-cyan-400/40">
            {REGIONS.map(r => <option key={r} value={r} className="bg-[#0d1529]">{REGION_LABELS[r]}</option>)}
          </select>
          {/* Year */}
          <select value={year} onChange={e => setYear(e.target.value)}
            className="bg-white/5 border border-blue-500/15 rounded-lg px-3 py-1.5 text-sm text-blue-200 focus:outline-none focus:border-cyan-400/40">
            <option value="" className="bg-[#0d1529]">All Years</option>
            {YEARS.slice(1).map(y => <option key={y} value={y} className="bg-[#0d1529]">{y}</option>)}
          </select>
          {/* Outcome */}
          <select value={outcome} onChange={e => setOutcome(e.target.value)}
            className="bg-white/5 border border-blue-500/15 rounded-lg px-3 py-1.5 text-sm text-blue-200 focus:outline-none focus:border-cyan-400/40">
            <option value="" className="bg-[#0d1529]">All Outcomes</option>
            <option value="bust" className="bg-[#0d1529]">Bust (y=1)</option>
            <option value="nobust" className="bg-[#0d1529]">No Bust (y=0)</option>
          </select>
          {data && (
            <span className="ml-auto text-blue-400/50 text-xs">
              {data.total_records} records · Bust rate: {(data.bust_rate * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </Card>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> :
       error ? <ErrorBanner message={error} /> : (
        <>
          {/* Trend chart */}
          {trendData.length > 1 && (
            <Card>
              <SectionHeader title="Predicted Probability Trend" subtitle="p_core_xgb vs actual bust label (last 100 records displayed)" />
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={Math.ceil(trendData.length / 8)} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ background: '#0d1529', border: '1px solid rgba(56,139,253,0.2)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="xgb" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="p_core_xgb %" />
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Actual Bust (×100)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Table */}
          <Card>
            <SectionHeader title={`Historical Records (${data?.total_records || 0} total)`}
              subtitle="OOF predictions from GEFS training data · p_core_xgb is the XGBoost model probability" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-blue-500/10 text-blue-400/60 font-semibold uppercase tracking-wide">
                    {['Date', 'Region', 'Lead', 'Actual', 'p_core_xgb', 'p_fcrain', 'p_core_blend', 'Risk'].map(h => (
                      <th key={h} className="text-left py-2 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.records || []).map((r, i) => (
                    <tr key={`${r.valid_time}-${r.region}-${i}`}
                      className="border-b border-blue-500/05 hover:bg-white/3 transition-colors">
                      <td className="py-1.5 px-2 text-blue-200 font-mono">{r.valid_time}</td>
                      <td className="py-1.5 px-2 text-blue-300/80">{r.region}</td>
                      <td className="py-1.5 px-2 text-blue-400/70">D+{r.lead}</td>
                      <td className="py-1.5 px-2">
                        <span className={`font-bold ${r.actual_bust ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {r.actual_bust ? 'BUST' : 'OK'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-white font-semibold">{r.probability_percent}%</td>
                      <td className="py-1.5 px-2 text-blue-300/60">{(r.p_fcrain * 100).toFixed(1)}%</td>
                      <td className="py-1.5 px-2 text-blue-300/60">{(r.p_core_blend * 100).toFixed(1)}%</td>
                      <td className="py-1.5 px-2"><RiskBadge level={r.risk_category} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-500/10">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-blue-300 disabled:opacity-30 transition-all">
                ← Prev
              </button>
              <span className="text-blue-400/50 text-xs">
                Page {page + 1} · Showing {data?.records?.length || 0} of {data?.total_records || 0}
              </span>
              <button
                disabled={!data || (page + 1) * PAGE_SIZE >= data.total_records}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-blue-300 disabled:opacity-30 transition-all">
                Next →
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
