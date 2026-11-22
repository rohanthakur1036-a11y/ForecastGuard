import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getRegions } from '../services/api'
import { Card, SectionHeader, RiskBadge, Spinner, ErrorBanner } from '../components/ui'
import { Map, Info } from 'lucide-react'
import { RISK_COLORS } from '../types'

const SAMPLE_REGION_RISKS: Record<string, any> = {
  WG_North: { probability: 0.74, level: 'High', drivers: ['Elevated spread', 'Run-to-run inconsistency'], forecast_mm: 48.5 },
  WG_Central: { probability: 0.52, level: 'Moderate', drivers: ['Moderate HRES deviation', 'CV = 0.75'], forecast_mm: 32.0 },
  WG_South: { probability: 0.22, level: 'Low', drivers: ['Tight ensemble cluster', 'Low spread'], forecast_mm: 18.5 },
}

export default function RiskExplorer() {
  const [regionsData, setRegionsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    getRegions()
      .then(setRegionsData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-96"><Spinner size="lg" /></div>
  if (error) return <div className="p-6"><ErrorBanner message={error} /></div>

  const regions = regionsData?.regions || []
  const selectedRegion = regions.find((r: any) => r.id === selected)
  const selectedRisk = selected ? SAMPLE_REGION_RISKS[selected] : null

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Map className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Explorer</h1>
          <p className="text-blue-400/60 text-sm">Interactive Western Ghats bust risk map · Click a region to explore</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="rounded-xl overflow-hidden" style={{ height: '480px' }}>
              <MapContainer
                center={[14.0, 74.5]}
                zoom={6}
                style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                  opacity={0.3}
                />
                {regions.map((r: any) => {
                  const risk = SAMPLE_REGION_RISKS[r.id]
                  const color = RISK_COLORS[risk?.level] || '#94a3b8'
                  const lat = (r.lat_range[0] + r.lat_range[1]) / 2
                  const lon = (r.lon_range[0] + r.lon_range[1]) / 2
                  return (
                    <Circle
                      key={r.id}
                      center={[lat, lon]}
                      radius={80000}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: selected === r.id ? 0.4 : 0.2,
                        weight: selected === r.id ? 3 : 1.5,
                      }}
                      eventHandlers={{ click: () => setSelected(r.id) }}
                    >
                      <Popup>
                        <div className="text-white">
                          <p className="font-bold">{r.name}</p>
                          <p className="text-sm">{risk?.probability ? `${Math.round(risk.probability * 100)}% bust risk` : ''}</p>
                        </div>
                      </Popup>
                    </Circle>
                  )
                })}
              </MapContainer>
            </div>
            <div className="px-4 py-3 bg-black/20 border-t border-blue-500/10">
              <div className="flex items-center gap-4 text-xs text-blue-400/60">
                {[['#ef4444', 'High Risk'], ['#f59e0b', 'Moderate Risk'], ['#10b981', 'Low Risk']].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: c }} />{l}
                  </span>
                ))}
                <span className="ml-auto italic">Illustrative sample risk values</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Region details */}
        <div className="space-y-4">
          {/* Region selector */}
          <Card>
            <SectionHeader icon={<Info className="h-4 w-4" />} title="Regional Zones" />
            <div className="space-y-2">
              {regions.map((r: any) => {
                const risk = SAMPLE_REGION_RISKS[r.id]
                return (
                  <button key={r.id}
                    onClick={() => setSelected(selected === r.id ? null : r.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all
                      ${selected === r.id
                        ? 'border-cyan-400/40 bg-cyan-500/10'
                        : 'border-blue-500/10 bg-white/3 hover:border-blue-400/20 hover:bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-200 text-sm font-medium">{r.name}</span>
                      <RiskBadge level={risk?.level || 'Low'} />
                    </div>
                    <p className="text-blue-400/50 text-xs">{r.state_coverage}</p>
                    <p className="text-white font-bold text-lg mt-1">{Math.round((risk?.probability || 0) * 100)}%</p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Selected region detail */}
          {selectedRegion && selectedRisk ? (
            <Card>
              <SectionHeader title={selectedRegion.name} subtitle="Day-5 bust probability analysis" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300/70 text-sm">Bust Probability</span>
                  <span className="text-white font-bold text-xl">{Math.round(selectedRisk.probability * 100)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${selectedRisk.probability * 100}%`, background: RISK_COLORS[selectedRisk.level] }} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-400/60 text-xs">Risk Level</p>
                    <RiskBadge level={selectedRisk.level} size="md" />
                  </div>
                  <div>
                    <p className="text-blue-400/60 text-xs">Forecast</p>
                    <p className="text-white font-semibold">{selectedRisk.forecast_mm} mm</p>
                  </div>
                  <div>
                    <p className="text-blue-400/60 text-xs">Lat Band</p>
                    <p className="text-blue-200 text-xs font-mono">{selectedRegion.lat_range[0]}°N – {selectedRegion.lat_range[1]}°N</p>
                  </div>
                  <div>
                    <p className="text-blue-400/60 text-xs">Lon Band</p>
                    <p className="text-blue-200 text-xs font-mono">{selectedRegion.lon_range[0]}°E – {selectedRegion.lon_range[1]}°E</p>
                  </div>
                </div>
                <div>
                  <p className="text-blue-400/60 text-xs mb-2">Risk Drivers</p>
                  {selectedRisk.drivers.map((d: string) => (
                    <span key={d} className="inline-block text-xs text-cyan-300/70 bg-cyan-500/10 rounded px-2 py-0.5 mr-1 mb-1 border border-cyan-500/15">{d}</span>
                  ))}
                </div>
                <div className="pt-2 border-t border-blue-500/08">
                  <p className="text-blue-200/70 text-xs">{selectedRegion.description}</p>
                </div>
              </div>
              <p className="text-blue-400/30 text-xs mt-3">⚠ Values are illustrative. Use Test Model for actual ML predictions.</p>
            </Card>
          ) : (
            <Card className="flex flex-col items-center py-10">
              <Map className="h-10 w-10 text-blue-400/20 mb-3" />
              <p className="text-blue-400/50 text-sm text-center">Click a region circle on the map or select above</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
