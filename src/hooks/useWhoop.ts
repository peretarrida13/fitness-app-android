/**
 * src/hooks/useWhoop.ts
 * React hook for the Whoop BLE pipeline.
 * On mount: restores last known state, registers all event listeners.
 * Does NOT auto-start the service — WhoopConnection.tsx does that on mount.
 * Does NOT stop the service on unmount — BLE persists in the background.
 * On whoopSnapshot: POSTs to Railway /ingest fire-and-forget.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import Whoop from '../plugins/whoop'
import type { WhoopSnapshot, ConnectionStatus } from '../plugins/whoop'
import { isNative } from '../lib/platform'

const API_BASE = import.meta.env.VITE_RAILWAY_URL ?? ''

export function useWhoop() {
  const [snapshot, setSnapshot] = useState<WhoopSnapshot | null>(null)
  const [connectionState, setConnectionState] = useState<string>('Idle')
  const [connectionDetail, setConnectionDetail] = useState<string>('')
  const [liveHeartRate, setLiveHeartRate] = useState<number | null>(null)
  const [liveBattery, setLiveBattery] = useState<number | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false, state: 'Idle', lastSync: '', batteryPercent: 0,
  })
  const listenersRef = useRef<Array<{ remove: () => void }>>([])

  useEffect(() => {
    if (!isNative()) return
    let active = true

    async function init() {
      try {
        const current = await Whoop.getConnectionStatus()
        if (active) { setConnectionStatus(current); setConnectionState(current.state ?? 'Idle') }
      } catch { /* events will update state */ }

      const l0 = await Whoop.addListener('whoopStateChanged', ({ state, detail }) => {
        if (!active) return
        setConnectionState(state); setConnectionDetail(detail)
        setConnectionStatus(prev => ({ ...prev, state }))
      })
      const l1 = await Whoop.addListener('whoopConnected', ({ batteryPercent }) => {
        if (!active) return
        setConnectionStatus(prev => ({ ...prev, connected: true, state: 'Connected', batteryPercent }))
        setConnectionState('Connected')
      })
      const l2 = await Whoop.addListener('whoopDisconnected', () => {
        if (!active) return
        setConnectionStatus(prev => ({ ...prev, connected: false }))
        setLiveHeartRate(null)
      })
      const l3 = await Whoop.addListener('whoopSnapshot', async (data) => {
        if (!active) return
        setSnapshot(data)
        setConnectionStatus(prev => ({ ...prev, connected: true, lastSync: data.timestamp, batteryPercent: data.batteryPercent }))
        if (API_BASE) fetch(`${API_BASE}/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {})
      })
      const l4 = await Whoop.addListener('whoopError', () => { /* surfaced via whoopStateChanged */ })

      // Live HR — fires on every heartbeat from the standard BLE HR characteristic
      const l5 = await Whoop.addListener('whoopHeartRate', ({ bpm }) => {
        if (active) setLiveHeartRate(bpm)
      })
      // Battery update — fires once after connect and whenever battery is re-read
      const l6 = await Whoop.addListener('whoopBattery', ({ percent }) => {
        if (active) {
          setLiveBattery(percent)
          setConnectionStatus(prev => ({ ...prev, batteryPercent: percent }))
        }
      })

      if (active) listenersRef.current = [l0, l1, l2, l3, l4, l5, l6]
    }

    init()
    return () => {
      active = false
      listenersRef.current.forEach(l => l.remove())
      listenersRef.current = []
    }
  }, [])

  const startService = useCallback(async () => {
    try {
      const { granted } = await Whoop.requestBlePermissions()
      if (!granted) return
      await Whoop.startService()
    } catch { /* ignore */ }
  }, [])

  const stopService = useCallback(async () => {
    listenersRef.current.forEach(l => l.remove()); listenersRef.current = []
    try { await Whoop.stopService() } catch { /* ignore */ }
    setConnectionState('Idle'); setConnectionStatus(prev => ({ ...prev, connected: false, state: 'Idle' }))
  }, [])

  return { snapshot, connectionState, connectionDetail, connectionStatus, liveHeartRate, liveBattery, startService, stopService }
}
