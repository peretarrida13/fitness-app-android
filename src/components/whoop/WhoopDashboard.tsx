/**
 * src/components/whoop/WhoopDashboard.tsx
 * Whoop BLE dashboard: 5 metric cards + workout sessions + 7-day recovery chart.
 * Uses useWhoop() hook. Collapses to localStorage key whoop_dashboard_collapsed.
 * Shows offline banner if not connected; rest of app is unaffected.
 * Design tokens match existing app: #0a0a0f background, #1a1a26 cards, #252535 borders.
 */
import { useState, useEffect } from 'react'
import { useWhoop } from '../../hooks/useWhoop'
import { WhoopChart } from './WhoopChart'

const STORAGE_KEY = 'whoop_dashboard_collapsed'

const rc = (s: number | null) => !s ? '#888' : s >= 67 ? '#22c55e' : s >= 34 ? '#eab308' : '#ef4444'
const sc = (v: number) => v > 14 ? '#ef4444' : v >= 10 ? '#f97316' : '#3b82f6'
const bc = (p: number) => p > 50 ? '#22c55e' : p >= 20 ? '#f59e0b' : '#ef4444'
function hm(h: number) { const hr = Math.floor(h), m = Math.round((h - hr) * 60); return m ? `${hr}h ${m}m` : `${hr}h` }

const card: React.CSSProperties = {
  flexShrink: 0, width: 130, background: '#14141e', border: '1px solid #252535',
  borderRadius: 10, padding: 12, minHeight: 90,
}
const label: React.CSSProperties = { fontSize: 9, color: '#555', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }
const big: React.CSSProperties = { fontSize: 36, fontWeight: 700, lineHeight: 1, marginBottom: 4 }
const sub: React.CSSProperties = { fontSize: 11, color: '#888', lineHeight: 1.4 }

export function WhoopDashboard() {
  const { snapshot, connectionStatus, isLoading } = useWhoop()
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true')
  const [history] = useState<Array<{ date: string; recoveryScore: number | null }>>([])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(!open)) }, [open])

  // if (!isNative()) return null  // temporarily disabled for browser preview

  const rec = snapshot?.recoveryScore ?? null
  const slpH = 0  // sleep hours — would come from separate sleep session tracking
  const str = snapshot?.strainScore ?? 0
  const hrv = snapshot?.hrv ?? null
  const bat = snapshot?.batteryPercent ?? 0
  const batColor = bc(bat)

  return (
    <div style={{ background: '#0a0a0f', border: '1px solid #1a1a26', borderRadius: 14, margin: '0 0 12px', overflow: 'hidden' }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #1a1a26' }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>⌚ Whoop</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#666' }}>
          {connectionStatus.connected
            ? <span style={{ color: '#22c55e' }}>● Connected</span>
            : <span style={{ color: '#ef4444' }}>● Searching…</span>}
          <span style={{ color: '#555' }}>{open ? '▲' : '▼'}</span>
        </span>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: '12px 14px 14px' }}>
          {!connectionStatus.connected && !snapshot ? (
            <div style={{ background: '#1a1a26', borderRadius: 8, padding: '12px 14px', textAlign: 'center', color: '#555', fontSize: 13 }}>
              Whoop device not connected
            </div>
          ) : (
            <>
              {/* 5 metric cards */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
                <div style={card}>
                  <div style={label}>Recovery</div>
                  <div style={{ ...big, color: rc(rec) }}>{rec ?? '—'}</div>
                  <div style={sub}>{snapshot?.recoveryLevel ?? '—'}</div>
                  <div style={sub}>HRV {snapshot?.hrv?.toFixed(0) ?? '—'} · RHR —</div>
                </div>
                <div style={card}>
                  <div style={label}>Sleep</div>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>🌙</div>
                  <div style={{ ...big, fontSize: 28, color: '#e2e8f0' }}>—</div>
                  <div style={sub}>{slpH ? hm(slpH) : '—'}</div>
                </div>
                <div style={card}>
                  <div style={label}>Strain</div>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>⚡</div>
                  <div style={{ ...big, color: sc(str) }}>{str.toFixed(1)}</div>
                  <div style={sub}>/ 21</div>
                  <div style={sub}>{snapshot ? `${snapshot.strainLevel}` : ''}</div>
                </div>
                <div style={card}>
                  <div style={label}>HRV</div>
                  <div style={{ ...big, color: '#5b8dee' }}>{hrv?.toFixed(0) ?? '—'}</div>
                  <div style={sub}>ms rMSSD</div>
                </div>
                <div style={card}>
                  <div style={label}>Battery</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 32, height: 16, border: `2px solid ${batColor}`, borderRadius: 3, position: 'relative' }}>
                      <div style={{ width: 3, height: 8, background: batColor, position: 'absolute', right: -4, top: 2, borderRadius: '0 2px 2px 0' }} />
                      <div style={{ height: '100%', width: `${bat}%`, background: batColor, borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: batColor }}>{bat}%</span>
                  </div>
                  <div style={sub}>{snapshot?.batteryCharging ? '⚡ Charging' : ''}</div>
                  <div style={sub}>~{(bat / 100 * 14).toFixed(1)}d left</div>
                </div>
              </div>

              {/* Sessions placeholder */}
              <div style={{ marginBottom: 12 }}>
                <div style={label}>Sessions Today</div>
                <div style={{ color: '#555', fontSize: 13, padding: '4px 0' }}>
                  {isLoading ? 'Loading…' : 'No sessions yet'}
                </div>
              </div>

              {/* 7-day chart */}
              {history.length > 0 && (
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>7-Day Recovery</div>
                  <WhoopChart history={history} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
