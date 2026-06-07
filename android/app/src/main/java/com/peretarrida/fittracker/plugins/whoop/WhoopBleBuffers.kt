/**
 * WhoopBleBuffers.kt
 * Rolling in-memory buffers for raw BLE samples plus metric computation and HTTP upload.
 * Keeps last 300 RR intervals, 60 min of HR, and 300 IMU readings for algorithm inputs.
 * computeSnapshot() builds a WhoopSnapshot from buffers and POSTs to Railway via OkHttp.
 * Imports: WhoopAlgorithms, WhoopSnapshot, okhttp3, gson
 */
package com.peretarrida.fittracker.plugins.whoop

import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit
import kotlin.math.sqrt

class WhoopBleBuffers {

    // ── Rolling buffers ───────────────────────────────────────────────────────
    val rrBuffer   = ArrayDeque<Float>(300)      // RR intervals (ms)
    val hrBuffer   = ArrayDeque<Int>(3600)       // 1 sample/sec × 60 min
    val accelBuf   = ArrayDeque<Triple<Float,Float,Float>>(300)
    val spO2Buf    = ArrayDeque<Float>(60)

    // ── Persistent state ──────────────────────────────────────────────────────
    var battery = BatteryReading(percent = 0, charging = false)
    var latestHr = 0
    var latestAccel = Triple(0f, 0f, 1f)  // default upright
    var currentSleepStage = SleepStage.AWAKE
    val sleepMinutes = mutableMapOf("deep" to 0, "rem" to 0, "light" to 0, "awake" to 0)
    var sessionStart = Instant.now()

    // ── HRV baseline (simple rolling 30-day approx via session accumulation) ──
    private val rmssdHistory = ArrayDeque<Float>(8640)  // 30d at 5-min intervals
    var hrBaseline = 60f
    var rmssdBaseline = 55f  // population default; updates after first full session

    private val gson = Gson()
    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    // ── Ingest a decoded reading ──────────────────────────────────────────────

    fun ingestReading(reading: BiometricReading) {
        latestHr = reading.heartRate
        if (reading.rrIntervalMs > 0f) addCapped(rrBuffer, reading.rrIntervalMs, 300)
        addCapped(hrBuffer, reading.heartRate, 3600)
        if (reading.accelX != 0f || reading.accelY != 0f || reading.accelZ != 0f) {
            latestAccel = Triple(reading.accelX, reading.accelY, reading.accelZ)
            addCapped(accelBuf, latestAccel, 300)
        }
        if (reading.spO2 > 0f) addCapped(spO2Buf, reading.spO2, 60)

        // Update sleep stage on each accel+HR reading
        val rrLatest = rrBuffer.lastOrNull() ?: 800f
        currentSleepStage = WhoopAlgorithms.classifySleepStage(
            latestAccel, reading.heartRate, rrLatest, currentSleepStage
        )
        sleepMinutes[currentSleepStage.name.lowercase()] =
            (sleepMinutes[currentSleepStage.name.lowercase()] ?: 0) + 0  // incremented by service
    }

    fun ingestBattery(b: BatteryReading) { battery = b }

    fun tickSleepMinute() {
        val key = currentSleepStage.name.lowercase()
        sleepMinutes[key] = (sleepMinutes[key] ?: 0) + 1
    }

    // ── Build and POST snapshot ───────────────────────────────────────────────

    suspend fun computeAndUpload(): Boolean = withContext(Dispatchers.IO) {
        val snapshot = buildSnapshot()
        WhoopPlugin.emitSnapshot(snapshot)
        uploadSnapshot(snapshot)
    }

    private fun buildSnapshot(): WhoopSnapshot {
        val hrList = hrBuffer.toList()
        val rrList = rrBuffer.toList()
        val rmssd = WhoopAlgorithms.calculateRmssd(rrList)
        if (rmssd != null) {
            addCapped(rmssdHistory, rmssd, 8640)
            if (rmssdHistory.size > 10) rmssdBaseline = rmssdHistory.average().toFloat()
        }
        val restingHr = hrList.filter { it < 80 }.average().toFloat()
            .takeIf { !it.isNaN() } ?: hrBaseline
        val sleepScore = WhoopAlgorithms.calculateSleepScore(
            deepMinutes = sleepMinutes["deep"] ?: 0,
            remMinutes  = sleepMinutes["rem"] ?: 0,
            totalMinutes = sleepMinutes.values.sum(),
            efficiency  = if ((sleepMinutes["awake"] ?: 0) == 0) 1f else
                ((sleepMinutes.values.sum() - (sleepMinutes["awake"] ?: 0))
                    .toFloat() / sleepMinutes.values.sum()),
        )
        val recovery = if (rmssd != null)
            WhoopAlgorithms.calculateRecoveryScore(rmssd, rmssdBaseline, restingHr, hrBaseline, sleepScore.toFloat())
        else null
        val strain = WhoopAlgorithms.calculateStrain(hrList, hrList.size / 60)
        val mag = latestAccel.let { (x,y,z) -> sqrt(x*x + y*y + z*z) }
        val iso = DateTimeFormatter.ISO_INSTANT.format(Instant.now().atZone(ZoneOffset.UTC))
        val sessionIso = DateTimeFormatter.ISO_INSTANT.format(sessionStart.atZone(ZoneOffset.UTC))
        return WhoopSnapshot(
            timestamp = iso, heartRate = latestHr, hrv = rmssd,
            spO2 = WhoopAlgorithms.calculateSpO2Average(spO2Buf.toList()),
            skinTempCelsius = 0f, accelMagnitude = mag,
            recoveryScore = recovery,
            recoveryLevel = recovery?.let { WhoopAlgorithms.getRecoveryLevel(it) },
            strainScore = strain, strainLevel = WhoopAlgorithms.getStrainLevel(strain),
            sleepStage = currentSleepStage.name,
            sleepMinutes = sleepMinutes.toMap(),
            batteryPercent = battery.percent, batteryCharging = battery.charging,
            deviceConnected = true, sessionStartTime = sessionIso,
            rrIntervalsRaw = rrList.takeLast(300),
        )
    }

    private fun uploadSnapshot(snapshot: WhoopSnapshot): Boolean {
        return try {
            val json = gson.toJson(snapshot)
            val body = json.toRequestBody("application/json".toMediaType())
            val req = Request.Builder()
                .url("${WhoopGattProfile.RAILWAY_BASE_URL}${WhoopGattProfile.INGEST_PATH}")
                .post(body)
                .build()
            val resp = http.newCall(req).execute()
            val ok = resp.isSuccessful
            resp.close()
            Log.i("WhoopBuffers", "upload: HTTP ${resp.code}")
            ok
        } catch (e: Exception) {
            Log.e("WhoopBuffers", "upload failed: ${e.message}")
            false
        }
    }

    private fun <T> addCapped(dq: ArrayDeque<T>, v: T, cap: Int) {
        if (dq.size >= cap) dq.removeFirst()
        dq.addLast(v)
    }
}
