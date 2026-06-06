/**
 * WhoopGattProfile.kt
 * All Whoop 5.0 GATT UUIDs, packet-type constants, command codes, and CRC functions.
 * Source: bWanShiTong/openwhoop, madhursatija/whoof PROTOCOL.md, jogolden/whoomp.
 * CRC-8 (poly 0x07) covers the 2-byte length field in each frame header.
 * CRC-32 (reflected 0xEDB88320) covers the full body bytes.
 */
package com.peretarrida.fittracker.plugins.whoop

import java.util.UUID

object WhoopGattProfile {

    // ── Primary service ──────────────────────────────────────────────────────
    val SERVICE_UUID: UUID = UUID.fromString("61080001-8d6d-82b8-614a-1c8cb0f8dcc6")

    // ── Characteristics ───────────────────────────────────────────────────────
    /** Write: commands sent from host to strap */
    val CHAR_CMD_TO_STRAP: UUID   = UUID.fromString("61080002-8d6d-82b8-614a-1c8cb0f8dcc6")
    /** Notify: command responses from strap */
    val CHAR_CMD_FROM_STRAP: UUID = UUID.fromString("61080003-8d6d-82b8-614a-1c8cb0f8dcc6")
    /** Notify: events (connect/disconnect/alerts) */
    val CHAR_EVENTS: UUID         = UUID.fromString("61080004-8d6d-82b8-614a-1c8cb0f8dcc6")
    /** Notify: real-time + historical biometric data (primary data stream) */
    val CHAR_DATA: UUID           = UUID.fromString("61080005-8d6d-82b8-614a-1c8cb0f8dcc6")
    /** Notify: diagnostics / memfault crash data */
    val CHAR_MEMFAULT: UUID       = UUID.fromString("61080007-8d6d-82b8-614a-1c8cb0f8dcc6")

    // ── Standard BLE descriptor for enabling notifications ────────────────────
    val CCCD_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

    // ── Packet types (first byte of body) ─────────────────────────────────────
    const val PKT_COMMAND: Byte           = 0x23  // host → strap command wrapper
    const val PKT_COMMAND_RESPONSE: Byte  = 0x24  // strap → host response
    const val PKT_REALTIME_DATA: Byte     = 0x28  // HR + RR intervals (real-time)
    const val PKT_REALTIME_RAW: Byte      = 0x2B  // IMU / optical PPG
    const val PKT_HISTORICAL: Byte        = 0x2F  // historical biometric records
    const val PKT_EVENT: Byte             = 0x30  // strap event notification
    const val PKT_METADATA: Byte          = 0x31  // history-dump state machine control
    const val PKT_IMU_STREAM: Byte        = 0x33  // realtime IMU stream
    const val PKT_HISTORICAL_IMU: Byte    = 0x34  // historical IMU stream

    // ── Command numbers (second body byte after type + seq) ───────────────────
    const val CMD_TOGGLE_REALTIME_HR: Byte  = 0x03
    const val CMD_SET_CLOCK: Byte           = 0x0A
    const val CMD_GET_CLOCK: Byte           = 0x0B
    const val CMD_SEND_HISTORICAL: Byte     = 0x16
    const val CMD_HISTORICAL_RESULT: Byte   = 0x17
    const val CMD_GET_BATTERY: Byte         = 0x1A.toByte()
    const val CMD_GET_HELLO: Byte           = 0x23

    // ── Metadata subtypes ─────────────────────────────────────────────────────
    const val META_HISTORY_START: Byte    = 0x01
    const val META_HISTORY_END: Byte      = 0x02
    const val META_HISTORY_COMPLETE: Byte = 0x03

    // ── Frame constants ───────────────────────────────────────────────────────
    const val SOF: Byte = 0xAA.toByte()
    const val FRAME_HEADER_SIZE = 4   // SOF + 2 len + CRC-8
    const val FRAME_FOOTER_SIZE = 4   // CRC-32

    // ── Railway endpoint — set this to your deployed backend URL ─────────────
    const val RAILWAY_BASE_URL = "https://YOUR_RAILWAY_URL.railway.app"
    const val INGEST_PATH = "/ingest"

    // ── CRC-8 (polynomial 0x07, init 0x00, no reflection) ────────────────────
    fun crc8(bytes: ByteArray): Byte {
        var crc = 0
        for (b in bytes) {
            crc = crc xor (b.toInt() and 0xFF)
            repeat(8) {
                crc = if (crc and 0x80 != 0) (crc shl 1) xor 0x07 else crc shl 1
            }
        }
        return (crc and 0xFF).toByte()
    }

    // ── CRC-32 (reflected poly 0xEDB88320, init 0xFFFFFFFF, finalXor 0xFFFFFFFF) ──
    fun crc32(bytes: ByteArray): Int {
        var crc = 0xFFFFFFFF.toInt()
        for (b in bytes) {
            crc = crc xor (b.toInt() and 0xFF)
            repeat(8) {
                crc = if (crc and 1 != 0) (crc ushr 1) xor 0xEDB88320.toInt() else crc ushr 1
            }
        }
        return crc xor 0xFFFFFFFF.toInt()
    }

    /** Build a complete BLE frame for a command body. */
    fun buildFrame(body: ByteArray): ByteArray {
        val len = (body.size + FRAME_FOOTER_SIZE).toShort()
        val lenBytes = byteArrayOf((len.toInt() and 0xFF).toByte(), ((len.toInt() shr 8) and 0xFF).toByte())
        val headerCrc = crc8(lenBytes)
        val bodyCrc32 = crc32(body)
        return byteArrayOf(SOF, lenBytes[0], lenBytes[1], headerCrc) +
            body +
            byteArrayOf(
                (bodyCrc32 and 0xFF).toByte(),
                ((bodyCrc32 shr 8) and 0xFF).toByte(),
                ((bodyCrc32 shr 16) and 0xFF).toByte(),
                ((bodyCrc32 shr 24) and 0xFF).toByte(),
            )
    }

    private var _seqNum: Int = 0
    fun nextSeq(): Byte = (_seqNum++ and 0xFF).toByte()
}
