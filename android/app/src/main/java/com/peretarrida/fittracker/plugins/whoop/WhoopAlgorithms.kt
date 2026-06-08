/**
 * WhoopAlgorithms.kt
 * Local computation of all Whoop-style biometric metrics from raw BLE data.
 * Formulas sourced from:
 *   rMSSD: Task Force (1996) standard, openwhoop implementation
 *   Strain: Edwards TRIMP zones, logarithmic 0–21 scale from openwhoop-algos/strain.rs
 *   Sleep stage: stillness + HR classifier from openwhoop-algos/sleep.rs
 *   Recovery: HRV-ratio + HR-delta + sleep composite from openwhoop-algos/stress.rs
 */
package com.peretarrida.fittracker.plugins.whoop

import kotlin.math.*

object WhoopAlgorithms {

    // ── rMSSD ─────────────────────────────────────────────────────────────────

    /**
     * Compute RMSSD from RR intervals in milliseconds.
     * Filters to 300–2000 ms, requires ≥20 valid intervals.
     * Returns null below threshold — never fabricates a value.
     */
    fun calculateRmssd(rrIntervals: List<Float>): Float? {
        val valid = rrIntervals.filter { it in 300f..2000f }
        if (valid.size < 20) return null
        val sumSq = valid.zipWithNext { a, b -> (b - a).pow(2) }.sum()
        return sqrt(sumSq / (valid.size - 1))
    }

    // ── Recovery score ────────────────────────────────────────────────────────

    /**
     * Recovery score 0–100.
     * HRV relative to baseline accounts for 50%, resting HR delta 30%, sleep 20%.
     * Port of openwhoop-algos stress.rs Baevsky / HRV-composite model.
     */
    fun calculateRecoveryScore(
        rmssd: Float,
        baseline: Float,
        restingHr: Float,
        baselineHr: Float,
        sleepScore: Float,
    ): Int {
        val safeBaseline = baseline.coerceAtLeast(1f)
        val safeBaselineHr = baselineHr.coerceAtLeast(1f)
        val hrvRatio = (rmssd / safeBaseline).coerceIn(0f, 2f)
        val hrvComponent = (hrvRatio * 50f).coerceIn(0f, 100f)
        val hrDelta = ((safeBaselineHr - restingHr) / safeBaselineHr).coerceIn(-1f, 1f)
        val hrComponent = (hrDelta * 25f + 25f).coerceIn(0f, 50f)
        val sleepComponent = (sleepScore * 0.3f).coerceIn(0f, 30f)
        return ((hrvComponent * 0.5f + hrComponent * 0.3f + sleepComponent * 0.2f)
            .coerceIn(0f, 100f))
            .roundToInt()
    }

    // ── Strain ────────────────────────────────────────────────────────────────

    /**
     * Strain on 0–21 scale.
     * Edwards TRIMP: samples classified into 5 HR zones (weights 1–5),
     * accumulated then compressed: strain = 21 × ln(TRIMP+1) / ln(7201).
     * Uses Tanaka HRmax = 208 − 0.7 × age. Default age 30, resting HR 60.
     */
    fun calculateStrain(
        heartRateReadings: List<Int>,
        durationMinutes: Int,
        age: Int = 30,
        restingHr: Int = 60,
    ): Float {
        if (heartRateReadings.isEmpty() || durationMinutes <= 0) return 0f
        val hrMax = (208 - 0.7 * age).toFloat()
        val hrr = (hrMax - restingHr).coerceAtLeast(1f)
        val sampleDurationMin = durationMinutes.toFloat() / heartRateReadings.size
        var trimp = 0.0
        for (hr in heartRateReadings) {
            val pctHrr = ((hr - restingHr) / hrr * 100f).coerceIn(0f, 100f)
            val zone = when {
                pctHrr >= 90 -> 5
                pctHrr >= 80 -> 4
                pctHrr >= 70 -> 3
                pctHrr >= 60 -> 2
                pctHrr >= 50 -> 1
                else -> 0
            }
            trimp += zone * sampleDurationMin
        }
        if (trimp <= 0) return 0f
        return (21.0 * ln(trimp + 1) / ln(7201.0)).toFloat().coerceIn(0f, 21f)
    }

    // ── Sleep staging ─────────────────────────────────────────────────────────

    private const val STILLNESS_THRESHOLD = 0.08f // g, from openwhoop stillness classifier

    /**
     * Classify sleep stage from IMU + HR + RR.
     * Based on openwhoop-algos/sleep.rs stillness + autonomic classifier.
     */
    fun classifySleepStage(
        accel: Triple<Float, Float, Float>,
        hr: Int,
        rrInterval: Float,
        prevStage: SleepStage,
    ): SleepStage {
        val mag = sqrt(
            accel.first.pow(2) + accel.second.pow(2) + accel.third.pow(2)
        )
        val dynamicMag = abs(mag - 1f)
        val isStill = dynamicMag < STILLNESS_THRESHOLD

        // Require movement to confirm AWAKE — single still sample keeps previous stage.
        if (!isStill) return SleepStage.AWAKE

        // Stricter HR threshold: 40–58 bpm. Awake-but-resting HR is typically >58,
        // so values in 59–65 are not reliable sleep indicators and default to AWAKE.
        if (hr !in 40..58) return SleepStage.AWAKE

        // Only classify non-AWAKE stages when already in a sleep state (hysteresis)
        // or when RR interval confirms very slow HR (>1030ms ≈ <58 bpm with variation).
        // This prevents brief still+slow-HR moments during wakefulness from triggering sleep.
        val inSleepContext = prevStage != SleepStage.AWAKE
        val verySlowHr = rrInterval in 950f..1500f  // 40–63 bpm, valid physiological range
        if (!inSleepContext && !verySlowHr) return SleepStage.AWAKE

        // REM: RR interval elevated above resting (>1100ms ≈ <55 bpm with high variability)
        return if (rrInterval > 1100f) SleepStage.REM else SleepStage.DEEP
    }

    // ── Sleep score ───────────────────────────────────────────────────────────

    /**
     * Sleep quality score 0–100.
     * Duration component: 8-hour baseline. Efficiency and stage composition modulate.
     */
    fun calculateSleepScore(
        deepMinutes: Int,
        remMinutes: Int,
        totalMinutes: Int,
        efficiency: Float,
    ): Int {
        if (totalMinutes <= 0) return 0
        val durationScore = ((totalMinutes / 480f) * 100f).coerceIn(0f, 100f)
        val stageScore = ((deepMinutes + remMinutes).toFloat() / totalMinutes * 100f).coerceIn(0f, 100f)
        val effScore = (efficiency * 100f).coerceIn(0f, 100f)
        return ((durationScore * 0.5f + stageScore * 0.3f + effScore * 0.2f)
            .coerceIn(0f, 100f))
            .roundToInt()
    }

    // ── SpO2 ──────────────────────────────────────────────────────────────────

    /** 5-minute rolling average; rejects physiologically impossible values. */
    fun calculateSpO2Average(readings: List<Float>): Float {
        val valid = readings.filter { it in 90f..100f }
        return if (valid.isEmpty()) 0f else valid.average().toFloat()
    }

    /**
     * SpO2 from raw red/IR PPG ADC values via Beer-Lambert law.
     * R = (AC_red/DC_red) / (AC_ir/DC_ir).
     * Calibration: SpO2 = -45.060*R² + 30.354*R + 94.845 (Maxim AN6166).
     * Returns null if data is insufficient or result is physiologically impossible.
     */
    fun computeSpO2(redSamples: List<Float>, irSamples: List<Float>): Float? {
        if (redSamples.size < 10 || irSamples.size < 10) return null
        val redDc = redSamples.average().toFloat()
        val irDc  = irSamples.average().toFloat()
        if (redDc <= 0f || irDc <= 0f) return null
        val redAc = redSamples.max() - redSamples.min()
        val irAc  = irSamples.max()  - irSamples.min()
        if (irAc <= 0f) return null
        val r = (redAc / redDc) / (irAc / irDc)
        val spo2 = -45.060f * r * r + 30.354f * r + 94.845f
        return if (spo2 in 90f..100f) spo2 else null
    }

    // ── PPG peak detection (RR intervals from K=20 optical IR channel) ────────

    /**
     * Detects cardiac peaks in a PPG IR signal and returns RR intervals.
     * z-score normalise → 5-point moving-average smooth → local maxima >0.3σ
     * with 300ms minimum gap. Only peaks after lastPeakTimeMs are new;
     * RR = timestamp difference between consecutive accepted peaks.
     */
    fun detectPpgRrIntervals(
        irSamples: List<Float>,
        sampleTimes: List<Long>,
        lastPeakTimeMs: Long,
    ): List<Pair<Float, Long>> {
        if (irSamples.size < 50 || irSamples.size != sampleTimes.size) return emptyList()
        val mean = irSamples.average().toFloat()
        val variance = irSamples.map { (it - mean) * (it - mean) }.average().toFloat()
        val std = sqrt(variance).coerceAtLeast(1f)
        val normalized = irSamples.map { (it - mean) / std }
        val smoothed = normalized.indices.map { i ->
            val lo = maxOf(0, i - 2); val hi = minOf(normalized.size - 1, i + 2)
            normalized.subList(lo, hi + 1).average().toFloat()
        }
        val peaks = mutableListOf<Int>()
        for (i in 2 until smoothed.size - 2) {
            if (smoothed[i] < 0.3f) continue
            if (smoothed[i] <= smoothed[i - 1] || smoothed[i] <= smoothed[i - 2]) continue
            if (smoothed[i] <= smoothed[i + 1] || smoothed[i] <= smoothed[i + 2]) continue
            if (peaks.isNotEmpty() && sampleTimes[i] - sampleTimes[peaks.last()] < 300L) {
                if (smoothed[i] > smoothed[peaks.last()]) peaks[peaks.size - 1] = i
            } else {
                peaks.add(i)
            }
        }
        val result = mutableListOf<Pair<Float, Long>>()
        var prevPeakMs = lastPeakTimeMs
        for (peakIdx in peaks) {
            val t = sampleTimes[peakIdx]
            if (t <= lastPeakTimeMs) { prevPeakMs = t; continue }
            if (prevPeakMs > 0L) {
                val rr = (t - prevPeakMs).toFloat()
                if (rr in 300f..2000f) result.add(Pair(rr, t))
            }
            prevPeakMs = t
        }
        return result
    }

    // ── Respiratory rate (RSA autocorrelation) ────────────────────────────────

    /**
     * Estimate respiratory rate (breaths/min) from RR intervals via RSA.
     * Breathing modulates RR intervals at 0.15–0.4 Hz (respiratory sinus arrhythmia).
     * Autocorrelation finds the dominant oscillation lag; lag × mean_RR = cycle duration.
     * Requires ≥ 32 valid RR intervals (~30s at rest). Returns null if insufficient data.
     */
    fun estimateRespiratoryRate(rrIntervalsMs: List<Float>): Float? {
        val valid = rrIntervalsMs.filter { it in 300f..2000f }
        if (valid.size < 32) return null
        val rr = valid.takeLast(minOf(valid.size, 120))
        val mean = rr.average().toFloat()
        val detrended = rr.map { it - mean }
        // Lag range 2–20 beats covers ~3–30 breaths/min at typical resting HR
        var bestLag = -1; var bestCorr = Float.MIN_VALUE
        for (lag in 2..minOf(20, rr.size / 3)) {
            var corr = 0f
            for (i in 0 until rr.size - lag) corr += detrended[i] * detrended[i + lag]
            if (corr > bestCorr) { bestCorr = corr; bestLag = lag }
        }
        if (bestLag < 2 || bestCorr <= 0f) return null
        val rpm = 60_000f / (bestLag * mean)
        return if (rpm in 6f..30f) (rpm * 10).toInt() / 10f else null
    }

    // ── Label helpers ─────────────────────────────────────────────────────────

    fun getRecoveryLevel(score: Int): String = when {
        score >= 67 -> "In the Green"
        score >= 34 -> "In the Yellow"
        else        -> "In the Red"
    }

    fun getStrainLevel(score: Float): String = when {
        score > 14f  -> "high"
        score >= 10f -> "moderate"
        else         -> "low"
    }

    /** Whoop 5.0 rated at 14-day battery life. */
    fun estimatedBatteryDays(percent: Int): Float =
        (percent / 100.0 * 14.0).let { (it * 10).roundToInt() / 10f }
}
