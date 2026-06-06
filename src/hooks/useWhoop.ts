/**
 * src/hooks/useWhoop.ts
 * React hook for the Whoop BLE pipeline.
 * Requests permissions → starts native service → listens for events.
 * On whoopSnapshot: updates state AND POSTs to Railway /ingest for server-side storage.
 * Does NOT stop the service on unmount — BLE must keep running in background.
 */
import { useEffect, useRef, useState } from 'react'
import Whoop from '../plugins/whoop'
import type { WhoopSnapshot, ConnectionStatus } from '../plugins/whoop'
import { isNative } from '../lib/platform'

const API_BASE = import.meta.env.VITE_RAILWAY_URL ?? ''

export function useWhoop() {
  const [snapshot, setSnapshot] = useState<WhoopSnapshot | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastSync: '',
    batteryPercent: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listenersRef = useRef<Array<{ remove: () => void }>>([])

  useEffect(() => {
    if (!isNative()) return
    let active = true

    async function init() {
      setIsLoading(true)
      try {
        const { granted } = await Whoop.requestBlePermissions()
        if (!granted) {
          setError('Bluetooth permissions denied')
          return
        }
        await Whoop.startService()

        // ── Event listeners ───────────────────────────────────────────────────
        const l1 = await Whoop.addListener('whoopConnected', (data) => {
          setConnectionStatus(prev => ({
            ...prev,
            connected: true,
            batteryPercent: data.batteryPercent,
          }))
          setError(null)
        })

        const l2 = await Whoop.addListener('whoopDisconnected', () => {
          setConnectionStatus(prev => ({ ...prev, connected: false }))
        })

        const l3 = await Whoop.addListener('whoopSnapshot', async (data) => {
          if (!active) return
          setSnapshot(data)
          setConnectionStatus(prev => ({
            ...prev,
            connected: true,
            lastSync: data.timestamp,
            batteryPercent: data.batteryPercent,
          }))
          // POST to Railway for server-side persistence
          if (API_BASE) {
            try {
              await fetch(`${API_BASE}/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
            } catch {
              // non-fatal — local data already updated
            }
          }
        })

        const l4 = await Whoop.addListener('whoopError', (data) => {
          setError(`${data.code}: ${data.message}`)
        })

        if (active) listenersRef.current = [l1, l2, l3, l4]
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start Whoop service')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    init()

    return () => {
      active = false
      // Remove listeners but do NOT stop the service — BLE must persist in background
      listenersRef.current.forEach(l => l.remove())
      listenersRef.current = []
    }
  }, [])

  const startService = async () => {
    try { await Whoop.startService() } catch { /* ignore */ }
  }

  const stopService = async () => {
    listenersRef.current.forEach(l => l.remove())
    listenersRef.current = []
    try { await Whoop.stopService() } catch { /* ignore */ }
  }

  return { snapshot, connectionStatus, isLoading, error, startService, stopService }
}
