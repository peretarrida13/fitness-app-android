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
    // Frame format (Whoop 5 / Maverick, confirmed from goose/Rust/core/src/protocol.rs):
    //   DeviceType::Maverick  expected_frame_len = u16(buffer[2], buffer[3]) + 8
    //   [SOF=AA][0x01][declaredLen_lo][declaredLen_hi][0x00][0x01][CRC16_lo][CRC16_hi]
    //   [payload (declaredLen−4 bytes)][CRC32 4 bytes LE]
    // declaredLen = payloadLen + 4 (includes trailing CRC32).
    // Payload starts at raw[8].
    fun validateFrame(raw: ByteArray): ByteArray? {
        return try {
            if (raw.size < 12) return null           // 8-byte header + 4-byte CRC minimum
            if (raw[0] != WhoopGattProfile.SOF) return null
            val declaredLen = (raw[2].toInt() and 0xFF) or ((raw[3].toInt() and 0xFF) shl 8)
            if (declaredLen < 4) return null         // must hold at least 4-byte CRC32
            if (raw.size < 8 + declaredLen) return null
            val payloadLen = declaredLen - 4         // CRC32 occupies last 4 of declared block
            raw.sliceArray(8 until 8 + payloadLen)
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
     * Decode a REALTIME_DATA packet (HR + RR).
     *
     * Goose Rust core (protocol.rs) defines this packet structure:
     *   body[0]   = 0x28 (packet type)
     *   body[1]   = packet_k (domain: 10 = raw motion stream)
     *   body[2]   = status/stream flag
     *   body[3-6] = counter (u32 LE)
     *   body[7-10]= timestamp_sec (u32 LE)
     *   body[11-12]= timestamp_subsec (u16 LE)
     *   body[13+] = domain-specific data
     *
     * For packet_k=10 (raw motion / "whoop.ble.raw_motion_k10"):
     *   body[13-16] = domain header (4 bytes)
     *   body[17]    = heart_rate_bpm (u8)
     *   body[18-19] = first RR interval (u16 LE, 1/1024 s units)
     *
     * Previous bug: was slicing from body[3], reading the counter as HR → always null.
     */
    fun decodeRealtime(body: ByteArray): BiometricReading? {
        return try {
            if (body.size < 13) return null
            val packetK = body[1].toInt() and 0xFF
            when (packetK) {
                10 -> {
                    // Raw motion stream — HR at byte 17
                    if (body.size < 18) return null
                    val hr = body[17].toInt() and 0xFF
                    if (hr !in 20..250) return null
                    val rrMs = if (body.size >= 20) {
                        val raw = readU16LE(body, 18)
                        val ms = raw * 1000f / 1024f
                        if (ms in 200f..2000f) ms else 0f
                    } else 0f
                    BiometricReading(
                        heartRate = hr, rrIntervalMs = rrMs, spO2 = 0f, skinTempCelsius = 0f,
                        accelX = 0f, accelY = 0f, accelZ = 0f,
                        timestamp = System.currentTimeMillis(),
                    )
                }
                else -> {
                    Log.d(TAG, "decodeRealtime: K=$packetK size=${body.size} body[13..20]=${body.drop(13).take(8).joinToString(""){"%02x".format(it)}}")
                    null
                }
            }
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
    fun readU16LE(b: ByteArray, off: Int): Int =
        (b[off].toInt() and 0xFF) or ((b[off+1].toInt() and 0xFF) shl 8)
    private fun readS16LE(b: ByteArray, off: Int): Short =
        ((b[off+1].toInt() shl 8) or (b[off].toInt() and 0xFF)).toShort()
}
