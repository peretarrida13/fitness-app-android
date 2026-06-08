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
                    // Raw motion stream — HR at byte 17.
                    // Bytes 18-19 are NOT RR intervals (they follow an N×256+1 pattern
                    // that is part of the motion domain payload, not inter-beat timing).
                    // Use decodeStandardHrs() on the 0x2A37 characteristic for real RR data.
                    if (body.size < 18) return null
                    val hr = body[17].toInt() and 0xFF
                    if (hr !in 20..250) return null
                    BiometricReading(
                        heartRate = hr, rrIntervalMs = 0f, spO2 = 0f, skinTempCelsius = 0f,
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

    // ── Optical / PPG data (type 0x2B, K=20/21) ──────────────────────────────

    /**
     * Raw optical sample from the Whoop PPG sensor.
     * ADC values are 24-bit unsigned LE. Zero means channel not present.
     */
    data class OpticalSample(val green: Int, val red: Int, val ir: Int)

    /**
     * Decode K=20 or K=21 optical packet from startPhysiologyCapture stream.
     * Format: standard 13-byte realtime header + N × [green:3B][red:3B][ir:3B] triplets.
     * Returns null if data is too short or contains only zeros (optical not yet active).
     * Log the raw bytes if decode fails so the format can be confirmed from Logcat.
     */
    fun decodeOptical(body: ByteArray): List<OpticalSample>? {
        if (body.size < 22) {
            Log.d(TAG, "optical pkt too short: ${body.size}B k=${body.getOrElse(1){0}.toInt() and 0xFF}")
            return null
        }
        // Dump first 80 bytes of every K=20 body for temperature investigation
        if ((body.getOrElse(1) { 0 }.toInt() and 0xFF) == 0x14) {
            val hex80 = body.take(80).joinToString("") { "%02x".format(it) }
            Log.i("WhoopTemp", "K20_BODY size=${body.size} first80=$hex80")
        }
        val samples = mutableListOf<OpticalSample>()
        var offset = 13
        while (offset + 8 < body.size) {
            val g = read24BitLE(body, offset)
            val r = read24BitLE(body, offset + 3)
            val ir = read24BitLE(body, offset + 6)
            if (g > 0 || r > 0 || ir > 0) samples.add(OpticalSample(g, r, ir))
            offset += 9
        }
        if (samples.isEmpty()) {
            val hex = body.drop(13).take(18).joinToString("") { "%02x".format(it) }
            Log.d(TAG, "optical: no samples k=${body.getOrElse(1){0}.toInt() and 0xFF} data=$hex")
            return null
        }
        val k = body.getOrElse(1) { 0 }.toInt() and 0xFF
        val gRange = samples.maxOf { it.green } - samples.minOf { it.green }
        val rRange = samples.maxOf { it.red }   - samples.minOf { it.red }
        val iRange = samples.maxOf { it.ir }    - samples.minOf { it.ir }
        val gMean  = samples.map { it.green }.average().toInt()
        val rMean  = samples.map { it.red   }.average().toInt()
        val iMean  = samples.map { it.ir    }.average().toInt()
        Log.d(TAG, "optical K=$k ${samples.size} samples | " +
              "g: mean=$gMean range=$gRange | " +
              "r: mean=$rMean range=$rRange | " +
              "ir: mean=$iMean range=$iRange")
        return samples
    }

    fun read24BitLE(b: ByteArray, off: Int): Int {
        if (off + 2 >= b.size) return 0
        return (b[off].toInt() and 0xFF) or
               ((b[off + 1].toInt() and 0xFF) shl 8) or
               ((b[off + 2].toInt() and 0xFF) shl 16)
    }

    // ── R17 "optical or labrador filtered" (K=17) ────────────────────────────
    //
    // Goose Rust core (protocol.rs parse_r17_body_summary) defines the layout:
    //   body[0]    = 0x28 (PKT_REALTIME_DATA)
    //   body[1]    = 17   (K=17)
    //   body[13..14] = flags (u16 LE)
    //   body[24..25] = sample_count (u16 LE)
    //   body[26..]   = RR interval samples, each i16 LE in milliseconds
    //
    // goose hrv_plan_from_row (metric_features.rs) exclusively uses R17 packets
    // for HRV — NOT 0x2A37 or K=10. Accepted range: 300–2000 ms.
    //
    fun decodeR17RrIntervals(body: ByteArray): List<Float> {
        if (body.size < 27) {
            Log.d(TAG, "decodeR17: too short ${body.size}B")
            return emptyList()
        }
        val sampleCount = readU16LE(body, 24).coerceIn(0, 32)
        val rrs = mutableListOf<Float>()
        for (i in 0 until sampleCount) {
            val off = 26 + i * 2
            if (off + 1 >= body.size) break
            val v = readS16LE(body, off).toInt()
            if (v in 300..2000) rrs.add(v.toFloat())
        }
        val hex = body.take(30).joinToString("") { "%02x".format(it) }
        Log.d(TAG, "decodeR17: sampleCount=$sampleCount valid=${rrs.size} body=$hex")
        return rrs
    }

    // ── Standard BLE Heart Rate Service (0x2A37) ─────────────────────────────
    //
    // Parses the standard Bluetooth HRS characteristic to get HR and RR intervals
    // at proper ~1ms resolution. Port of goose Swift parseStandardHeartRateMeasurement.
    //
    // Characteristic format (BT spec Vol 3, Part G, 3.106):
    //   byte 0    flags
    //     bit 0   HR format: 0 = 1-byte UINT8, 1 = 2-byte UINT16 LE
    //     bit 3   energy expended present
    //     bit 4   RR intervals present (1 or more UINT16 LE, units: 1/1024 s)
    //   byte 1(+) heart rate value
    //   [2 bytes] energy expended (if bit 3 set)
    //   [2 bytes × N] RR intervals (if bit 4 set), each × 1000/1024 = ms
    //
    fun decodeStandardHrs(value: ByteArray): BiometricReading? {
        return try {
            if (value.size < 2) return null
            val flags = value[0].toInt() and 0xFF
            var offset = 1
            val bpm: Int
            if (flags and 0x01 == 0) {
                bpm = value[offset].toInt() and 0xFF
                offset += 1
            } else {
                if (value.size < offset + 2) return null
                bpm = readU16LE(value, offset)
                offset += 2
            }
            if (bpm !in 20..250) return null
            if (flags and 0x08 != 0) offset += 2  // skip energy expended
            var rrMs = 0f
            if (flags and 0x10 != 0 && value.size >= offset + 2) {
                val raw = readU16LE(value, offset)
                val ms = raw * 1000f / 1024f
                if (ms in 300f..2000f) rrMs = ms
            }
            BiometricReading(
                heartRate = bpm, rrIntervalMs = rrMs, spO2 = 0f, skinTempCelsius = 0f,
                accelX = 0f, accelY = 0f, accelZ = 0f,
                timestamp = System.currentTimeMillis(),
            )
        } catch (e: Exception) {
            Log.e(TAG, "decodeStandardHrs: ${e.message}")
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
