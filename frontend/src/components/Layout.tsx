import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, GitCompare, History, ShieldCheck, Bell, FlaskConical,
  Waves, Menu, X, Gauge
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/risk-explorer', label: 'Risk Explorer', icon: Map },
  { path: '/model-comparison', label: 'Model Comparison', icon: GitCompare },
  { path: '/historical', label: 'Historical Analogs', icon: History },
  { path: '/validation', label: 'Validation', icon: ShieldCheck },
  { path: '/alerts', label: 'Alert Review', icon: Bell },
  { path: '/test-model', label: 'Test Model', icon: FlaskConical },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 h-full md:h-screen flex flex-col
          bg-[#0a1020] border-r border-blue-500/10 transition-all duration-300
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-500/10">
          <div className="relative">
            <Waves className="h-8 w-8 text-cyan-400" />
            <Gauge className="h-4 w-4 text-blue-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">ForecastGuard</div>
            <div className="text-blue-400/60 text-xs font-medium">SIH26079 · Forecast reliability intelligence</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-blue-500/15 text-cyan-300 border border-blue-500/25'
                  : 'text-blue-200/60 hover:text-blue-200 hover:bg-white/5'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-500/10 text-xs text-blue-400/40 space-y-1">
          <p>Better forecasts for</p>
          <p>a more resilient India</p>
          <p className="mt-2 text-blue-400/25">MoES · ERA5 · GEFS</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 bg-[#0a0f1e]/90 backdrop-blur-sm border-b border-blue-500/10">
          <button
            className="md:hidden text-blue-300 hover:text-white"
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden md:block text-xs text-blue-400/50 font-mono">
            From data to safer decisions.
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-400/40">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
            Prototype · Illustrative · Not for operational use
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Footer bar */}
        <footer className="text-center text-xs text-blue-400/30 py-2 border-t border-blue-500/08">
          Smarter weather intelligence for a resilient India
        </footer>
      </div>
    </div>
  )
}
