# FitTracker — Android / iOS

Mobile app version of FitTracker, built with Capacitor. The React + Vite web app runs inside a native WebView shell on Android and iOS.

## Prerequisites

- **Node.js ≥ 22** — Capacitor CLI requires it (`nvm install 22 && nvm use 22`)
- **Android Studio** — for Android emulator and signing
- **Xcode** (Mac only) — for iPhone simulator

## Running in the browser (fastest, no setup)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. In Chrome DevTools press **⌘+⇧+M** to enable mobile view.

---

## Running in the iPhone Simulator (Mac)

> Requires Xcode installed from the App Store.

### First-time setup

```bash
# 1. Install Xcode command line tools if prompted
xcode-select --install

# 2. Add the iOS Capacitor platform
npm install @capacitor/ios
npx cap add ios
```

### Every time you make changes

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Xcode opens. Select a simulator (e.g. **iPhone 16**) from the device dropdown at the top, then press **▶ Run**.

---

## Running on an Android Emulator

### First-time setup

```bash
# Finish Capacitor Android setup (after upgrading to Node 22)
npx cap init "FitTracker" "com.peretarrida.fittracker" --web-dir dist
npm run build
npx cap add android
# Then add the deep link intent-filter to android/app/src/main/AndroidManifest.xml (see TODO.md)
```

### Every time you make changes

```bash
npm run build:android   # builds + syncs into android/
npm run open:android    # opens Android Studio
```

In Android Studio: **Device Manager → Create Virtual Device → Pixel 8 → API 35 → ▶ Run**.

---

## Running on a physical Android device

1. Phone: **Settings → About Phone → tap "Build number" 7 times**
2. Phone: **Settings → Developer Options → USB Debugging → ON**
3. Plug in via USB, accept the prompt on the phone
4. In Android Studio, your phone appears in the device dropdown → press **▶ Run**

---

## Build commands

```bash
npm run dev             # web dev server (browser)
npm run build           # production web build → dist/
npm run build:android   # web build + sync into Android project
npm run open:android    # open Android Studio
```

## Environment variables

Same as the web project — fill in `.env.local`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_APP_PASSWORD=
```

## Deployment

See `TODO.md` for the full Play Store deployment checklist.

## Related

- Web app → `~/Desktop/fitness-app`
