/**
 * src/hooks/useWhoopBackend.ts
 * Polls the local BLE backend's /today endpoint every 60s.
 * Returns null when the backend is unreachable (e.g. not started).
 * Components should fall back to live BLE snapshot data when data is null.
 */
import { useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_RAILWAY_URL ?? ''
const POLL_MS = 60_000

export interface BackendHrv {
  rmssd: number | null
  sdnn: number | null
  pnn50: number | null
  mean_nn: number | null
}

export interface BackendToday {
  recovery: { score: number | null; level: string | null; hrv: BackendHrv | null } | null
  strain: { score: number; level: string } | null
  sleep: Record<string, number> | null
  battery: { percent: number; charging: boolean; estimated_days_remaining: number } | null
  heart_rate: number | null
  stress: { score: number; level: string } | null
  energy: { kcal: number } | null
  stale: boolean
}

export function useWhoopBackend() {
  const [data, setData] = useState<BackendToday | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchToday() {
    if (!API_BASE) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/today`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) return
      const json = await res.json()
      setData(json as BackendToday)
      setLastFetch(new Date().toISOString())
    } catch {
      // Backend not running — leave data as-is, component falls back to BLE snapshot
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!API_BASE) return
    fetchToday()
    timerRef.current = setInterval(fetchToday, POLL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { data, loading, lastFetch }
}
