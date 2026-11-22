// Shared UI primitives for ForecastGuard
import { type ReactNode } from 'react'
import { RISK_COLORS } from '../types'

/** Glass-style card container */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-card glass-card-hover p-4 ${className}`}>
      {children}
    </div>
  )
}

/** Section heading with optional icon */
export function SectionHeader({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-cyan-400">{icon}</span>}
      <div>
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        {subtitle && <p className="text-blue-400/50 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

/** Risk badge pill */
export function RiskBadge({ level, size = 'sm' }: { level: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = RISK_COLORS[level] || '#94a3b8'
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1' : size === 'md' ? 'text-xs px-2.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${sizeClass}`}
      style={{ color, borderColor: `${color}40`, background: `${color}15` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {level}
    </span>
  )
}

/** Loading spinner */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <div className={`${dim} border-2 border-blue-500/20 border-t-cyan-400 rounded-full animate-spin`} />
  )
}

/** Error banner */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-rose-300 text-sm">
      <span className="font-semibold">Error: </span>{message}
    </div>
  )
}

/** Metric stat display */
export function StatCell({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div>
      <p className="text-blue-400/60 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white font-bold text-xl" style={{ color: color || undefined }}>{value}</p>
      {sub && <p className="text-blue-400/50 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

/** Circular probability gauge */
export function ProbabilityGauge({ percent, color }: { percent: number; color: string }) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const filled = (percent / 100) * circumference
  const empty = circumference - filled

  return (
    <svg viewBox="0 0 128 128" className="w-40 h-40">
      {/* Background track */}
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      {/* Filled arc */}
      <circle
        cx="64" cy="64" r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${empty}`}
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
      {/* Text */}
      <text x="64" y="58" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
        {percent}%
      </text>
      <text x="64" y="76" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="10" fontFamily="sans-serif">
        Bust Risk
      </text>
    </svg>
  )
}

/** Horizontal bar for SHAP contributions */
export function ContributionBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? Math.abs(value) / maxAbs * 100 : 0
  const color = value > 0 ? '#ef4444' : '#10b981'
  return (
    <div className="flex items-center gap-2 w-full">
      {value < 0 && (
        <div className="flex-1 flex justify-end">
          <div className="h-2 rounded-l" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
        </div>
      )}
      <div className="w-px h-3 bg-blue-400/30 flex-shrink-0" />
      {value >= 0 && (
        <div className="flex-1">
          <div className="h-2 rounded-r" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
        </div>
      )}
    </div>
  )
}

/** Day-5 lead time pills for the overview */
export function DayRiskPill({ day, risk, probability, highlight }: {
  day: string; risk: string; probability: number; highlight?: boolean
}) {
  const color = RISK_COLORS[risk] || '#94a3b8'
  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all
        ${highlight ? 'bg-blue-500/10 border-blue-400/30 ring-1 ring-blue-400/20' : 'bg-white/3 border-blue-500/10'}`}
    >
      <span className="text-blue-300/70 text-xs font-mono font-semibold">{day}</span>
      <span className="text-white font-bold text-sm">{probability}%</span>
      <span className="text-xs" style={{ color }}>{risk}</span>
      {highlight && <span className="text-[9px] text-blue-400/60 font-mono">★ Day-5</span>}
    </div>
  )
}

/** Model status indicator */
export function ModelStatusDot({ loaded }: { loaded: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${loaded ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
      {loaded ? <span className="text-emerald-400">Model loaded</span> : <span className="text-rose-400">Model error</span>}
    </span>
  )
}
