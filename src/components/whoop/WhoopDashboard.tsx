/**
 * src/components/whoop/WhoopDashboard.tsx
 * Whoop BLE dashboard — Recovery + Strain SVG rings, battery indicator, live BPM toggle.
 * Ring pattern reused from src/components/home/RecoveryCard.tsx (RecoveryRing).
 * Data priority: backend /today first, live BLE snapshot fallback.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWhoop } from '../../hooks/useWhoop'
import { useWhoopBackend } from '../../hooks/useWhoopBackend'
import { WhoopChart } from './WhoopChart'
import { WhoopConnection } from './WhoopConnection'

const STORAGE_KEY     = 'whoop_dashboard_collapsed'
const BPM_TOGGLE_KEY  = 'whoop_bpm_toggle'

const rc = (s: number | null) => !s ? '#444' : s >= 67 ? '#22c55e' : s >= 34 ? '#eab308' : '#ef4444'
const sc = (v: number) => v > 14 ? '#ef4444' : v >= 10 ? '#f97316' : '#3b82f6'
const bc = (p: number) => p > 50 ? '#22c55e' : p >= 20 ? '#f59e0b' : '#ef4444'
function hm(h: number) { const hr = Math.floor(h), m = Math.round((h - hr) * 60); return m ? `${hr}h ${m}m` : `${hr}h` }

const sub: React.CSSProperties = { fontSize: 11, color: '#666', lineHeight: 1.4, textAlign: 'center' }

// ── SVG ring — reused pattern from RecoveryCard.tsx RecoveryRing ─────────────
function Ring({
  pct, color, centerTop, centerBot, size = 110, sw = 10,
}: {
  pct: number; color: string; centerTop: string; centerBot: string; size?: number; sw?: number
}) {
  const r  = (size - sw) / 2
  const c  = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(1, pct)))
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a26" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw}
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s' }}
      />
      <g transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: color, fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
          {centerTop}
        </text>
        <text x={size / 2} y={size / 2 + 13} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: '#555', fontSize: 8, letterSpacing: '0.06em', fontFamily: 'inherit' }}>
          {centerBot}
        </text>
      </g>
    </svg>
  )
}

export function WhoopDashboard() {
  const navigate = useNavigate()
  const { snapshot, connectionState, connectionStatus, liveHeartRate, liveBattery } = useWhoop()
  const { data: backend } = useWhoopBackend()
  const [open,    setOpen]    = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true')
  const [showBpm, setShowBpm] = useState(() => localStorage.getItem(BPM_TOGGLE_KEY) === 'true')
  const [history] = useState<Array<{ date: string; recoveryScore: number | null }>>([])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(!open)) }, [open])
  useEffect(() => { localStorage.setItem(BPM_TOGGLE_KEY, String(showBpm)) }, [showBpm])

  const isConnected = connectionState === 'Connected' || connectionStatus.connected

  const rec       = backend?.recovery?.score ?? snapshot?.recoveryScore ?? null
  const recLevel  = backend?.recovery?.level ?? snapshot?.recoveryLevel ?? null
  const str       = backend?.strain?.score   ?? snapshot?.strainScore   ?? 0
  const strLevel  = backend?.strain?.level   ?? snapshot?.strainLevel   ?? null
  // hrv is now a dict from the backend; snapshot.hrv is a raw number from BLE
  const _backendHrv = backend?.recovery?.hrv
  const hrv       = _backendHrv?.rmssd ?? snapshot?.hrv ?? null
  // liveBattery comes from whoopBattery event (fires ~0.5s after connect, real device reading)
  const bat       = liveBattery ?? backend?.battery?.percent ?? snapshot?.batteryPercent ?? 0
  const batDays   = backend?.battery?.estimated_days_remaining ?? (bat / 100 * 14)
  const batCharging = backend?.battery?.charging ?? snapshot?.batteryCharging ?? false
  // liveHeartRate comes from whoopHeartRate event (fires every heartbeat via standard BLE HR char)
  const bpm       = liveHeartRate ?? (snapshot?.heartRate || null) ?? (backend?.heart_rate || null) ?? null
  const sleepMins = backend?.sleep
    ? Object.values(backend.sleep).reduce((a, b) => a + b, 0) - (backend.sleep.awake ?? 0)
    : 0
  const slpH     = sleepMins / 60
  const isStale  = backend?.stale ?? false
  // Show ring layout as soon as connected — rings show "—" until first snapshot arrives (30s)
  const hasData  = !!(snapshot || backend) || isConnected

  const batColor = bc(bat)

  return (
    <div style={{ background: '#0a0a0f', border: '1px solid #1a1a26', borderRadius: 14, margin: '0 0 12px', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #1a1a26' }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>⌚ Recovery</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#666' }}>
          {isConnected
            ? <span style={{ color: '#22c55e' }}>● Connected</span>
            : <span style={{ color: connectionState === 'Scanning' ? '#5b8dee' : '#ef4444' }}>
                ● {connectionState === 'Scanning' ? 'Searching...' : connectionState === 'Idle' ? 'Not started' : 'Disconnected'}
              </span>
          }
          {isStale && <span style={{ color: '#f59e0b', fontSize: 10 }}>stale</span>}
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/whoop') }}
            style={{
              background: 'none', border: '1px solid #252535',
              borderRadius: 10, padding: '2px 8px',
              fontSize: 10, fontWeight: 600, color: '#5b8dee',
              cursor: 'pointer',
            }}
          >
            Open Whoop
          </button>
          <span style={{ color: '#555' }}>{open ? '▲' : '▼'}</span>
        </span>
      </div>

      {/* ── Body ── */}
      {open && (
        <div style={{ padding: '12px 14px 16px' }}>

          {/* Connection state machine — shown when not connected */}
          {!isConnected && (
            <div style={{ marginBottom: hasData ? 12 : 0 }}>
              <WhoopConnection />
            </div>
          )}

          {/* ── Metrics ── */}
          {hasData && (
            <>
              {/* Recovery + Strain rings */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', marginBottom: 14 }}>

                {/* Recovery ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Ring
                    pct={rec !== null ? rec / 100 : 0}
                    color={rc(rec)}
                    centerTop={rec !== null ? String(rec) : '—'}
                    centerBot="RECOVERY"
                  />
                  <div style={sub}>HRV {hrv?.toFixed(0) ?? '—'} ms</div>
                  {recLevel && <div style={{ ...sub, color: rc(rec), fontWeight: 600 }}>{recLevel}</div>}
                </div>

                {/* Strain ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Ring
                    pct={str / 21}
                    color={sc(str)}
                    centerTop={str > 0 ? str.toFixed(1) : '—'}
                    centerBot="STRAIN"
                  />
                  <div style={sub}>/ 21</div>
                  {strLevel && <div style={{ ...sub, color: sc(str), fontWeight: 600 }}>{strLevel}</div>}
                </div>

              </div>

              {/* Battery + BPM toggle row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px', borderTop: '1px solid #1a1a26', borderBottom: '1px solid #1a1a26', marginBottom: 10 }}>
                {/* Battery */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 15, border: `2px solid ${batColor}`, borderRadius: 3, position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 3, height: 7, background: batColor, position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', borderRadius: '0 2px 2px 0' }} />
                    <div style={{ height: '100%', width: `${bat}%`, background: batColor, borderRadius: 1, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: batColor }}>{bat}%</span>
                  <span style={{ fontSize: 11, color: '#555' }}>
                    {batCharging ? '⚡ Charging' : `~${batDays.toFixed(1)}d`}
                  </span>
                </div>
                {/* BPM toggle */}
                <button
                  onClick={() => setShowBpm(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: showBpm ? 'rgba(239,68,68,0.12)' : 'transparent',
                    border: `1px solid ${showBpm ? '#ef4444' : '#252535'}`,
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: 12, fontWeight: 600,
                    color: showBpm ? '#ef4444' : '#555',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <span>♡</span> BPM
                </button>
              </div>

              {/* Live BPM — shown when toggle is on */}
              {showBpm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '6px 0' }}>
                  <style>{`@keyframes bpm-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.5}}`}</style>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0,
                    animation: bpm !== null ? 'bpm-pulse 1s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 28, fontWeight: 700, color: bpm !== null ? '#ef4444' : '#444', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
                    {bpm ?? '—'}
                  </span>
                  <span style={{ fontSize: 13, color: '#555', alignSelf: 'flex-end', paddingBottom: 2 }}>bpm</span>
                  {bpm === null && (
                    <span style={{ fontSize: 11, color: '#444' }}>waiting for data...</span>
                  )}
                </div>
              )}

              {/* Compact stats row — HRV + Sleep */}
              {(hrv !== null || slpH > 0) && (
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#555' }}>
                  {hrv !== null && <span>HRV <strong style={{ color: '#5b8dee' }}>{hrv.toFixed(0)} ms</strong></span>}
                  {slpH > 0    && <span>Sleep <strong style={{ color: '#888' }}>{hm(slpH)}</strong></span>}
                </div>
              )}

              {/* 7-day chart */}
              {history.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>7-Day Recovery</div>
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
