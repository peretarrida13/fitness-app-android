/**
 * WhoopFrameAccumulator.kt
 * Reassembles Whoop 5 BLE frames that span multiple notifications.
 * Whoop 5 sends K=10 IMU frames of ~1932 bytes split across ~8 × 244-byte notifications.
 * Mirrors Goose Rust/core/src/protocol.rs FrameAccumulator.feed().
 * Call feed() on every raw notification; it returns 0..N complete frames ready for handleRaw.
 * Not thread-safe — must be called from a single thread (rtH in WhoopBleService).
 */
package com.peretarrida.fittracker.plugins.whoop

import android.util.Log

class WhoopFrameAccumulator {

    private val TAG = "WhoopFrameAcc"
    private var buf = ByteArray(0)

    /**
     * Append [chunk] (one BLE notification) and return all complete frames found so far.
     * Matches Goose: scan for 0xAA, read declaredLen at buf[2..3], wait until
     * buf.size >= declaredLen + 8, then extract the frame.
     */
    fun feed(chunk: ByteArray): List<ByteArray> {
        buf = buf + chunk
        val frames = mutableListOf<ByteArray>()

        while (buf.isNotEmpty()) {
            // Drop bytes before the next 0xAA frame start
            val startIdx = buf.indexOfFirst { it == WhoopGattProfile.SOF }
            when {
                startIdx < 0 -> { buf = ByteArray(0); break }
                startIdx > 0 -> buf = buf.copyOfRange(startIdx, buf.size)
            }

            // Need at least 8 bytes to read the header
            if (buf.size < 8) break

            // declaredLen = LE u16 at buf[2..3] = payloadLen + 4 (CRC32)
            val declaredLen = (buf[2].toInt() and 0xFF) or ((buf[3].toInt() and 0xFF) shl 8)
            if (declaredLen < 4) {
                buf = buf.copyOfRange(1, buf.size)
                continue
            }

            val expectedLen = declaredLen + 8  // 8-byte header + declared block
            if (buf.size < expectedLen) break  // still accumulating fragments

            val frame = buf.copyOfRange(0, expectedLen)
            buf = if (expectedLen < buf.size) buf.copyOfRange(expectedLen, buf.size) else ByteArray(0)
            frames.add(frame)

            if (expectedLen > 244) {
                Log.d(TAG, "reassembled ${expectedLen}B frame from fragments")
            }
        }

        return frames
    }

    fun reset() {
        buf = ByteArray(0)
    }
}
