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
                WhoopPacketDecoder.decodeRealtime(body)?.let { reading ->
                    buffers.ingestReading(reading)
                    if (reading.heartRate > 0) WhoopPlugin.emitHeartRate(reading.heartRate)
                }
            }
            WhoopGattProfile.PKT_IMU_STREAM,
            WhoopGattProfile.PKT_REALTIME_RAW -> {
                // K=10 raw motion frames embed HR at body[17] — same layout as PKT_REALTIME_DATA K=10
                val embeddedHr = if (body.size >= 18) body[17].toInt() and 0xFF else 0
                val embeddedRr = if (body.size >= 20) {
                    val raw = WhoopPacketDecoder.readU16LE(body, 18)
                    val ms = raw * 1000f / 1024f
                    if (ms in 200f..2000f) ms else 0f
                } else 0f
                WhoopPacketDecoder.decodeImu(body)?.let { accel ->
                    buffers.ingestReading(BiometricReading(
                        heartRate = if (embeddedHr in 20..250) embeddedHr else buffers.latestHr,
                        rrIntervalMs = embeddedRr,
                        spO2 = 0f, skinTempCelsius = 0f,
                        accelX = accel.first, accelY = accel.second, accelZ = accel.third,
                        timestamp = System.currentTimeMillis(),
                    ))
                }
                if (embeddedHr in 20..250) WhoopPlugin.emitHeartRate(embeddedHr)
            }
            WhoopGattProfile.PKT_HISTORICAL -> {
                if (dumpInProgress) histBuffer.add(raw)
            }
            WhoopGattProfile.PKT_METADATA -> handleMetadata(body)
            WhoopGattProfile.PKT_COMMAND_RESPONSE -> {
                if (body.size > 2 && body[2] == WhoopGattProfile.CMD_GET_BATTERY)
                    WhoopPacketDecoder.decodeBattery(body)?.let { buffers.ingestBattery(it) }
                else
                    Log.v(TAG, "cmd_resp cmd=0x${if(body.size>2)"%02x".format(body[2]) else "?"} size=${body.size}")
            }
            else -> Log.w(TAG, "unknown type=0x${"%02x".format(body[0])} hex=${body.take(16).joinToString(""){"%02x".format(it)}}")
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
