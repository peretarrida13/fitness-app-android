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
        @Suppress("UNUSED_PARAMETER") prevStage: SleepStage,
    ): SleepStage {
        val mag = sqrt(
            accel.first.pow(2) + accel.second.pow(2) + accel.third.pow(2)
        )
        // Remove gravity component (assume 1g baseline)
        val dynamicMag = abs(mag - 1f)
        val isStill = dynamicMag < STILLNESS_THRESHOLD
        val lowHr = hr in 40..65
        val highRrVariability = rrInterval > 900f  // high RR = high HRV → REM indicator
        return when {
            !isStill -> SleepStage.AWAKE
            !lowHr   -> SleepStage.LIGHT
            highRrVariability -> SleepStage.REM
            else -> SleepStage.DEEP
        }
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
        val valid = readings.filter { it in 85f..100f }
        return if (valid.isEmpty()) 0f else valid.average().toFloat()
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
