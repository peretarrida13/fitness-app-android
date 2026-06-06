/**
 * WhoopBleManager.kt
 * BLE scanning, GATT connection, service discovery, and characteristic notification setup.
 * Delegates notification handling to WhoopBleHandler (packet decode + historical dump).
 * Reconnects with exponential backoff: 5s → 10s → 30s → 60s → 300s on disconnect.
 * Imports: WhoopGattProfile, WhoopBleHandler, WhoopBleBuffers, android.bluetooth.*
 */
package com.peretarrida.fittracker.plugins.whoop

import android.Manifest
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import kotlinx.coroutines.*

class WhoopBleManager(
    private val context: Context,
    private val buffers: WhoopBleBuffers,
    private val onConnected: (String) -> Unit,
    private val onDisconnected: (String) -> Unit,
    private val onError: (String, String) -> Unit,
) {
    private val TAG = "WhoopBleManager"
    private var gatt: BluetoothGatt? = null
    private var scanning = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val backoffMs = listOf(5_000L, 10_000L, 30_000L, 60_000L, 300_000L)
    private var backoffIdx = 0

    private val handler = WhoopBleHandler(buffers) { cmd, payload ->
        gatt?.let { sendCommand(it, cmd, payload) }
    }

    val isConnected get() = gatt != null

    fun startScan() {
        // Guard: BLUETOOTH_SCAN is a runtime permission on Android 12+. Never crash if not yet granted.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (context.checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN)
                != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "BLUETOOTH_SCAN not granted — retrying in 3s")
                mainHandler.postDelayed({ startScan() }, 3_000L)
                return
            }
        }
        val adapter = (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager)
            .adapter ?: return
        if (scanning || !adapter.isEnabled) return
        val scanner = adapter.bluetoothLeScanner ?: return
        val filter = ScanFilter.Builder()
            .setServiceUuid(android.os.ParcelUuid(WhoopGattProfile.SERVICE_UUID))
            .build()
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()
        scanning = true
        scanner.startScan(listOf(filter), settings, leScanCallback)
        Log.i(TAG, "BLE scan started for Whoop service UUID")
    }

    fun stopScan() {
        scanning = false
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager)
            .adapter?.bluetoothLeScanner?.stopScan(leScanCallback)
    }

    fun disconnect() {
        scope.cancel()
        gatt?.disconnect()
        gatt?.close()
        gatt = null
    }

    private val leScanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            stopScan()
            Log.i(TAG, "Found Whoop: ${result.device.name}")
            result.device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
        }
        override fun onScanFailed(errorCode: Int) {
            onError("SCAN_FAILED", "BLE scan error code $errorCode")
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    Log.i(TAG, "GATT connected — discovering services")
                    backoffIdx = 0
                    gatt = g
                    g.discoverServices()
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    Log.w(TAG, "GATT disconnected (status $status)")
                    gatt = null
                    onDisconnected("status=$status")
                    scheduleReconnect()
                }
            }
        }

        override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                onError("DISCOVER_FAILED", "Services discovery status $status"); return
            }
            subscribeAll(g)
            buffers.sessionStart = java.time.Instant.now()
            sendCommand(g, WhoopGattProfile.CMD_TOGGLE_REALTIME_HR, byteArrayOf(0x01))
            mainHandler.postDelayed({
                handler.dumpInProgress = false
                sendCommand(g, WhoopGattProfile.CMD_SEND_HISTORICAL, byteArrayOf(0x00))
            }, 2000)
        }

        override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic, value: ByteArray) {
            scope.launch { handler.handleRaw(value) }
        }

        @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
        override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU)
                scope.launch { handler.handleRaw(ch.value ?: return@launch) }
        }

        override fun onCharacteristicWrite(g: BluetoothGatt, ch: BluetoothGattCharacteristic, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) Log.w(TAG, "Write status $status")
        }
    }

    private fun subscribeAll(g: BluetoothGatt) {
        val svc = g.getService(WhoopGattProfile.SERVICE_UUID) ?: return
        listOf(WhoopGattProfile.CHAR_CMD_FROM_STRAP, WhoopGattProfile.CHAR_EVENTS, WhoopGattProfile.CHAR_DATA)
            .forEach { uuid -> svc.getCharacteristic(uuid)?.let { enableNotify(g, it) } }
        onConnected(g.device.name ?: "Whoop")
    }

    private fun enableNotify(g: BluetoothGatt, ch: BluetoothGattCharacteristic) {
        g.setCharacteristicNotification(ch, true)
        ch.getDescriptor(WhoopGattProfile.CCCD_UUID)?.let { desc ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                g.writeDescriptor(desc, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
            } else {
                @Suppress("DEPRECATION")
                desc.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                @Suppress("DEPRECATION")
                g.writeDescriptor(desc)
            }
        }
    }

    private fun sendCommand(g: BluetoothGatt, cmd: Byte, payload: ByteArray = byteArrayOf()) {
        val svc = g.getService(WhoopGattProfile.SERVICE_UUID) ?: return
        val ch = svc.getCharacteristic(WhoopGattProfile.CHAR_CMD_TO_STRAP) ?: return
        val body = byteArrayOf(WhoopGattProfile.PKT_COMMAND, WhoopGattProfile.nextSeq(), cmd) + payload
        val frame = WhoopGattProfile.buildFrame(body)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            g.writeCharacteristic(ch, frame, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
        } else {
            @Suppress("DEPRECATION")
            ch.value = frame
            @Suppress("DEPRECATION")
            g.writeCharacteristic(ch)
        }
    }

    private fun scheduleReconnect() {
        val delay = backoffMs.getOrElse(backoffIdx) { 300_000L }
        backoffIdx = (backoffIdx + 1).coerceAtMost(backoffMs.size - 1)
        mainHandler.postDelayed({ startScan() }, delay)
        Log.i(TAG, "Reconnect in ${delay / 1000}s")
    }
}
