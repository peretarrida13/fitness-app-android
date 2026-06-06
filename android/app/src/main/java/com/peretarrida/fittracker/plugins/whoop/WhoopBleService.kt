/**
 * WhoopBleService.kt
 * Android foreground service (type: connectedDevice) that hosts the Whoop BLE pipeline.
 * Acquires PARTIAL_WAKE_LOCK to prevent CPU sleep during continuous data collection.
 * Runs WhoopBleManager for BLE + WhoopBleBuffers for metrics + 5-min upload timer.
 * Survives Bluetooth toggling via BroadcastReceiver. Restarts via AlarmManager on destroy.
 * Imports: WhoopBleManager, WhoopBleBuffers, WhoopPlugin (notifyListeners)
 */
package com.peretarrida.fittracker.plugins.whoop

import android.app.*
import android.bluetooth.BluetoothAdapter
import android.content.*
import android.content.pm.ServiceInfo
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.time.Instant

class WhoopBleService : Service() {

    companion object {
        const val ACTION_GET_SNAPSHOT = "whoop.GET_SNAPSHOT"
        const val CHANNEL_ID = "whoop_ble"
        const val NOTIF_ID = 1001
        private const val TAG = "WhoopBleService"
        private const val UPLOAD_INTERVAL_MS = 5 * 60 * 1000L
        private const val SLEEP_TICK_MS = 60_000L
    }

    private val buffers = WhoopBleBuffers()
    private lateinit var manager: WhoopBleManager
    private lateinit var wakeLock: PowerManager.WakeLock
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var lastUploadTime = "never"

    private val btReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1)
            when (state) {
                BluetoothAdapter.STATE_OFF -> { manager.disconnect(); Log.i(TAG, "BT off — paused") }
                BluetoothAdapter.STATE_ON  -> { manager.startScan(); Log.i(TAG, "BT on — resuming scan") }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIF_ID, buildNotification())
        }

        wakeLock = (getSystemService(POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$TAG:wake").apply { acquire() }

        manager = WhoopBleManager(
            context = this,
            buffers = buffers,
            onConnected = { name ->
                WhoopPlugin.emitConnected(name, buffers.battery.percent)
                updateNotification()
            },
            onDisconnected = { reason ->
                WhoopPlugin.emitDisconnected(reason)
                updateNotification()
            },
            onError = { code, msg -> WhoopPlugin.emitError(code, msg) },
        )

        registerReceiver(btReceiver, IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED))
        // Scan is triggered in onStartCommand after permissions are granted by the React layer

        // 5-min upload timer
        scope.launch {
            while (isActive) {
                delay(UPLOAD_INTERVAL_MS)
                uploadAndEmit()
            }
        }
        // Sleep staging: 1-min tick
        scope.launch {
            while (isActive) {
                delay(SLEEP_TICK_MS)
                buffers.tickSleepMinute()
            }
        }
        // Battery poll every 10 min
        scope.launch {
            while (isActive) {
                delay(10 * 60_000L)
                // Battery is fetched via command — manager handles response via notification
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_GET_SNAPSHOT -> scope.launch { uploadAndEmit() }
            else -> {
                // Normal start — permissions should be granted by now, begin scanning
                if (!manager.isConnected) manager.startScan()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        manager.disconnect()
        if (wakeLock.isHeld) wakeLock.release()
        unregisterReceiver(btReceiver)
        scheduleRestart()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Snapshot computation + emit ───────────────────────────────────────────

    private suspend fun uploadAndEmit() {
        val ok = buffers.computeAndUpload()
        lastUploadTime = Instant.now().toString()
        updateNotification()
        Log.i(TAG, "Snapshot uploaded: success=$ok")
    }

    // ── Notification ───────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        val ch = NotificationChannel(CHANNEL_ID, "Whoop BLE Sync", NotificationManager.IMPORTANCE_LOW)
        ch.description = "Continuous Whoop data collection"
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(ch)
    }

    private fun buildNotification(): Notification {
        val age = if (lastUploadTime == "never") "—"
        else "${(System.currentTimeMillis() - Instant.parse(lastUploadTime.takeIf { it != "never" } ?: Instant.now().toString()).toEpochMilli()) / 60000}m ago"
        val status = if (::manager.isInitialized && manager.isConnected) "Connected" else "Searching…"
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Whoop syncing — $status")
            .setContentText("Last update: $age")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun updateNotification() {
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
            .notify(NOTIF_ID, buildNotification())
    }

    // ── AlarmManager restart on destroy ─────────────────────────────────────

    private fun scheduleRestart() {
        val am = getSystemService(ALARM_SERVICE) as AlarmManager
        val intent = Intent(this, WhoopBleService::class.java)
        val pi = PendingIntent.getService(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + 30_000L, pi)
        Log.i(TAG, "Service restart scheduled in 30s")
    }
}
