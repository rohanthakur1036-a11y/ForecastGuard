import { useEffect, useState } from 'react'
import { getAlerts, updateAlertStatus } from '../services/api'
import { Card, SectionHeader, RiskBadge, Spinner, ErrorBanner } from '../components/ui'
import { Bell, CheckCircle2, Eye, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import type { Alert } from '../types'
import { RISK_COLORS } from '../types'

const STATUS_OPTIONS = ['Pending', 'Reviewing', 'Resolved']

const STATUS_STYLES: Record<string, string> = {
  Pending: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Reviewing: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  Resolved: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'Resolved') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (status === 'Reviewing') return <Eye className="h-4 w-4 text-cyan-400" />
  return <Clock className="h-4 w-4 text-amber-400" />
}

export default function AlertReview() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getAlerts(statusFilter || undefined)
      .then((d: any) => setAlerts(d.alerts || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    setUpdating(alertId)
    try {
      await updateAlertStatus(alertId, newStatus)
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus as any } : a))
    } catch (e: any) {
      alert('Failed to update: ' + e.message)
    } finally {
      setUpdating(null)
    }
  }

  const summary = {
    total: alerts.length,
    pending: alerts.filter(a => a.status === 'Pending').length,
    reviewing: alerts.filter(a => a.status === 'Reviewing').length,
    resolved: alerts.filter(a => a.status === 'Resolved').length,
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Alert Review</h1>
          <p className="text-blue-400/60 text-sm">Manage forecast bust risk alerts for the Western Ghats</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: summary.total, color: '#38bdf8' },
          { label: 'Pending', value: summary.pending, color: '#f59e0b' },
          { label: 'Reviewing', value: summary.reviewing, color: '#06b6d4' },
          { label: 'Resolved', value: summary.resolved, color: '#10b981' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center">
            <p className="text-blue-400/60 text-xs uppercase tracking-wide">{label}</p>
            <p className="text-white font-bold text-3xl mt-1" style={{ color }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Filter + refresh */}
      <div className="flex gap-2 items-center">
        <span className="text-blue-400/60 text-sm">Status:</span>
        {['', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
              ${statusFilter === s
                ? 'bg-blue-500/15 text-cyan-300 border-cyan-400/25'
                : 'bg-white/4 text-blue-300/60 border-blue-500/10 hover:border-blue-400/20'}`}>
            {s || 'All'}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-blue-400/50 hover:text-blue-300 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> :
       error ? <ErrorBanner message={error} /> : (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <Card className="flex flex-col items-center py-16">
              <Bell className="h-12 w-12 text-blue-400/20 mb-3" />
              <p className="text-blue-400/50">No alerts matching filter</p>
            </Card>
          ) : (
            alerts.map(alert => (
              <Card key={alert.id} className="transition-all">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}>
                  <StatusIcon status={alert.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{alert.region_name}</span>
                      <RiskBadge level={alert.risk_category?.replace(' Risk', '') || 'High'} size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-blue-400/60">
                      <span>Forecast: {alert.forecast_date}</span>
                      <span>Lead: D+{alert.lead_time}</span>
                      <span className="font-bold" style={{ color: alert.bust_probability > 0.6 ? '#ef4444' : alert.bust_probability > 0.3 ? '#f59e0b' : '#10b981' }}>
                        {Math.round(alert.bust_probability * 100)}% bust risk
                      </span>
                    </div>
                  </div>

                  {/* Status badge + controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[alert.status]}`}>
                      {alert.status}
                    </span>
                    <select
                      value={alert.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => handleStatusChange(alert.id, e.target.value)}
                      disabled={updating === alert.id}
                      className="bg-white/5 border border-blue-500/15 rounded-lg px-2 py-1 text-xs text-blue-200 focus:outline-none focus:border-cyan-400/40 disabled:opacity-50">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#0d1529]">{s}</option>)}
                    </select>
                    {updating === alert.id && <Spinner size="sm" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === alert.id && (
                  <div className="mt-3 pt-3 border-t border-blue-500/08 space-y-2">
                    <div>
                      <p className="text-blue-400/60 text-xs font-semibold uppercase tracking-wide mb-1">Key Risk Drivers</p>
                      <div className="flex flex-wrap gap-1">
                        {alert.key_drivers.map((d, i) => (
                          <span key={i} className="text-xs text-cyan-300/70 bg-cyan-500/10 rounded px-2 py-0.5 border border-cyan-500/15">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-blue-400/60 text-xs font-semibold uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-blue-200/70 text-sm">{alert.notes}</p>
                    </div>
                    <p className="text-blue-400/30 text-xs">Alert ID: {alert.id} · Created: {new Date(alert.created_at).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
