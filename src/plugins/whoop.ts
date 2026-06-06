/**
 * src/plugins/whoop.ts
 * Typed Capacitor plugin wrapper for WhoopPlugin (native Android BLE bridge).
 * All platform-specific BLE code lives in native Kotlin; this file is types + registration only.
 * Import Whoop from here, never from @capacitor/core directly.
 */
import { registerPlugin } from '@capacitor/core'

export interface WhoopSnapshot {
  timestamp: string
  heartRate: number
  hrv: number | null
  spO2: number
  skinTempCelsius: number
  accelMagnitude: number
  recoveryScore: number | null
  recoveryLevel: string | null     // "In the Green" | "In the Yellow" | "In the Red"
  strainScore: number              // 0–21
  strainLevel: string              // "low" | "moderate" | "high"
  sleepStage: string               // "AWAKE" | "LIGHT" | "DEEP" | "REM"
  sleepMinutes: {
    deep: number
    rem: number
    light: number
    awake: number
  }
  batteryPercent: number
  batteryCharging: boolean
  deviceConnected: boolean
  sessionStartTime: string
  rrIntervalsRaw: number[]
}

export interface ConnectionStatus {
  connected: boolean
  lastSync: string
  batteryPercent: number
}

export interface WhoopPlugin {
  startService(): Promise<{ success: boolean }>
  stopService(): Promise<{ success: boolean }>
  getLatestSnapshot(): Promise<{ triggered: boolean }>
  getConnectionStatus(): Promise<ConnectionStatus>
  requestBlePermissions(): Promise<{ granted: boolean }>
  addListener(
    event: 'whoopConnected',
    handler: (data: { deviceName: string; batteryPercent: number }) => void,
  ): Promise<{ remove: () => void }>
  addListener(
    event: 'whoopDisconnected',
    handler: (data: { reason: string }) => void,
  ): Promise<{ remove: () => void }>
  addListener(
    event: 'whoopSnapshot',
    handler: (data: WhoopSnapshot) => void,
  ): Promise<{ remove: () => void }>
  addListener(
    event: 'whoopError',
    handler: (data: { code: string; message: string }) => void,
  ): Promise<{ remove: () => void }>
}

const Whoop = registerPlugin<WhoopPlugin>('Whoop')
export default Whoop
