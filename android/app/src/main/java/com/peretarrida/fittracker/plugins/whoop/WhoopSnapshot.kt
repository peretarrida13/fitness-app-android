/**
 * WhoopSnapshot.kt
 * Data classes for the Whoop BLE pipeline.
 * BiometricReading: decoded per-packet sample.
 * WhoopSnapshot: 5-minute aggregate POST payload to Railway /ingest.
 * Note: spO2/skinTempCelsius require server-side processing of raw optical ADC data;
 * BLE only provides HR + RR intervals + IMU reliably.
 */
package com.peretarrida.fittracker.plugins.whoop

enum class SleepStage { AWAKE, LIGHT, DEEP, REM }

/** Single decoded biometric sample from the strap. */
data class BiometricReading(
    val heartRate: Int,
    val rrIntervalMs: Float,    // 0.0 if not present in this packet
    val spO2: Float,            // 0.0 = not available via BLE without raw optical processing
    val skinTempCelsius: Float, // 0.0 = not available via BLE without raw ADC processing
    val accelX: Float,
    val accelY: Float,
    val accelZ: Float,
    val timestamp: Long,        // Unix ms; 0 = real-time (use System.currentTimeMillis())
)

/** Battery state from GET_BATTERY_LEVEL response. */
data class BatteryReading(
    val percent: Int,
    val charging: Boolean,
)

/** 5-minute aggregate snapshot — the POST payload to Railway /ingest. */
data class WhoopSnapshot(
    val timestamp: String,              // ISO-8601 UTC
    val heartRate: Int,                 // latest HR reading
    val hrv: Float?,                    // rMSSD, null if < 20 RR intervals available
    val spO2: Float,                    // 0.0 until PPG pipeline is implemented
    val skinTempCelsius: Float,         // 0.0 until ADC pipeline is implemented
    val accelMagnitude: Float,          // sqrt(x²+y²+z²), latest reading
    val recoveryScore: Int?,            // 0–100, null if baseline not yet established
    val recoveryLevel: String?,         // "In the Green" / "In the Yellow" / "In the Red"
    val strainScore: Float,             // 0–21 TRIMP-based
    val strainLevel: String,            // "low" / "moderate" / "high"
    val sleepStage: String,             // "AWAKE" / "LIGHT" / "DEEP" / "REM"
    val sleepMinutes: Map<String, Int>, // keys: deep, rem, light, awake
    val batteryPercent: Int,
    val batteryCharging: Boolean,
    val deviceConnected: Boolean,
    val sessionStartTime: String,       // ISO-8601 UTC, when BLE connected
    val rrIntervalsRaw: List<Float>,    // last 300 RR intervals for server HRV cross-check
)

/** Entry from the historical data dump (type 0x2F packet). */
data class HistoricalEntry(
    val unixSeconds: Long,
    val heartRateBpm: Int,
    val rrIntervals: List<Float>,       // may be empty (0–4 per packet)
)
