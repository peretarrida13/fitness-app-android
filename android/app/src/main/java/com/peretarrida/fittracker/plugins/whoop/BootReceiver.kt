/**
 * BootReceiver.kt
 * Restarts WhoopBleService after device boot so data collection resumes without user action.
 * Requires RECEIVE_BOOT_COMPLETED permission and android:exported="true" in manifest.
 */
package com.peretarrida.fittracker.plugins.whoop

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        Log.i("BootReceiver", "Boot completed — starting WhoopBleService")
        val svc = Intent(context, WhoopBleService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svc)
        } else {
            context.startService(svc)
        }
    }
}
