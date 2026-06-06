/**
 * WhoopBleHandler.kt
 * Processes BLE notification bytes and the historical data dump state machine.
 * Called by WhoopBleManager on each notification from the DATA/EVENT characteristics.
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

    fun handleRaw(raw: ByteArray) {
        val body = WhoopPacketDecoder.validateFrame(raw) ?: return
        if (body.isEmpty()) return
        when (body[0]) {
            WhoopGattProfile.PKT_REALTIME_DATA -> {
                WhoopPacketDecoder.decodeRealtime(body)?.let { buffers.ingestReading(it) }
            }
            WhoopGattProfile.PKT_IMU_STREAM,
            WhoopGattProfile.PKT_REALTIME_RAW -> {
                WhoopPacketDecoder.decodeImu(body)?.let { accel ->
                    buffers.ingestReading(BiometricReading(
                        heartRate = buffers.latestHr, rrIntervalMs = 0f,
                        spO2 = 0f, skinTempCelsius = 0f,
                        accelX = accel.first, accelY = accel.second, accelZ = accel.third,
                        timestamp = System.currentTimeMillis(),
                    ))
                }
            }
            WhoopGattProfile.PKT_HISTORICAL -> {
                if (dumpInProgress) histBuffer.add(raw)
            }
            WhoopGattProfile.PKT_METADATA -> handleMetadata(body)
            WhoopGattProfile.PKT_COMMAND_RESPONSE -> {
                if (body.size > 2 && body[2] == WhoopGattProfile.CMD_GET_BATTERY) {
                    WhoopPacketDecoder.decodeBattery(body)?.let { buffers.ingestBattery(it) }
                }
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
            }
            WhoopGattProfile.META_HISTORY_END -> {
                val trim = if (body.size >= 7) body.sliceArray(3..6) else byteArrayOf(0, 0, 0, 0)
                val ackPayload = byteArrayOf(0x01) + trim + byteArrayOf(0, 0, 0, 0)
                sendCommand(WhoopGattProfile.CMD_HISTORICAL_RESULT, ackPayload)
            }
        }
    }
}
