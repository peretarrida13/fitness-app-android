/**
 * WhoopBleService.kt
 * Foreground Service hosting the Goose-ported Whoop 5.0 BLE state machine.
 * Flow: startConnection → check bonded/remembered → scan (UUID filter, then no-filter fallback)
 *       → connectGatt (autoConnect=false) → MTU + priority → discoverServices
 *       → read device info → serialised notification queue → Connected.
 * All GATT ops on bleHandler (dedicated HandlerThread). Data handling on realtimeHandler.
 * GATT 133 → close + cache clear + retry. Backoff: 2→5→10→30→60s.
 */
package com.peretarrida.fittracker.plugins.whoop

import android.Manifest
import android.app.*
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.*
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.time.Instant

class WhoopBleService : Service() {

    companion object {
        const val CHANNEL_ID  = "whoop_ble"
        const val NOTIF_ID    = 1001
        const val ACTION_SNAP = "whoop.SNAP"
        private const val TAG = "WhoopBle"
        private val BACKOFF = longArrayOf(2_000, 5_000, 10_000, 30_000, 60_000)
    }

    // ── State ──────────────────────────────────────────────────────────────────
    @Volatile private var state: WhoopConnectionState = WhoopConnectionState.Idle
    @Volatile private var currentGatt: BluetoothGatt? = null
    private var currentScanCb: ScanCallback? = null
    private var commandChar: BluetoothGattCharacteristic? = null
    private val notifyQueue = ArrayDeque<BluetoothGattCharacteristic>()
    private var retryCount = 0
    @Volatile private var lastNotifyAt = 0L
    private var firmwareVersion: String? = null
    private var lastBatteryPercent: Int? = null

    // ── Threads ────────────────────────────────────────────────────────────────
    private val bleThread  = HandlerThread("WhoopBLE").also { it.start() }
    private val rtThread   = HandlerThread("WhoopRT").also  { it.start() }
    private val bleH = Handler(bleThread.looper)
    private val rtH  = Handler(rtThread.looper)

    // ── Infrastructure ─────────────────────────────────────────────────────────
    private val btAdapter get() = (getSystemService(BLUETOOTH_SERVICE) as BluetoothManager).adapter
    private val prefs by lazy { getSharedPreferences("whoop_prefs", MODE_PRIVATE) }
    private val buffers = WhoopBleBuffers()
    private val frameAcc = WhoopFrameAccumulator()
    private val pktH by lazy {
        WhoopBleHandler(buffers) { cmd, pl -> bleH.post { sendCmd(cmd, pl) } }.also { h ->
            // Goose startMovementHeartRateCapture: cmd=3 then cmd=63, 250ms apart.
            // Called after the historical sync completes so the K=10 stream restarts cleanly.
            h.onHistoricalSyncComplete = {
                bleH.postDelayed({ sendCmd(WhoopGattProfile.CMD_TOGGLE_REALTIME_HR, byteArrayOf(0x01)) }, 0L)
                bleH.postDelayed({ sendCmd(WhoopGattProfile.CMD_SEND_R10_R11_REALTIME, byteArrayOf(0x01)) }, 250L)
            }
        }
    }
    private lateinit var wakeLock: PowerManager.WakeLock
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    private val btRx = object : BroadcastReceiver() {
        override fun onReceive(c: Context, i: Intent) {
            when (i.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1)) {
                BluetoothAdapter.STATE_OFF -> bleH.post { closeGatt(); setState(WhoopConnectionState.Disconnected("Bluetooth off")) }
                BluetoothAdapter.STATE_ON  -> bleH.post { startConnection() }
            }
        }
    }

    // ── Service lifecycle ──────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        createChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
            startForeground(NOTIF_ID, buildNotif(), ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
        else startForeground(NOTIF_ID, buildNotif())
        wakeLock = (getSystemService(POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$TAG:wake").apply { acquire() }
        // Restore last known battery so it shows immediately instead of 0%
        lastBatteryPercent = prefs.getInt(WhoopGattProfile.PREF_LAST_BATTERY_PERCENT, 0).takeIf { it > 0 }
        registerReceiver(btRx, IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED))
        scope.launch { while (isActive) { delay(300_000L); buffers.computeAndUpload(); updateNotif() } }
        scope.launch { while (isActive) { delay(60_000L); buffers.tickSleepMinute() } }
        scope.launch { while (isActive) { delay(30_000L); healthCheck() } }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_SNAP) scope.launch { buffers.computeAndUpload() }
        else bleH.post { startConnection() }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel(); closeGatt()
        if (wakeLock.isHeld) wakeLock.release()
        unregisterReceiver(btRx); bleThread.quitSafely(); rtThread.quitSafely()
        scheduleAlarmRestart()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Connection startup — Goose: init + loadRememberedDevice + startupReconnect ──

    private fun startConnection() {
        stopCurrentScan()
        setState(WhoopConnectionState.CheckingRemembered)
        if (!checkPermission(Manifest.permission.BLUETOOTH_CONNECT)) { scheduleReconnect(); return }

        val rememberedId = prefs.getString(WhoopGattProfile.PREF_REMEMBERED_ID, null)
        if (rememberedId != null) {
            // Android equivalent of iOS retrievePeripherals(withIdentifiers:) — check bonded devices
            val bonded = btAdapter?.bondedDevices?.firstOrNull { d ->
                d.address == rememberedId ||
                d.name?.contains(WhoopGattProfile.DEVICE_NAME_KEYWORD, ignoreCase = true) == true
            }
            if (bonded != null) {
                Log.i(TAG, "Reconnecting to remembered device: ${bonded.name}")
                connectToDevice(bonded); return
            }
        }
        startScan()
    }

    // ── Scanning — service UUID filter first, name-only fallback ─────────────

    private fun startScan() {
        stopCurrentScan()
        if (!checkPermission(Manifest.permission.BLUETOOTH_SCAN)) { scheduleReconnect(); return }
        val scanner = btAdapter?.bluetoothLeScanner ?: run { scheduleReconnect(); return }
        setState(WhoopConnectionState.Scanning)

        // Goose: scanForPeripherals(withServices: whoopServices) — try with service UUID filters
        val filters = listOf(
            ScanFilter.Builder().setServiceUuid(android.os.ParcelUuid(WhoopGattProfile.SERVICE_V1)).build(),
            ScanFilter.Builder().setServiceUuid(android.os.ParcelUuid(WhoopGattProfile.SERVICE_V2)).build(),
        )
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        val cb = buildScanCallback(scanner, fallback = false)
        currentScanCb = cb
        scanner.startScan(filters, settings, cb)
        Log.i(TAG, "Scan started (UUID filter)")
        // 30s timeout — if nothing found, fall back to no-filter scan
        bleH.postDelayed({ if (currentScanCb === cb) { stopCurrentScan(); startScanNoFilter() } }, 30_000L)
    }

    private fun startScanNoFilter() {
        if (!checkPermission(Manifest.permission.BLUETOOTH_SCAN)) { scheduleReconnect(); return }
        val scanner = btAdapter?.bluetoothLeScanner ?: run { scheduleReconnect(); return }
        setState(WhoopConnectionState.Scanning)
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        val cb = buildScanCallback(scanner, fallback = true)
        currentScanCb = cb
        scanner.startScan(null, settings, cb)
        Log.i(TAG, "Scan started (no filter / name check)")
        bleH.postDelayed({ if (currentScanCb === cb) { stopCurrentScan(); scheduleReconnect() } }, 30_000L)
    }

    private fun buildScanCallback(scanner: BluetoothLeScanner, fallback: Boolean) = object : ScanCallback() {
        override fun onScanResult(type: Int, result: ScanResult) {
            val name = result.device.name ?: return
            if (!name.contains(WhoopGattProfile.DEVICE_NAME_KEYWORD, ignoreCase = true)) return
            bleH.post { stopCurrentScan(); connectToDevice(result.device) }
        }
        override fun onScanFailed(errorCode: Int) {
            Log.w(TAG, "Scan failed ($errorCode)" + if (!fallback) " — retrying without filter" else "")
            if (!fallback) bleH.post { startScanNoFilter() }
            else scheduleReconnect()
        }
    }

    private fun stopCurrentScan() {
        currentScanCb?.let {
            if (checkPermission(Manifest.permission.BLUETOOTH_SCAN))
                btAdapter?.bluetoothLeScanner?.stopScan(it)
        }
        currentScanCb = null
    }

    // ── Connection — Goose: connectPeripheral ─────────────────────────────────

    private fun connectToDevice(device: BluetoothDevice) {
        if (!checkPermission(Manifest.permission.BLUETOOTH_CONNECT)) return
        prefs.edit()
            .putString(WhoopGattProfile.PREF_REMEMBERED_ID, device.address)
            .putString(WhoopGattProfile.PREF_REMEMBERED_NAME, device.name)
            .apply()
        closeGatt()                          // clear any stale GATT object
        setState(WhoopConnectionState.Connecting)
        val g = device.connectGatt(this, false, gattCb, BluetoothDevice.TRANSPORT_LE)
        currentGatt = g
        bleH.postDelayed({
            // Guard: only act if THIS gatt is still the active one — stale timers from
            // previous connection attempts must not close a newer valid connection.
            if (state is WhoopConnectionState.Connecting && currentGatt === g) {
                Log.w(TAG, "Connection timeout"); closeGatt()
                prefs.edit().remove(WhoopGattProfile.PREF_REMEMBERED_ID).apply()
                scheduleReconnect(2_000L)
            }
        }, 10_000L)
    }

    private fun closeGatt() {
        currentGatt?.disconnect(); currentGatt?.close(); currentGatt = null
    }

    fun clearGattCache(g: BluetoothGatt) {
        try { g.javaClass.getMethod("refresh").invoke(g) } catch (e: Exception) { Log.w(TAG, "Cache: ${e.message}") }
    }

    // ── GATT callback — port of Goose's CBPeripheralDelegate ──────────────────

    private val gattCb = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
            bleH.post {
                if (status == 133) {
                    Log.w(TAG, "GATT 133 — full reset")
                    g.disconnect(); g.close(); clearGattCache(g); currentGatt = null
                    prefs.edit().remove(WhoopGattProfile.PREF_REMEMBERED_ID).apply()
                    setState(WhoopConnectionState.Error(133, "GATT error — retrying"))
                    scheduleReconnect(2_000L); return@post
                }
                if (status != BluetoothGatt.GATT_SUCCESS) {
                    g.close(); currentGatt = null
                    setState(WhoopConnectionState.Disconnected("GATT status $status"))
                    scheduleReconnect(); return@post
                }
                when (newState) {
                    BluetoothProfile.STATE_CONNECTED -> {
                        Log.i(TAG, "Connected — clearing cache + MTU + priority")
                        retryCount = 0; currentGatt = g
                        // Clear stale GATT cache NOW (after connection is live) so
                        // discoverServices always gets a fresh descriptor list for 2A37 CCCD.
                        clearGattCache(g)
                        g.requestConnectionPriority(BluetoothGatt.CONNECTION_PRIORITY_HIGH)
                        g.requestMtu(512)
                    }
                    BluetoothProfile.STATE_DISCONNECTED -> {
                        Log.w(TAG, "Disconnected"); g.close(); currentGatt = null
                        frameAcc.reset()
                        WhoopPlugin.emitDisconnected("Device disconnected")
                        setState(WhoopConnectionState.Disconnected("Device disconnected"))
                        scheduleReconnect()
                    }
                }
            }
        }

        override fun onMtuChanged(g: BluetoothGatt, mtu: Int, status: Int) {
            bleH.post {
                setState(WhoopConnectionState.DiscoveringServices)
                g.discoverServices()
                bleH.postDelayed({
                    // Guard: stale timers from previous connections must not close the current gatt.
                    if (state is WhoopConnectionState.DiscoveringServices && currentGatt === g) {
                        Log.w(TAG, "Discovery timeout"); clearGattCache(g); g.close(); currentGatt = null
                        prefs.edit().remove(WhoopGattProfile.PREF_REMEMBERED_ID).apply()
                        scheduleReconnect(3_000L)
                    }
                }, 10_000L)
            }
        }

        override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
            bleH.post {
                if (status != BluetoothGatt.GATT_SUCCESS) {
                    Log.w(TAG, "Discovery failed $status"); clearGattCache(g); g.close()
                    currentGatt = null; scheduleReconnect(3_000L); return@post
                }
                // Find command characteristic from whichever service family was discovered
                commandChar = g.services.flatMap { it.characteristics }
                    .firstOrNull { WhoopGattProfile.COMMAND_IDS.contains(it.uuid) }
                Log.i(TAG, "Command char: ${commandChar?.uuid}")
                // Do NOT read characteristics here — any readCharacteristic() call would
                // race with the notification queue writes below and be silently dropped.
                // Battery is read in onAllEnabled() after the queue finishes.
                setState(WhoopConnectionState.EnablingNotifications)
                buildNotifyQueue(g)
                processNext()
            }
        }

        override fun onDescriptorWrite(g: BluetoothGatt, d: BluetoothGattDescriptor, status: Int) {
            bleH.post {
                if (status != BluetoothGatt.GATT_SUCCESS) {
                    Log.w(TAG, "CCCD write FAILED: ${d.characteristic?.uuid} status=$status")
                } else {
                    Log.d(TAG, "CCCD write OK: ${d.characteristic?.uuid}")
                }
                // Only advance the notification queue during the setup phase.
                // ensureHrSubscribed() also writes a CCCD after onAllEnabled() sets
                // state to Connected — calling processNext() there empties the queue
                // and calls onAllEnabled() again, causing an infinite reconnect loop.
                if (state is WhoopConnectionState.EnablingNotifications) {
                    processNext()
                }
            }
        }

        override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic, v: ByteArray) {
            lastNotifyAt = System.currentTimeMillis()
            val preview = v.take(6).joinToString("") { "%02x".format(it) }
            Log.d(TAG, "notify ${ch.uuid.toString().take(8)} len=${v.size} hex=$preview")
            if (ch.uuid == WhoopGattProfile.HEART_RATE_MEASUREMENT) rtH.post { parseStandardHR(v) }
            else rtH.post { frameAcc.feed(v).forEach { pktH.handleRaw(it) } }
        }

        @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
        override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                lastNotifyAt = System.currentTimeMillis()
                val v = ch.value ?: return
                val preview = v.take(6).joinToString("") { "%02x".format(it) }
                Log.d(TAG, "notify(old) ${ch.uuid.toString().take(8)} len=${v.size} hex=$preview")
                if (ch.uuid == WhoopGattProfile.HEART_RATE_MEASUREMENT) rtH.post { parseStandardHR(v) }
                else rtH.post { frameAcc.feed(v).forEach { pktH.handleRaw(it) } }
            }
        }

        override fun onCharacteristicRead(g: BluetoothGatt, ch: BluetoothGattCharacteristic, v: ByteArray, s: Int) {
            bleH.post {
                when (ch.uuid) {
                    WhoopGattProfile.BATTERY_LEVEL   -> {
                        val pct = v[0].toInt() and 0xFF
                        lastBatteryPercent = pct
                        buffers.ingestBattery(BatteryReading(pct, false))
                        prefs.edit().putInt(WhoopGattProfile.PREF_LAST_BATTERY_PERCENT, pct).apply()
                        Log.i(TAG, "Battery: $pct%")
                        // Re-emit Connected state so React updates the battery % immediately
                        val connState = state
                        if (connState is WhoopConnectionState.Connected) {
                            val updated = connState.copy(batteryPercent = pct)
                            state = updated
                            WhoopPlugin.emitStateChanged(updated.stateName(), updated.detail())
                            WhoopPlugin.emitBattery(pct)
                        }
                    }
                    WhoopGattProfile.FIRMWARE_REVISION -> firmwareVersion = String(v)
                    WhoopGattProfile.MODEL_NUMBER,
                    WhoopGattProfile.HARDWARE_REVISION,
                    WhoopGattProfile.MANUFACTURER_NAME -> Unit // stored for logging only
                }
            }
        }

        @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
        override fun onCharacteristicRead(g: BluetoothGatt, ch: BluetoothGattCharacteristic, s: Int) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU)
                onCharacteristicRead(g, ch, ch.value ?: return, s)
        }
    }

    // ── Notification queue — Goose: subscribeToCharacteristics, serialised ───

    private fun buildNotifyQueue(g: BluetoothGatt) {
        notifyQueue.clear()
        val chars = g.services.flatMap { it.characteristics }
            .filter { WhoopGattProfile.ALL_NOTIFY_IDS.contains(it.uuid) }
        // Goose subscribes to 2A37 first (as characteristics are discovered).
        // Put it at the front so live HR starts flowing before proprietary packets.
        chars.sortedBy { if (it.uuid == WhoopGattProfile.HEART_RATE_MEASUREMENT) 0 else 1 }
            .forEach { notifyQueue.add(it) }
        val queueSummary = notifyQueue.joinToString { it.uuid.toString().takeLast(8) }
        Log.i(TAG, "Notify queue (${notifyQueue.size}): $queueSummary")
    }

    // Goose: setNotifyValue(true, for:) automatically picks NOTIFY vs INDICATE based on
    // the characteristic's properties. We must do the same on Android — always using
    // ENABLE_NOTIFICATION_VALUE is wrong when the device uses INDICATE (0x20 property).
    private fun cccdEnableValue(ch: BluetoothGattCharacteristic): ByteArray =
        if (ch.properties and BluetoothGattCharacteristic.PROPERTY_INDICATE != 0)
            BluetoothGattDescriptor.ENABLE_INDICATION_VALUE
        else
            BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE

    private fun writeDescriptorCompat(g: BluetoothGatt, desc: BluetoothGattDescriptor, value: ByteArray) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            g.writeDescriptor(desc, value)
        } else {
            @Suppress("DEPRECATION") desc.value = value
            @Suppress("DEPRECATION") g.writeDescriptor(desc)
        }
    }

    private fun processNext() {
        val ch = notifyQueue.removeFirstOrNull() ?: run { onAllEnabled(); return }
        val g = currentGatt ?: run { Log.e(TAG, "processNext: currentGatt null — stale timer killed it"); return }
        g.setCharacteristicNotification(ch, true)
        val desc = ch.getDescriptor(WhoopGattProfile.CCCD) ?: run { processNext(); return }
        writeDescriptorCompat(g, desc, cccdEnableValue(ch))
        // 5s fallback — advance if onDescriptorWrite never fires
        val snap = notifyQueue.size
        bleH.postDelayed({ if (notifyQueue.size == snap && state is WhoopConnectionState.EnablingNotifications) processNext() }, 5_000L)
    }

    private fun onAllEnabled() {
        val g = currentGatt ?: return
        val name = g.device?.name ?: "Whoop"
        buffers.sessionStart = Instant.now()
        // Goose: connectionState = "ready" — emit Connected
        setState(WhoopConnectionState.Connected(name, lastBatteryPercent, firmwareVersion))
        WhoopPlugin.emitConnected(name, lastBatteryPercent ?: 0, firmwareVersion)
        lastNotifyAt = System.currentTimeMillis()
        // Goose: sendClientHelloIfNeeded() — device won't stream data without this handshake.
        // Frame from GooseHello.swift clientHelloFrameHex — sent raw (not via buildFrame).
        sendHello()
        // Goose startMovementHeartRateCapture — cmd=3 then cmd=63, 250ms apart
        bleH.postDelayed({ sendCmd(WhoopGattProfile.CMD_TOGGLE_REALTIME_HR, byteArrayOf(0x01)) }, 300L)
        bleH.postDelayed({ sendCmd(WhoopGattProfile.CMD_SEND_R10_R11_REALTIME, byteArrayOf(0x01)) }, 550L)
        // Read battery now — no GATT op is pending
        bleH.postDelayed({ readBattery() }, 800L)
        // Safety net: explicitly re-subscribe to 2A37 in case the CCCD was skipped
        // during the notification queue (e.g., descriptor not found in cache).
        bleH.postDelayed({ ensureHrSubscribed() }, 1_500L)
        bleH.postDelayed({ pktH.dumpInProgress = false; sendCmd(WhoopGattProfile.CMD_SEND_HISTORICAL, byteArrayOf(0x00)) }, 2_000L)
        // Fire an early snapshot 30s after connect — historical dump fills buffers within ~10s
        scope.launch { delay(30_000L); if (state is WhoopConnectionState.Connected) { buffers.computeAndUpload(); updateNotif() } }
    }

    // Goose GooseHello.clientHelloFrameHex — pre-built GET_HELLO frame sent raw to command char.
    // The Whoop device will not stream HR or proprietary data without receiving this first.
    private fun sendHello() {
        val g = currentGatt ?: return
        val ch = commandChar ?: return
        val frame = "aa0108000001e67123019101363e5c8d"
            .chunked(2).map { it.toInt(16).toByte() }.toByteArray()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            g.writeCharacteristic(ch, frame, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
        } else {
            @Suppress("DEPRECATION") ch.value = frame
            @Suppress("DEPRECATION") g.writeCharacteristic(ch)
        }
        Log.i(TAG, "GET_HELLO sent (${frame.size}b)")
    }

    private fun ensureHrSubscribed() {
        val g = currentGatt ?: return
        val hrChar = g.services.flatMap { it.characteristics }
            .firstOrNull { it.uuid == WhoopGattProfile.HEART_RATE_MEASUREMENT } ?: run {
                Log.w(TAG, "2A37 not found — no live HR available"); return
            }
        g.setCharacteristicNotification(hrChar, true)
        val desc = hrChar.getDescriptor(WhoopGattProfile.CCCD) ?: run {
            Log.w(TAG, "2A37 CCCD descriptor missing after cache clear — HR may not arrive"); return
        }
        val cccdVal = cccdEnableValue(hrChar)
        val mode = if (hrChar.properties and BluetoothGattCharacteristic.PROPERTY_INDICATE != 0) "INDICATE" else "NOTIFY"
        writeDescriptorCompat(g, desc, cccdVal)
        Log.i(TAG, "2A37 HR CCCD re-subscribed mode=$mode")
    }

    private fun readBattery() {
        val g = currentGatt ?: return
        val ch = g.services.flatMap { it.characteristics }
            .firstOrNull { it.uuid == WhoopGattProfile.BATTERY_LEVEL } ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) g.readCharacteristic(ch)
        else @Suppress("DEPRECATION") g.readCharacteristic(ch)
        Log.i(TAG, "Battery read requested")
    }

    // ── Standard BLE Heart Rate Measurement parser — Goose: parseStandardHeartRateMeasurement ─
    // Wire format: [flags u8] [hr u8 or u16le] [energy u16le, optional] [rr u16le[], optional]
    // RR interval unit: 1/1024 second → multiply by 1000/1024 to get ms

    private fun parseStandardHR(v: ByteArray) {
        Log.d(TAG, "parseStandardHR called len=${v.size} hex=${v.take(4).joinToString(""){"%02x".format(it)}}")
        if (v.size < 2) return
        val flags = v[0].toInt() and 0xFF
        var offset = 1
        val bpm: Int = if (flags and 0x01 == 0) {
            (v[offset++].toInt() and 0xFF)
        } else {
            if (v.size < 3) return
            val b = (v[offset].toInt() and 0xFF) or ((v[offset + 1].toInt() and 0xFF) shl 8)
            offset += 2; b
        }
        if (bpm !in 20..240) return

        // Skip energy expended field if present
        if (flags and 0x08 != 0) offset += 2

        // Collect RR intervals (1/1024 s → ms)
        val rrIntervals = mutableListOf<Float>()
        if (flags and 0x10 != 0) {
            while (offset + 1 < v.size) {
                val raw = (v[offset].toInt() and 0xFF) or ((v[offset + 1].toInt() and 0xFF) shl 8)
                val ms = raw * 1000f / 1024f
                if (ms in 300f..2000f) rrIntervals.add(ms)
                offset += 2
            }
        }

        // Ingest into buffers — one BiometricReading per RR interval (or one with 0 if none)
        val rrList = rrIntervals.ifEmpty { listOf(0f) }
        rrList.forEach { rr ->
            buffers.ingestReading(BiometricReading(
                heartRate = bpm, rrIntervalMs = rr,
                spO2 = 0f, skinTempCelsius = 0f,
                accelX = 0f, accelY = 0f, accelZ = 0f,
                timestamp = System.currentTimeMillis(),
            ))
        }

        // Emit to React for live BPM display — fires on every heartbeat
        WhoopPlugin.emitHeartRate(bpm)
        Log.d(TAG, "HR: $bpm bpm  RR: ${rrIntervals.size} intervals")
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private fun healthCheck() {
        // Goose: lastNotificationSyncPublishedAt watchdog
        if (state !is WhoopConnectionState.Connected) return
        val age = System.currentTimeMillis() - lastNotifyAt
        when {
            age > 120_000L -> { Log.w(TAG, "No notify 120s — reconnecting"); bleH.post { currentGatt?.disconnect() } }
            age >  60_000L -> Log.w(TAG, "No notify 60s")
        }
    }

    private fun sendCmd(cmd: Byte, pl: ByteArray = byteArrayOf()) {
        val g = currentGatt ?: return; val ch = commandChar ?: return
        val frame = WhoopGattProfile.buildFrame(byteArrayOf(WhoopGattProfile.PKT_COMMAND, WhoopGattProfile.nextSeq(), cmd) + pl)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
            g.writeCharacteristic(ch, frame, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
        else { @Suppress("DEPRECATION") ch.value = frame; @Suppress("DEPRECATION") g.writeCharacteristic(ch) }
    }

    private fun setState(s: WhoopConnectionState) {
        state = s; WhoopPlugin.emitStateChanged(s.stateName(), s.detail()); updateNotif()
    }

    // Goose: autoReconnectInFlight — one reconnect attempt at a time
    private fun scheduleReconnect(fixedMs: Long? = null) {
        val delay = fixedMs ?: BACKOFF.getOrElse(retryCount++) { 60_000L }
        setState(WhoopConnectionState.Disconnected("Retrying in ${delay / 1000}s"))
        bleH.postDelayed({ startConnection() }, delay)
    }

    private fun checkPermission(perm: String) =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED

    private fun scheduleAlarmRestart() {
        val pi = PendingIntent.getService(this, 0, Intent(this, WhoopBleService::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        (getSystemService(ALARM_SERVICE) as AlarmManager)
            .set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + 30_000L, pi)
    }

    // ── Foreground notification ────────────────────────────────────────────────

    private fun createChannel() {
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
            .createNotificationChannel(NotificationChannel(CHANNEL_ID, "Whoop BLE Sync", NotificationManager.IMPORTANCE_LOW))
    }

    private fun buildNotif(): Notification {
        val text = when (val s = state) {
            is WhoopConnectionState.CheckingRemembered,
            is WhoopConnectionState.Scanning     -> "Searching for Whoop..."
            is WhoopConnectionState.Connecting   -> "Connecting to Whoop..."
            is WhoopConnectionState.DiscoveringServices,
            is WhoopConnectionState.EnablingNotifications -> "Setting up connection..."
            is WhoopConnectionState.Connected    -> "Whoop connected — syncing"
            is WhoopConnectionState.Disconnected -> "Whoop disconnected — reconnecting"
            else -> "Whoop: ${s.stateName()}"
        }
        return NotificationCompat.Builder(this, CHANNEL_ID).setContentTitle(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info).setOngoing(true).setSilent(true).build()
    }

    private fun updateNotif() {
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIF_ID, buildNotif())
    }
}
