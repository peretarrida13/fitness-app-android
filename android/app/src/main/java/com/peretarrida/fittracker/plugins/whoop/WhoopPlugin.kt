/**
 * WhoopPlugin.kt
 * Capacitor plugin bridge: React ↔ native WhoopBleService.
 * Plugin name "Whoop". Registers with @CapacitorPlugin and exposes 5 @PluginMethod methods.
 * Static notifyListeners helpers allow WhoopBleService to emit events to React without a ref.
 * Imports: @capacitor/android, WhoopBleService, WhoopAlgorithms
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
        Permission(strings = [Manifest.permission.BLUETOOTH_SCAN], alias = "btScan"),
        Permission(strings = [Manifest.permission.BLUETOOTH_CONNECT], alias = "btConnect"),
        Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications"),
    ],
)
class WhoopPlugin : Plugin() {

    companion object {
        private var _instance: WhoopPlugin? = null
        private const val TAG = "WhoopPlugin"

        fun emitConnected(deviceName: String, batteryPercent: Int) {
            _instance?.notifyListeners("whoopConnected", JSObject().apply {
                put("deviceName", deviceName)
                put("batteryPercent", batteryPercent)
            })
        }

        fun emitDisconnected(reason: String) {
            _instance?.notifyListeners("whoopDisconnected", JSObject().apply {
                put("reason", reason)
            })
        }

        fun emitSnapshot(snapshot: WhoopSnapshot) {
            val js = JSObject().apply {
                put("timestamp", snapshot.timestamp)
                put("heartRate", snapshot.heartRate)
                snapshot.hrv?.let { put("hrv", it) } ?: put("hrv", null as String?)
                put("spO2", snapshot.spO2)
                put("skinTempCelsius", snapshot.skinTempCelsius)
                put("accelMagnitude", snapshot.accelMagnitude)
                snapshot.recoveryScore?.let { put("recoveryScore", it) }
                snapshot.recoveryLevel?.let { put("recoveryLevel", it) }
                put("strainScore", snapshot.strainScore)
                put("strainLevel", snapshot.strainLevel)
                put("sleepStage", snapshot.sleepStage)
                put("batteryPercent", snapshot.batteryPercent)
                put("batteryCharging", snapshot.batteryCharging)
                put("deviceConnected", snapshot.deviceConnected)
            }
            _instance?.notifyListeners("whoopSnapshot", js)
        }

        fun emitError(code: String, message: String) {
            _instance?.notifyListeners("whoopError", JSObject().apply {
                put("code", code)
                put("message", message)
            })
        }
    }

    override fun load() {
        super.load()
        _instance = this
    }

    @PluginMethod
    fun startService(call: PluginCall) {
        val intent = Intent(context, WhoopBleService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        Log.i(TAG, "WhoopBleService started")
        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun stopService(call: PluginCall) {
        context.stopService(Intent(context, WhoopBleService::class.java))
        Log.i(TAG, "WhoopBleService stopped")
        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun getLatestSnapshot(call: PluginCall) {
        // Trigger an immediate snapshot via the service
        val intent = Intent(context, WhoopBleService::class.java)
            .setAction(WhoopBleService.ACTION_GET_SNAPSHOT)
        context.startService(intent)
        call.resolve(JSObject().put("triggered", true))
    }

    @PluginMethod
    fun getConnectionStatus(call: PluginCall) {
        call.resolve(JSObject().apply {
            put("connected", false)   // updated by whoopConnected event
            put("lastSync", Instant.now().toString())
            put("batteryPercent", 0)
        })
    }

    @PluginMethod
    fun requestBlePermissions(call: PluginCall) {
        val aliases = mutableListOf("btScan", "btConnect")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) aliases.add("notifications")
        requestPermissionForAliases(aliases.toTypedArray(), call, "blePermissionsCallback")
    }

    @PermissionCallback
    private fun blePermissionsCallback(call: PluginCall) {
        val allGranted = getPermissionState("btScan") == PermissionState.GRANTED &&
            getPermissionState("btConnect") == PermissionState.GRANTED
        call.resolve(JSObject().put("granted", allGranted))
    }
}
