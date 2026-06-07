/**
 * src/components/whoop/WhoopConnection.tsx
 * Connection state machine UI — handles every WhoopConnectionState phase.
 * Auto-starts the BLE service on mount. Pure CSS animations, no libraries.
 * Design: #0a0a0f bg, #1a1a26 cards, #252535 border, #5b8dee blue, Inter font.
 */
import { useEffect, useRef, useState } from 'react'
import { useWhoop } from '../../hooks/useWhoop'

const blue  = '#5b8dee'
const green = '#22c55e'
const red   = '#ef4444'
const amber = '#f59e0b'

const KEYFRAMES = `
  @keyframes wp-pulse { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.5);opacity:.25} }
  @keyframes wp-spin  { to{transform:rotate(360deg)} }
`

function useScanTimer(active: boolean) {
  const [s, setS] = useState(0)
  const id = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (active) { setS(0); id.current = setInterval(() => setS(n => n + 1), 1000) }
    else { if (id.current) clearInterval(id.current); setS(0) }
    return () => { if (id.current) clearInterval(id.current) }
  }, [active])
  return s
}

function useCountUp(active: boolean) {
  const [s, setS] = useState(0)
  const id = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (active) { setS(0); id.current = setInterval(() => setS(n => n + 1), 1000) }
    else { if (id.current) clearInterval(id.current); setS(0) }
    return () => { if (id.current) clearInterval(id.current) }
  }, [active])
  return s
}

const Spinner = () => (
  <div style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid #252535`,
    borderTopColor: blue, animation: 'wp-spin .8s linear infinite', flexShrink: 0 }} />
)

export function WhoopConnection() {
  const { connectionState, connectionDetail, connectionStatus, startService, stopService } = useWhoop()

  const isScanning   = connectionState === 'Scanning'
  const isReconn     = connectionState === 'Disconnected' || connectionState === 'Error'
  const scanSecs     = useScanTimer(isScanning)
  const reconnSecs   = useCountUp(isReconn)

  // Auto-start service on mount
  useEffect(() => { startService() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const wrap: React.CSSProperties = {
    background: '#1a1a26', border: '1px solid #252535', borderRadius: 12,
    padding: '14px 14px', fontFamily: 'Inter, sans-serif',
    transition: 'all 200ms ease',
  }
  const row = (gap = 10): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap })
  const t   = (sz: number, col = '#e2e8f0', w = 400): React.CSSProperties =>
    ({ fontSize: sz, color: col, fontWeight: w, lineHeight: 1.4 })

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (connectionState === 'Idle') return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <div style={{ ...row(12), marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: '#252535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⌚</div>
        <div><div style={t(14, '#e2e8f0', 600)}>Connect your Whoop</div><div style={t(12, '#666')}>Tap to start syncing</div></div>
      </div>
      <button onClick={startService} style={{ width: '100%', background: blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Connect Whoop
      </button>
    </div>
  )

  // ── CheckingRemembered — Goose: loadRememberedDevice ─────────────────────
  if (connectionState === 'CheckingRemembered') return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <div style={row(10)}>
        <Spinner />
        <div style={t(13, '#e2e8f0', 600)}>Looking for your Whoop...</div>
      </div>
    </div>
  )

  // ── Scanning ──────────────────────────────────────────────────────────────
  if (connectionState === 'Scanning') return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <div style={{ ...row(12), marginBottom: 8 }}>
        <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: blue, animation: 'wp-pulse 1.8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: blue }} />
        </div>
        <div>
          <div style={t(14, '#e2e8f0', 600)}>Searching for Whoop 5.0...</div>
          <div style={t(11, '#555')}>
            {scanSecs}s
            {scanSecs > 20 && scanSecs <= 30 && ' · Move Whoop closer'}
            {scanSecs > 30 && ' · Check Bluetooth and location permission'}
          </div>
        </div>
      </div>
      <div style={{ ...t(11, '#444'), marginBottom: 10 }}>Make sure your Whoop is nearby and charged</div>
      <button onClick={stopService} style={{ background: 'transparent', color: red, border: `1px solid ${red}`, borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        Stop
      </button>
    </div>
  )

  // ── Found / Connecting ────────────────────────────────────────────────────
  if (connectionState === 'Found' || connectionState === 'Connecting') return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <div style={row(10)}><Spinner /><div style={t(14, '#e2e8f0', 600)}>Found Whoop — connecting...</div></div>
    </div>
  )

  // ── Discovering services ──────────────────────────────────────────────────
  if (connectionState === 'DiscoveringServices') return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <div style={row(10)}><Spinner /><div style={t(14, '#e2e8f0', 600)}>Setting up connection...</div></div>
    </div>
  )

  // ── Enabling notifications ────────────────────────────────────────────────
  if (connectionState === 'EnablingNotifications') {
    const m = /\((\d+)\/(\d+)\)/.exec(connectionDetail)
    const done = m ? parseInt(m[1]) : 0; const total = m ? parseInt(m[2]) : 9
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return (
      <div style={wrap}>
        <style>{KEYFRAMES}</style>
        <div style={{ ...row(10), marginBottom: 10 }}>
          <Spinner />
          <div style={t(14, '#e2e8f0', 600)}>Almost ready...</div>
        </div>
        <div style={{ height: 3, background: '#252535', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: blue, borderRadius: 2, transition: 'width 300ms ease' }} />
        </div>
      </div>
    )
  }

  // ── Connected — compact status bar ────────────────────────────────────────
  if (connectionState === 'Connected') {
    const bat = connectionStatus.batteryPercent
    const batC = bat > 50 ? green : bat >= 20 ? amber : red
    return (
      <div style={{ ...wrap, padding: '8px 12px' }}>
        <style>{KEYFRAMES}</style>
        <div style={row(8)}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: green, flexShrink: 0 }} />
          <div style={{ ...t(13, '#e2e8f0', 600), flex: 1 }}>Connected</div>
          <div style={row(6)}>
            <div style={{ width: 22, height: 11, border: `1.5px solid ${batC}`, borderRadius: 2, position: 'relative' }}>
              <div style={{ width: 2, height: 5, background: batC, position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)', borderRadius: '0 1px 1px 0' }} />
              <div style={{ height: '100%', width: `${bat}%`, background: batC, borderRadius: 1 }} />
            </div>
            <span style={t(11, batC, 600)}>{bat}%</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Disconnected / Error ──────────────────────────────────────────────────
  const is133 = connectionState === 'Error' && connectionDetail.includes('133')
  return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <div style={{ ...row(8), marginBottom: is133 ? 4 : 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: red, flexShrink: 0 }} />
        <div style={t(13, red, 600)}>
          {is133 ? 'Connection error — retrying automatically' : `Disconnected — reconnecting ${reconnSecs}s`}
        </div>
      </div>
      {is133 && <div style={t(11, '#555')}>Official Whoop app may be holding the connection. Force-stop it.</div>}
    </div>
  )
}
