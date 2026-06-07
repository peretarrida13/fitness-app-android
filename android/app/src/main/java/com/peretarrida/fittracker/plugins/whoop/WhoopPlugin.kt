/**
 * WhoopPlugin.kt
 * Capacitor plugin bridge: React ↔ native WhoopBleService.
 * Plugin name "Whoop". Static emitters let WhoopBleService fire events without a reference.
 * emitConnected now carries firmwareVersion — ported from Goose's @Published vars.
 */
package com.peretarrida.fittracker.plugins.whoop

import android.Manifest
import android.content.Intent
import android.os.Build
import android.util.Log
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.time.Instant

@CapacitorPlugin(
    name = "Whoop",
    permissions = [
        Permission(strings = [Manifest.permission.BLUETOOTH_SCAN],       alias = "btScan"),
        Permission(strings = [Manifest.permission.BLUETOOTH_CONNECT],    alias = "btConnect"),
        Permission(strings = [Manifest.permission.ACCESS_FINE_LOCATION], alias = "location"),
        Permission(strings = [Manifest.permission.POST_NOTIFICATIONS],   alias = "notifications"),
    ],
)
class WhoopPlugin : Plugin() {

    companion object {
        private var _instance: WhoopPlugin? = null
        private const val TAG = "WhoopPlugin"

        var isConnected: Boolean = false
            private set
        var currentStateName: String = "Idle"
            private set
        var lastHeartRate: Int = 0
            private set
        private var lastBattery: Int = 0
        private var lastSync: String = ""

        fun emitStateChanged(stateName: String, detail: String) {
            currentStateName = stateName
            _instance?.notifyListeners("whoopStateChanged", JSObject().apply {
                put("state", stateName)
                put("detail", detail)
            })
        }

        fun emitConnected(deviceName: String, batteryPercent: Int, firmwareVersion: String?) {
            isConnected = true; lastBattery = batteryPercent; lastSync = Instant.now().toString()
            _instance?.notifyListeners("whoopConnected", JSObject().apply {
                put("deviceName", deviceName)
                put("batteryPercent", batteryPercent)
                put("firmwareVersion", firmwareVersion ?: "")
            })
        }

        fun emitDisconnected(reason: String) {
            isConnected = false
            _instance?.notifyListeners("whoopDisconnected", JSObject().apply { put("reason", reason) })
        }

        fun emitSnapshot(snapshot: WhoopSnapshot) {
            lastBattery = snapshot.batteryPercent; lastSync = snapshot.timestamp
            val js = JSObject().apply {
                put("timestamp", snapshot.timestamp)
                // Only emit heartRate if it's a real reading — latestHr starts at 0
                // and emitting 0 causes JS bpm fallback to show "0 bpm" instead of "—"
                if (snapshot.heartRate > 0) put("heartRate", snapshot.heartRate)
                snapshot.hrv?.let { put("hrv", it) } ?: put("hrv", null as String?)
                put("spO2", snapshot.spO2)
                put("skinTempCelsius", snapshot.skinTempCelsius)
                put("accelMagnitude", snapshot.accelMagnitude)
                snapshot.recoveryScore?.let { put("recoveryScore", it) }
                snapshot.recoveryLevel?.let { put("recoveryLevel", it) }
                put("strainScore", snapshot.strainScore)
                put("strainLevel", snapshot.strainLevel)
                put("sleepStage", snapshot.sleepStage)
                // sleepMinutes — map to JSObject so JS receives { deep, rem, light, awake }
                val sleepJs = JSObject()
                snapshot.sleepMinutes.forEach { (k, v) -> sleepJs.put(k, v) }
                put("sleepMinutes", sleepJs)
                put("batteryPercent", snapshot.batteryPercent)
                put("batteryCharging", snapshot.batteryCharging)
                put("deviceConnected", snapshot.deviceConnected)
                put("sessionStartTime", snapshot.sessionStartTime)
                // rrIntervalsRaw — needed by backend for server-side HRV cross-check
                val rrJs = com.getcapacitor.JSArray()
                snapshot.rrIntervalsRaw.forEach { rrJs.put(it) }
                put("rrIntervalsRaw", rrJs)
            }
            _instance?.notifyListeners("whoopSnapshot", js)
        }

        fun emitHeartRate(bpm: Int) {
            lastHeartRate = bpm
            _instance?.notifyListeners("whoopHeartRate", JSObject().apply { put("bpm", bpm) })
        }

        fun emitBattery(percent: Int) {
            lastBattery = percent
            _instance?.notifyListeners("whoopBattery", JSObject().apply { put("percent", percent) })
        }

        fun emitError(code: String, message: String) {
            _instance?.notifyListeners("whoopError", JSObject().apply {
                put("code", code); put("message", message)
            })
        }
    }

    override fun load() { super.load(); _instance = this }

    @PluginMethod
    fun startService(call: PluginCall) {
        val intent = Intent(context, WhoopBleService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
        else context.startService(intent)
        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun stopService(call: PluginCall) {
        context.stopService(Intent(context, WhoopBleService::class.java))
        isConnected = false; currentStateName = "Idle"
        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun getLatestSnapshot(call: PluginCall) {
        context.startService(Intent(context, WhoopBleService::class.java).setAction(WhoopBleService.ACTION_SNAP))
        call.resolve(JSObject().put("triggered", true))
    }

    @PluginMethod
    fun getConnectionStatus(call: PluginCall) {
        call.resolve(JSObject().apply {
            put("connected", isConnected); put("state", currentStateName)
            put("lastSync", lastSync); put("batteryPercent", lastBattery)
        })
    }

    @PluginMethod
    fun  requestBlePermissions(call: PluginCall) {
        val aliases = mutableListOf("btScan", "btConnect")
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) aliases.add("location")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) aliases.add("notifications")
        requestPermissionForAliases(aliases.toTypedArray(), call, "blePermissionsCallback")
    }

    @PermissionCallback
    private fun blePermissionsCallback(call: PluginCall) {
        val granted = getPermissionState("btScan")    == PermissionState.GRANTED &&
                      getPermissionState("btConnect") == PermissionState.GRANTED
        call.resolve(JSObject().put("granted", granted))
    }
}
