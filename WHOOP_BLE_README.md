# Whoop 5.0 BLE Pipeline

Native Android data pipeline for the Whoop 5.0, operating without a Whoop subscription.
BLE data is processed locally on-device, then POSTed to Railway every 5 minutes.

## Project structure

```
fitness-app-android/
  android/app/src/main/java/com/peretarrida/fittracker/plugins/whoop/
    WhoopGattProfile.kt     — all BLE UUIDs, command codes, CRC functions
    WhoopPacketDecoder.kt   — decode type-47 (historical), type-40 (realtime), IMU, battery
    WhoopAlgorithms.kt      — rMSSD, strain (TRIMP/0–21), sleep staging, recovery score
    WhoopSnapshot.kt        — BiometricReading, WhoopSnapshot, BatteryReading data classes
    WhoopBleBuffers.kt      — rolling buffers, metric computation, OkHttp POST to Railway
    WhoopBleHandler.kt      — BLE notification routing, historical dump state machine
    WhoopBleManager.kt      — scanning, GATT connection, backoff reconnect
    WhoopBleService.kt      — Android foreground service (WAKE_LOCK, AlarmManager restart)
    WhoopPlugin.kt          — Capacitor plugin bridge (startService, events → React)
    BootReceiver.kt         — restart service on device boot
  src/
    plugins/whoop.ts        — typed Capacitor plugin wrapper
    hooks/useWhoop.ts       — React hook (permissions → start → events → POST /ingest)
    components/whoop/
      WhoopDashboard.tsx    — 5 metric cards + sessions + 7-day SVG chart
      WhoopChart.tsx        — pure SVG bar chart, no libraries

ble-backend/               — Railway Flask backend (receives /ingest from Android)
  app.py                   — Flask API (POST /ingest + 9 GET endpoints)
  cache.py                 — in-memory INGEST_BUFFER + CACHE, rebuilt on each ingest
  storage.py               — SQLite WAL persistence
  algorithms.py            — Python ports of Kotlin algorithms (cross-check)
  test_ingest.py           — local end-to-end test (5 fake POSTs + all GET checks)
  test_ble_scan.py         — BLE scan for Whoop service UUID using bleak
```

## GATT protocol reference

| UUID | Direction | Purpose |
|---|---|---|
| `61080001-…` | — | Primary Whoop service |
| `61080002-…` | host → strap | Write commands |
| `61080003-…` | strap → host | Command responses (notify) |
| `61080004-…` | strap → host | Events (notify) |
| `61080005-…` | strap → host | Real-time + historical data (notify) |

Frame format: `[0xAA][len_lo][len_hi][CRC-8 of len][body bytes][CRC-32 of body]`

> **SpO2 and skin temperature** are NOT directly readable from BLE.
> They require server-side signal processing of raw optical PPG and thermistor ADC data.
> Both fields are 0.0 in current snapshots. HR + RR intervals + IMU are fully reliable.

## Backend: local setup

```bash
cd ble-backend/
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py                  # starts on :5000
# in another terminal:
python test_ingest.py          # sends 5 fake snapshots, checks all endpoints
```

## Backend: deploy to Railway

1. Push `ble-backend/` to a GitHub repo
2. New Railway project → deploy from repo
3. Set env var: `DB_PATH=/data/whoop.db`
4. Add a Railway Volume at `/data` for SQLite persistence across redeploys
5. Verify: `GET https://your-url.railway.app/health`

## Android plugin: connect to existing app

The plugin is already registered in `MainActivity.java` and declared in `AndroidManifest.xml`.

**Before building:**
1. Set `RAILWAY_BASE_URL` in `WhoopGattProfile.kt` to your deployed Railway URL
2. Set `VITE_RAILWAY_URL` in `.env.local` for the React hook

**Build and run on Pixel 10:**
```bash
npm run build:android         # tsc + vite build + cap sync
npm run open:android          # open Android Studio
# Run → select connected Pixel 10
```

**Note on `android/` directory:** Capacitor's `cap sync` updates web assets and bridge files
but does NOT delete custom Kotlin files under `plugins/whoop/`. The plugin is safe across syncs.

## First-run checklist

1. App opens on Pixel 10
2. Permission dialog appears for Bluetooth Scan + Bluetooth Connect + Notifications
3. Grant all → foreground service starts → notification appears: "Whoop syncing — Searching…"
4. Put Whoop on wrist, ensure not connected to another device
5. Within 30 seconds: notification changes to "Whoop syncing — Connected"
6. After 5 minutes: `GET /health` shows `device_connected: true, ingest_age_minutes: ~5`
7. `GET /today` shows real recovery/strain/battery data

## Battery optimisation (critical for background operation)

On Pixel 10: **Settings → Apps → FitTracker → Battery → Unrestricted**

Without this, Android may kill the foreground service after ~30 minutes.
The `AlarmManager` restart in `WhoopBleService.onDestroy()` will recover it,
but there will be a 30-second gap in data collection.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Whoop device not connected" | BLE scan not finding device | Check device not paired elsewhere; Whoop worn |
| Foreground service killed | Battery optimisation aggressive | Set to Unrestricted |
| `device_connected: false` on /health | Service crashed | Check Logcat for `WhoopBleService`; restart app |
| `ingest_age_minutes > 15` | Upload failing | Check RAILWAY_BASE_URL; check Railway logs for /ingest errors |
| BLE permissions denied on Android 13+ | Permission not requested | Grant in Settings → Apps → FitTracker → Permissions |
| SQLite data lost on Railway redeploy | Railway ephemeral FS | Add Railway Volume mounted at `/data`, set `DB_PATH=/data/whoop.db` |
| Historical dump never completes | HISTORY_COMPLETE metadata not received | Check BLE bonding; some firmware versions require "just works" bonding |

## Algorithm sources

- rMSSD: Task Force (1996) standard — openwhoop-algos (bWanShiTong/openwhoop)
- Strain: Edwards TRIMP zones, `21 × ln(TRIMP+1) / ln(7201)` — openwhoop-algos/strain.rs
- Sleep staging: stillness + autonomic classifier — openwhoop-algos/sleep.rs
- Recovery: HRV-ratio + HR-delta + sleep composite — openwhoop-algos/stress.rs
- Packet layout: bWanShiTong/reverse-engineering-whoop, madhursatija/whoof PROTOCOL.md
