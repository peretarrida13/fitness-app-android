/**
 * WhoopConnectionState.kt
 * Sealed class for every phase of the Whoop 5.0 BLE connection state machine.
 * Ported from Goose's connectionState string states ("disconnected", "ready", "scanning" etc.)
 * with Added Android-specific states (CheckingRemembered, DiscoveringServices, EnablingNotifications).
 * stateName() and detail() drive the foreground notification and whoopStateChanged events.
 */
package com.peretarrida.fittracker.plugins.whoop

import android.bluetooth.BluetoothDevice

sealed class WhoopConnectionState {
    // Initial state before any BLE work
    object Idle : WhoopConnectionState()
    // Goose: loadRememberedDevice + startupReconnect — checking bonded/prefs before scanning
    object CheckingRemembered : WhoopConnectionState()
    // Goose: scanForPeripherals — actively scanning
    object Scanning : WhoopConnectionState()
    // Device found in scan, about to connect
    data class Found(val device: BluetoothDevice) : WhoopConnectionState()
    // connectGatt called, waiting for STATE_CONNECTED
    object Connecting : WhoopConnectionState()
    // discoverServices called, waiting for onServicesDiscovered
    object DiscoveringServices : WhoopConnectionState()
    // Subscribing to characteristics — Goose: subscribeToCharacteristics
    object EnablingNotifications : WhoopConnectionState()
    // Goose: connectionState = "ready"
    data class Connected(
        val deviceName: String,
        val batteryPercent: Int?,
        val firmwareVersion: String?,
    ) : WhoopConnectionState()
    // Device disconnected — service will auto-reconnect
    data class Disconnected(val reason: String) : WhoopConnectionState()
    // Unrecoverable error — service will retry after backoff
    data class Error(val code: Int, val message: String) : WhoopConnectionState()

    fun stateName(): String = when (this) {
        is Idle                  -> "Idle"
        is CheckingRemembered    -> "CheckingRemembered"
        is Scanning              -> "Scanning"
        is Found                 -> "Found"
        is Connecting            -> "Connecting"
        is DiscoveringServices   -> "DiscoveringServices"
        is EnablingNotifications -> "EnablingNotifications"
        is Connected             -> "Connected"
        is Disconnected          -> "Disconnected"
        is Error                 -> "Error"
    }

    fun detail(): String = when (this) {
        is Idle                  -> ""
        is CheckingRemembered    -> "Looking for your Whoop..."
        is Scanning              -> "Searching for Whoop 5.0..."
        is Found                 -> "Found ${device.name ?: "Whoop"}"
        is Connecting            -> "Connecting..."
        is DiscoveringServices   -> "Setting up connection..."
        is EnablingNotifications -> "Almost ready..."
        is Connected             -> "$deviceName · ${batteryPercent ?: "—"}%"
        is Disconnected          -> reason
        is Error                 -> "[$code] $message"
    }
}
