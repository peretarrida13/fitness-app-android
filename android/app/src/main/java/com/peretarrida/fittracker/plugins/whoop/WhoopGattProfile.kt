/**
 * WhoopGattProfile.kt
 * All Whoop 5.0 GATT constants — two service families (V1: fd4b..., V2: 61080...),
 * standard BLE services (HR, Battery, DeviceInfo), SharedPreferences keys ported from
 * Goose DefaultsKey, and CRC helpers for framing proprietary commands.
 * Sources: b-nnett/goose GooseBLEClient.swift, madhursatija/whoof PROTOCOL.md
 */
package com.peretarrida.fittracker.plugins.whoop

import java.util.UUID

object WhoopGattProfile {

    // ── Whoop service UUIDs — Goose uses both; scan for either ───────────────
    val SERVICE_V1: UUID = UUID.fromString("fd4b0001-cce1-4033-93ce-002d5875f58a")
    val SERVICE_V2: UUID = UUID.fromString("61080001-8d6d-82b8-614a-1c8cb0f8dcc6")

    // ── Command characteristics (host → strap) ────────────────────────────────
    val COMMAND_V1: UUID = UUID.fromString("fd4b0002-cce1-4033-93ce-002d5875f58a")
    val COMMAND_V2: UUID = UUID.fromString("61080002-8d6d-82b8-614a-1c8cb0f8dcc6")

    // ── Notification characteristics (strap → host) ───────────────────────────
    val NOTIFY_V1_1: UUID = UUID.fromString("fd4b0003-cce1-4033-93ce-002d5875f58a")
    val NOTIFY_V1_2: UUID = UUID.fromString("fd4b0004-cce1-4033-93ce-002d5875f58a")
    val NOTIFY_V1_3: UUID = UUID.fromString("fd4b0005-cce1-4033-93ce-002d5875f58a")
    val NOTIFY_V1_4: UUID = UUID.fromString("fd4b0007-cce1-4033-93ce-002d5875f58a")
    val NOTIFY_V2_1: UUID = UUID.fromString("61080003-8d6d-82b8-614a-1c8cb0f8dcc6")
    val NOTIFY_V2_2: UUID = UUID.fromString("61080004-8d6d-82b8-614a-1c8cb0f8dcc6")
    val NOTIFY_V2_3: UUID = UUID.fromString("61080005-8d6d-82b8-614a-1c8cb0f8dcc6")
    val NOTIFY_V2_4: UUID = UUID.fromString("61080007-8d6d-82b8-614a-1c8cb0f8dcc6")

    // ── Standard BLE services — same as Goose serviceDiscoveryIDs ────────────
    val HEART_RATE_SERVICE: UUID     = UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb")
    val HEART_RATE_MEASUREMENT: UUID = UUID.fromString("00002a37-0000-1000-8000-00805f9b34fb")
    val BATTERY_SERVICE: UUID        = UUID.fromString("0000180f-0000-1000-8000-00805f9b34fb")
    val BATTERY_LEVEL: UUID          = UUID.fromString("00002a19-0000-1000-8000-00805f9b34fb")
    val BATTERY_LEVEL_STATUS: UUID   = UUID.fromString("00002bed-0000-1000-8000-00805f9b34fb")
    val DEVICE_INFO_SERVICE: UUID    = UUID.fromString("0000180a-0000-1000-8000-00805f9b34fb")
    val MODEL_NUMBER: UUID           = UUID.fromString("00002a24-0000-1000-8000-00805f9b34fb")
    val FIRMWARE_REVISION: UUID      = UUID.fromString("00002a26-0000-1000-8000-00805f9b34fb")
    val HARDWARE_REVISION: UUID      = UUID.fromString("00002a27-0000-1000-8000-00805f9b34fb")
    val SOFTWARE_REVISION: UUID      = UUID.fromString("00002a28-0000-1000-8000-00805f9b34fb")
    val MANUFACTURER_NAME: UUID      = UUID.fromString("00002a29-0000-1000-8000-00805f9b34fb")

    // ── CCCD descriptor for enabling notifications ────────────────────────────
    val CCCD: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

    // ── Device matching — contains check, case-insensitive (Goose pattern) ────
    const val DEVICE_NAME_KEYWORD = "WHOOP"

    // ── SharedPreferences keys — ported from Goose DefaultsKey ───────────────
    const val PREF_REMEMBERED_ID        = "goose.swift.rememberedDeviceID"
    const val PREF_REMEMBERED_NAME      = "goose.swift.rememberedDeviceName"
    const val PREF_REMEMBERED_VALIDATED = "goose.swift.rememberedDeviceValidatedWhoop"
    const val PREF_LAST_BATTERY_PERCENT = "goose.swift.lastBatteryPercent"

    // ── Service discovery list — Goose's serviceDiscoveryIDs ─────────────────
    val ALL_SERVICE_IDS = listOf(SERVICE_V1, SERVICE_V2, HEART_RATE_SERVICE, BATTERY_SERVICE, DEVICE_INFO_SERVICE)

    // ── All notification characteristics to subscribe to — Goose's notificationCharacteristicIDs
    val ALL_NOTIFY_IDS = listOf(
        NOTIFY_V1_1, NOTIFY_V1_2, NOTIFY_V1_3, NOTIFY_V1_4,
        NOTIFY_V2_1, NOTIFY_V2_2, NOTIFY_V2_3, NOTIFY_V2_4,
        HEART_RATE_MEASUREMENT,
    )

    // ── Command characteristic UUIDs (one per service family) ─────────────────
    val COMMAND_IDS = listOf(COMMAND_V1, COMMAND_V2)

    // ── Railway endpoint ──────────────────────────────────────────────────────
    const val RAILWAY_BASE_URL = "https://web-production-eaacf.up.railway.app"
    const val INGEST_PATH = "/ingest"

    // ── Frame constants ───────────────────────────────────────────────────────
    const val SOF: Byte            = 0xAA.toByte()
    const val FRAME_HEADER_SIZE    = 8   // Whoop 5 (Maverick): 8-byte header, not 4
    const val FRAME_FOOTER_SIZE    = 4

    // ── Packet types ──────────────────────────────────────────────────────────
    const val PKT_COMMAND: Byte          = 0x23
    const val PKT_COMMAND_RESPONSE: Byte = 0x24
    const val PKT_REALTIME_DATA: Byte    = 0x28
    const val PKT_REALTIME_RAW: Byte     = 0x2B
    const val PKT_HISTORICAL: Byte       = 0x2F
    const val PKT_EVENT: Byte            = 0x30
    const val PKT_METADATA: Byte         = 0x31
    const val PKT_IMU_STREAM: Byte       = 0x33
    const val PKT_HISTORICAL_IMU: Byte   = 0x34

    // ── Command numbers ───────────────────────────────────────────────────────
    const val CMD_TOGGLE_REALTIME_HR: Byte    = 0x03         // startMovementHeartRateCapture step 1
    const val CMD_SET_CLOCK: Byte             = 0x0A
    const val CMD_GET_CLOCK: Byte             = 0x0B
    const val CMD_SEND_HISTORICAL: Byte       = 0x16
    const val CMD_HISTORICAL_RESULT: Byte     = 0x17
    const val CMD_GET_BATTERY: Byte           = 0x1A.toByte()
    const val CMD_GET_HELLO: Byte             = 0x91.toByte()  // 145 — initial handshake
    const val CMD_SEND_R10_R11_REALTIME: Byte = 0x3F.toByte()  // 63 — startMovementHeartRateCapture step 2
    const val CMD_TOGGLE_IMU_MODE: Byte       = 0x6A.toByte()  // 106 — startPhysiologyCapture step 3
    const val CMD_TOGGLE_PERSISTENT_R21: Byte = 0x9A.toByte()  // 154 — startPhysiologyCapture step 4
    const val CMD_ENABLE_OPTICAL_DATA: Byte   = 0x6B.toByte()  // 107 — startPhysiologyCapture step 5
    const val CMD_TOGGLE_OPTICAL_MODE: Byte   = 0x6C.toByte()  // 108 — startPhysiologyCapture step 6
    const val CMD_TOGGLE_PERSISTENT_R20: Byte = 0x99.toByte()  // 153 — startPhysiologyCapture step 7

    // Payload for revisionBoolean(true) commands — [revision=1, enabled=1]
    val PAYLOAD_REVISION_ENABLE  = byteArrayOf(0x01, 0x01)
    val PAYLOAD_REVISION_DISABLE = byteArrayOf(0x01, 0x00)

    // ── Metadata subtypes ─────────────────────────────────────────────────────
    const val META_HISTORY_START: Byte    = 0x01
    const val META_HISTORY_END: Byte      = 0x02
    const val META_HISTORY_COMPLETE: Byte = 0x03

    // ── CRC-8 (poly 0x07) over 2-byte length field ───────────────────────────
    fun crc8(bytes: ByteArray): Byte {
        var crc = 0
        for (b in bytes) {
            crc = crc xor (b.toInt() and 0xFF)
            repeat(8) { crc = if (crc and 0x80 != 0) (crc shl 1) xor 0x07 else crc shl 1 }
        }
        return (crc and 0xFF).toByte()
    }

    // ── CRC-32 (reflected poly 0xEDB88320) over body ─────────────────────────
    fun crc32(bytes: ByteArray): Int {
        var crc = 0xFFFFFFFF.toInt()
        for (b in bytes) {
            crc = crc xor (b.toInt() and 0xFF)
            repeat(8) { crc = if (crc and 1 != 0) (crc ushr 1) xor 0xEDB88320.toInt() else crc ushr 1 }
        }
        return crc xor 0xFFFFFFFF.toInt()
    }

    // ── CRC-16 ModBus (poly 0xA001) over 6-byte frame header ─────────────────
    // Goose GooseBLEClient uses this for the header integrity check bytes[6..7].
    fun crc16ModBus(bytes: ByteArray): Int {
        var crc = 0xFFFF
        for (b in bytes) {
            crc = crc xor (b.toInt() and 0xFF)
            repeat(8) { crc = if (crc and 1 != 0) (crc ushr 1) xor 0xA001 else crc ushr 1 }
        }
        return crc and 0xFFFF
    }

    // ── Build a complete BLE command frame (Whoop 5 / Maverick 8-byte header) ─
    // Matches Goose GooseBLEClient.buildV5CommandFrame exactly:
    //   [SOF=AA][0x01][declaredLen_lo][declaredLen_hi][0x00][0x01][CRC16_lo][CRC16_hi]
    //   [payload padded to 4-byte boundary][CRC32(padded payload) 4 bytes LE]
    // declaredLen = paddedPayload.size + 4 (CRC32 size).
    fun buildFrame(body: ByteArray): ByteArray {
        // Pad payload to 4-byte alignment (Goose: "let padding = payload.count % 4 == 0 ? 0 : 4 - payload.count % 4")
        val padded = if (body.size % 4 == 0) body else body + ByteArray(4 - body.size % 4)
        val declaredLen = padded.size + FRAME_FOOTER_SIZE
        val header6 = byteArrayOf(
            SOF, 0x01,
            (declaredLen and 0xFF).toByte(), ((declaredLen shr 8) and 0xFF).toByte(),
            0x00, 0x01
        )
        val crc16 = crc16ModBus(header6)
        val bodyCrc = crc32(padded)
        return header6 +
            byteArrayOf((crc16 and 0xFF).toByte(), ((crc16 shr 8) and 0xFF).toByte()) +
            padded +
            byteArrayOf(
                (bodyCrc and 0xFF).toByte(),
                ((bodyCrc shr 8) and 0xFF).toByte(),
                ((bodyCrc shr 16) and 0xFF).toByte(),
                ((bodyCrc shr 24) and 0xFF).toByte()
            )
    }

    private var _seqNum: Int = 0
    fun nextSeq(): Byte = (_seqNum++ and 0xFF).toByte()
}
