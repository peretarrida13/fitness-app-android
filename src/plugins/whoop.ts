/**
 * src/plugins/whoop.ts
 * Typed Capacitor plugin wrapper for WhoopPlugin (native Android BLE bridge).
 * All BLE code is in Kotlin; this file is types + registration only.
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
  recoveryLevel: string | null
  strainScore: number
  strainLevel: string
  sleepStage: string
  sleepMinutes: { deep: number; rem: number; light: number; awake: number }
  batteryPercent: number
  batteryCharging: boolean
  deviceConnected: boolean
  sessionStartTime: string
  rrIntervalsRaw: number[]
  respiratoryRate: number | null
}

export interface ConnectionStatus {
  connected: boolean
  state: string
  lastSync: string
  batteryPercent: number
}

export interface WhoopPlugin {
  startService(): Promise<{ success: boolean }>
  stopService(): Promise<{ success: boolean }>
  getLatestSnapshot(): Promise<{ triggered: boolean }>
  getConnectionStatus(): Promise<ConnectionStatus>
  requestBlePermissions(): Promise<{ granted: boolean }>
  addListener(event: 'whoopStateChanged',  handler: (data: { state: string; detail: string }) => void): Promise<{ remove: () => void }>
  addListener(event: 'whoopConnected',     handler: (data: { deviceName: string; batteryPercent: number; firmwareVersion: string }) => void): Promise<{ remove: () => void }>
  addListener(event: 'whoopDisconnected',  handler: (data: { reason: string }) => void): Promise<{ remove: () => void }>
  addListener(event: 'whoopSnapshot',      handler: (data: WhoopSnapshot) => void): Promise<{ remove: () => void }>
  addListener(event: 'whoopHeartRate',     handler: (data: { bpm: number }) => void): Promise<{ remove: () => void }>
  addListener(event: 'whoopBattery',       handler: (data: { percent: number }) => void): Promise<{ remove: () => void }>
  addListener(event: 'whoopError',         handler: (data: { code: number; message: string }) => void): Promise<{ remove: () => void }>
}

const Whoop = registerPlugin<WhoopPlugin>('Whoop')
export default Whoop
