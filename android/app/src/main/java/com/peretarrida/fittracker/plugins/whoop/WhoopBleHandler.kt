/**
 * WhoopBleHandler.kt
 * Processes BLE notification bytes and the historical data dump state machine.
 * Called by WhoopBleService on each notification from the DATA/EVENT characteristics.
 * Keeps histBuffer during a dump and sends the ACK when HISTORY_END is received.
 * Imports: WhoopGattProfile, WhoopPacketDecoder, WhoopBleBuffers, BiometricReading
 */
package com.peretarrida.fittracker.plugins.whoop

import android.util.Log

class WhoopBleHandler(
    private val buffers: WhoopBleBuffers,
    private val sendCommand: (Byte, ByteArray) -> Unit,
) {
    private val TAG = "WhoopBleHandler"
    private val histBuffer = mutableListOf<ByteArray>()
    var dumpInProgress = false
    // Set by WhoopBleService to re-enable the realtime stream after historical sync completes.
    // Historical sync pauses K=10 streaming; the callback restarts it with correct timing.
    var onHistoricalSyncComplete: (() -> Unit)? = null

    fun handleRaw(raw: ByteArray) {
        val body = WhoopPacketDecoder.validateFrame(raw) ?: run {
            Log.w(TAG, "validateFrame null len=${raw.size} hex=${raw.take(8).joinToString(""){"%02x".format(it)}}")
            return
        }
        if (body.isEmpty()) return
        Log.d(TAG, "frame OK type=0x${"%02x".format(body[0])} size=${body.size}")
        when (body[0]) {
            WhoopGattProfile.PKT_REALTIME_DATA -> {
                val packetK = if (body.size > 1) body[1].toInt() and 0xFF else 0
                if (packetK == 17) {
                    // R17 "optical or labrador filtered" — the exclusive source of RR intervals.
                    // goose hrv_plan_from_row (metric_features.rs) only matches R17; K=10 and
                    // 0x2A37 never produce valid HRV in the Whoop 5 optical pipeline.
                    val rrs = WhoopPacketDecoder.decodeR17RrIntervals(body)
                    for (rr in rrs) {
                        buffers.ingestReading(BiometricReading(
                            heartRate = buffers.latestHr,
                            rrIntervalMs = rr,
                            spO2 = 0f, skinTempCelsius = 0f,
                            accelX = 0f, accelY = 0f, accelZ = 0f,
                            timestamp = System.currentTimeMillis(),
                        ))
                    }
                } else {
                    WhoopPacketDecoder.decodeRealtime(body)?.let { reading ->
                        buffers.ingestReading(reading)
                        if (reading.heartRate > 0) WhoopPlugin.emitHeartRate(reading.heartRate)
                    }
                }
            }
            WhoopGattProfile.PKT_IMU_STREAM,
            WhoopGattProfile.PKT_REALTIME_RAW -> {
                val packetK = if (body.size > 1) body[1].toInt() and 0xFF else 0
                if (packetK == 0x14 || packetK == 0x15) {
                    // K=20 (persistent_r20) / K=21 (persistent_r21): optical PPG stream
                    WhoopPacketDecoder.decodeOptical(body)?.let { samples ->
                        buffers.ingestOptical(samples)
                        // K=20 IR channel drives PPG peak detection for RR intervals.
                        // K=21 excluded: different gain/offset would corrupt the normalized signal.
                        if (packetK == 0x14) buffers.ingestPpgForRr(samples)
                    }
                } else {
                    // K=10 and others: IMU/motion stream with embedded HR.
                    // Bytes 18-19 are NOT RR intervals in motion packets — they follow
                    // an N×256+1 counter pattern that produces garbage RMSSD values.
                    // Real RR intervals come from the standard BLE 0x2A37 characteristic.
                    val embeddedHr = if (body.size >= 18) body[17].toInt() and 0xFF else 0
                    WhoopPacketDecoder.decodeImu(body)?.let { accel ->
                        buffers.ingestReading(BiometricReading(
                            heartRate = if (embeddedHr in 20..250) embeddedHr else buffers.latestHr,
                            rrIntervalMs = 0f,
                            spO2 = 0f, skinTempCelsius = 0f,
                            accelX = accel.first, accelY = accel.second, accelZ = accel.third,
                            timestamp = System.currentTimeMillis(),
                        ))
                    }
                    if (embeddedHr in 20..250) WhoopPlugin.emitHeartRate(embeddedHr)
                }
            }
            WhoopGattProfile.PKT_HISTORICAL -> {
                if (dumpInProgress) histBuffer.add(raw)
            }
            WhoopGattProfile.PKT_METADATA -> handleMetadata(body)
            WhoopGattProfile.PKT_EVENT -> {
                // 0x30 — device-initiated events (sensor readings, alerts, state changes).
                // Logging full body to discover temperature and other sensor packets.
                val hex = body.joinToString("") { "%02x".format(it) }
                Log.i("WhoopTemp", "PKT_EVENT size=${body.size} hex=$hex")
            }
            WhoopGattProfile.PKT_COMMAND_RESPONSE -> {
                if (body.size > 2 && body[2] == WhoopGattProfile.CMD_GET_BATTERY)
                    WhoopPacketDecoder.decodeBattery(body)?.let { buffers.ingestBattery(it) }
                else {
                    // Log ALL command responses fully — temperature may come as a cmd response
                    val cmd = if (body.size > 2) "0x%02x".format(body[2]) else "?"
                    val hex = body.take(32).joinToString("") { "%02x".format(it) }
                    Log.i("WhoopTemp", "CMD_RESP cmd=$cmd size=${body.size} hex=$hex")
                }
            }
            else -> {
                val hex = body.take(32).joinToString("") { "%02x".format(it) }
                Log.i("WhoopTemp", "UNKNOWN type=0x${"%02x".format(body[0])} size=${body.size} hex=$hex")
            }
        }
    }

    private fun handleMetadata(body: ByteArray) {
        if (body.size < 3) return
        when (body[2]) {
            WhoopGattProfile.META_HISTORY_START -> {
                Log.d(TAG, "History dump started")
                dumpInProgress = true
                histBuffer.clear()
            }
            WhoopGattProfile.META_HISTORY_COMPLETE -> {
                dumpInProgress = false
                val readings = WhoopPacketDecoder.parseHistoricalDump(histBuffer.toList())
                readings.forEach { buffers.ingestReading(it) }
                Log.i(TAG, "Historical dump: ${readings.size} records imported")
                histBuffer.clear()
                // Emit most recent HR so UI stops showing "waiting for data" immediately
                if (buffers.latestHr > 0) WhoopPlugin.emitHeartRate(buffers.latestHr)
                // Re-start the realtime stream via the service callback (handles 250ms spacing)
                onHistoricalSyncComplete?.invoke()
                Log.i(TAG, "Historical sync complete — realtime stream restart scheduled")
            }
            WhoopGattProfile.META_HISTORY_END -> {
                // Goose historicalDataResultPayload: [0x01] + body[13..<21] (8 bytes).
                // Previous bug used body[3..6] — device rejected the wrong ACK, META_HISTORY_COMPLETE never arrived.
                if (body.size > 21) {
                    val ackPayload = byteArrayOf(0x01) + body.sliceArray(13 until 21)
                    sendCommand(WhoopGattProfile.CMD_HISTORICAL_RESULT, ackPayload)
                    Log.d(TAG, "Historical ACK sent: ${ackPayload.joinToString(""){"%02x".format(it)}}")
                } else {
                    Log.w(TAG, "META_HISTORY_END body too short for ACK: size=${body.size}, skipping")
                }
            }
        }
    }
}
