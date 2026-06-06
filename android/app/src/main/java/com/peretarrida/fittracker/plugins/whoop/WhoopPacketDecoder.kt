/**
 * WhoopPacketDecoder.kt
 * Decodes raw BLE notification bytes into typed data objects.
 * Frame format: [0xAA][len_lo][len_hi][CRC-8 of len][body][CRC-32 of body]
 * Historical (0x2F) body layout from bWanShiTong/reverse-engineering-whoop:
 *   +0  4B prefix/flags
 *   +4  u32le unix_seconds
 *   +8  u16le subseconds
 *   +10 u32le flash_index
 *   +14 u8    heart_rate_bpm
 *   +15 u8    rrnum (0–4)
 *   +16 u16le[rrnum] rr_intervals_ms
 * Validates both CRC-8 (header) and CRC-32 (body) before any decode.
 * Returns null on validation failure; never throws on malformed input.
 */
package com.peretarrida.fittracker.plugins.whoop

import android.util.Log

object WhoopPacketDecoder {

    private const val TAG = "WhoopDecoder"
    private const val MIN_HIST_BODY = 16  // minimum historical body bytes (no RR)
    private const val MIN_RT_BODY   = 2   // minimum realtime body bytes

    // ── Frame validation ───────────────────────────────────────────────────────

    /**
     * Validate a raw BLE notification frame.
     * Returns the body bytes (without frame header/footer) or null on CRC failure.
     */
    fun validateFrame(raw: ByteArray): ByteArray? {
        return try {
            if (raw.size < WhoopGattProfile.FRAME_HEADER_SIZE + WhoopGattProfile.FRAME_FOOTER_SIZE) {
                return null
            }
            if (raw[0] != WhoopGattProfile.SOF) return null

            val lenBytes = raw.sliceArray(1..2)
            val expectedHeaderCrc = WhoopGattProfile.crc8(lenBytes)
            if (raw[3] != expectedHeaderCrc) {
                Log.w(TAG, "CRC-8 header mismatch")
                return null
            }

            val bodyLen = ((raw[2].toInt() and 0xFF) shl 8) or (raw[1].toInt() and 0xFF)
            val body = raw.sliceArray(
                WhoopGattProfile.FRAME_HEADER_SIZE until
                WhoopGattProfile.FRAME_HEADER_SIZE + bodyLen - WhoopGattProfile.FRAME_FOOTER_SIZE
            )
            val crc32Offset = WhoopGattProfile.FRAME_HEADER_SIZE + body.size
            val actualCrc = (raw[crc32Offset].toInt() and 0xFF) or
                ((raw[crc32Offset + 1].toInt() and 0xFF) shl 8) or
                ((raw[crc32Offset + 2].toInt() and 0xFF) shl 16) or
                ((raw[crc32Offset + 3].toInt() and 0xFF) shl 24)
            val expectedCrc = WhoopGattProfile.crc32(body)
            if (actualCrc != expectedCrc) {
                Log.w(TAG, "CRC-32 body mismatch")
                return null
            }
            body
        } catch (e: Exception) {
            Log.e(TAG, "validateFrame: ${e.message}")
            null
        }
    }

    // ── Historical data (type 0x2F) ───────────────────────────────────────────

    fun decodeHistorical(body: ByteArray): HistoricalEntry? {
        return try {
            if (body.size < MIN_HIST_BODY) return null
            // body[0] = PKT_HISTORICAL, body[1] = seqNum, body[2] = cmdNum, body[3..] = payload
            val payload = body.sliceArray(3 until body.size)
            if (payload.size < 13) return null  // prefix(4)+ts(4)+subsec(2)+flash(4)+hr(1) = 15 min

            val unixSec = readU32LE(payload, 4)
            val hr = payload[14].toInt() and 0xFF
            val rrCount = (payload[15].toInt() and 0xFF).coerceIn(0, 4)
            val rrs = mutableListOf<Float>()
            for (i in 0 until rrCount) {
                val off = 16 + i * 2
                if (off + 1 < payload.size) {
                    rrs.add(readU16LE(payload, off).toFloat())
                }
            }
            if (hr !in 20..250) return null  // reject out-of-range
            HistoricalEntry(unixSeconds = unixSec, heartRateBpm = hr, rrIntervals = rrs)
        } catch (e: Exception) {
            Log.e(TAG, "decodeHistorical: ${e.message}")
            null
        }
    }

    // ── Real-time data (type 0x28) ────────────────────────────────────────────

    /**
     * Decode a REALTIME_DATA packet (HR + RR, no timestamp).
     * Layout inferred from whoof PROTOCOL.md and whoomp.js.
     * Body payload: [hr_bpm u8][rrnum u8][rr u16le × rrnum]
     */
    fun decodeRealtime(body: ByteArray): BiometricReading? {
        return try {
            if (body.size < 3 + MIN_RT_BODY) return null
            val payload = body.sliceArray(3 until body.size)
            if (payload.isEmpty()) return null
            val hr = payload[0].toInt() and 0xFF
            if (hr !in 20..250) return null
            val rrCount = if (payload.size > 1) (payload[1].toInt() and 0xFF).coerceIn(0, 4) else 0
            var firstRr = 0f
            if (rrCount > 0 && payload.size >= 4) {
                firstRr = readU16LE(payload, 2).toFloat()
                if (firstRr !in 200f..2000f) firstRr = 0f
            }
            BiometricReading(
                heartRate = hr, rrIntervalMs = firstRr, spO2 = 0f, skinTempCelsius = 0f,
                accelX = 0f, accelY = 0f, accelZ = 0f,
                timestamp = System.currentTimeMillis(),
            )
        } catch (e: Exception) {
            Log.e(TAG, "decodeRealtime: ${e.message}")
            null
        }
    }

    // ── IMU stream (type 0x2B / 0x33) ────────────────────────────────────────

    /**
     * Extract accelerometer magnitude from raw IMU packet.
     * Layout: 100 int16LE samples per axis (X/Y/Z), 3900 LSB/g, ±8g range.
     * Returns Triple(x,y,z) in g from the last sample in the packet.
     */
    fun decodeImu(body: ByteArray): Triple<Float, Float, Float>? {
        return try {
            val payload = body.sliceArray(3 until body.size)
            if (payload.size < 6) return null
            val lsbPerG = 3900f
            // last sample = last 6 bytes (3 axes × 2 bytes each)
            val off = payload.size - 6
            val x = readS16LE(payload, off) / lsbPerG
            val y = readS16LE(payload, off + 2) / lsbPerG
            val z = readS16LE(payload, off + 4) / lsbPerG
            Triple(x, y, z)
        } catch (e: Exception) {
            Log.e(TAG, "decodeImu: ${e.message}")
            null
        }
    }

    // ── Battery response ─────────────────────────────────────────────────────

    /**
     * Parse GET_BATTERY_LEVEL response.
     * From whoof PROTOCOL.md: battery value × 10 at payload offset 2.
     */
    fun decodeBattery(body: ByteArray): BatteryReading? {
        return try {
            val payload = body.sliceArray(3 until body.size)
            if (payload.size < 3) return null
            val raw = payload[2].toInt() and 0xFF
            val percent = (raw / 10).coerceIn(0, 100)
            val charging = payload.size > 3 && (payload[3].toInt() and 0x01) != 0
            BatteryReading(percent = percent, charging = charging)
        } catch (e: Exception) {
            Log.e(TAG, "decodeBattery: ${e.message}")
            null
        }
    }

    // ── Historical dump — aggregate multiple packets ───────────────────────────

    fun parseHistoricalDump(packets: List<ByteArray>): List<BiometricReading> {
        return packets.mapNotNull { raw ->
            val body = validateFrame(raw) ?: return@mapNotNull null
            if (body.isEmpty() || body[0] != WhoopGattProfile.PKT_HISTORICAL) return@mapNotNull null
            val entry = decodeHistorical(body) ?: return@mapNotNull null
            BiometricReading(
                heartRate = entry.heartRateBpm,
                rrIntervalMs = entry.rrIntervals.firstOrNull() ?: 0f,
                spO2 = 0f, skinTempCelsius = 0f,
                accelX = 0f, accelY = 0f, accelZ = 0f,
                timestamp = entry.unixSeconds * 1000L,
            )
        }
    }

    // ── Little-endian helpers (inline for line-count) ─────────────────────────
    private fun readU32LE(b: ByteArray, off: Int): Long = (b[off].toLong() and 0xFF) or
        ((b[off+1].toLong() and 0xFF) shl 8) or ((b[off+2].toLong() and 0xFF) shl 16) or
        ((b[off+3].toLong() and 0xFF) shl 24)
    private fun readU16LE(b: ByteArray, off: Int): Int =
        (b[off].toInt() and 0xFF) or ((b[off+1].toInt() and 0xFF) shl 8)
    private fun readS16LE(b: ByteArray, off: Int): Short =
        ((b[off+1].toInt() shl 8) or (b[off].toInt() and 0xFF)).toShort()
}
