# FitTracker — Android App

Same stack as `fitness-app/` + Capacitor 8 for Android/iOS packaging.
App ID: `com.peretarrida.fittracker`

## Commands

```bash
npm run dev              # dev server → http://localhost:5173
npm run build            # tsc -b && vite build
npm run build:android    # build + npx cap sync android
npm run open:android     # open Android Studio
npm run lint             # ESLint
```

## How this app differs from `fitness-app/`

This app is a native-adapted fork of the web app. Key differences:

**Missing (web-only):**
- No `HomePage` (default route is `/meals`)
- No `SettingsPage`
- No `useWaterStore`, `useExtrasStore`, `useCalendarStore`
- No `@react-oauth/google` — replaced by Capacitor browser OAuth flow
- `useMealLogs.ts` may differ slightly

**Added for native:**
- `@capacitor/core`, `@capacitor/android`, `@capacitor/app`, `@capacitor/browser`, `@capacitor/cli`
- `src/lib/platform.ts` — platform detection helpers
- `src/hooks/useGoogleAuth.ts` — Android-specific Google OAuth via `@capacitor/browser`
- `appUrlOpen` listener in `src/main.tsx` for deep-link handling

**Auth flow differences:**
- Magic-link redirect URI switches on `isNative()`:
  - Native: `com.peretarrida.fittracker://auth/callback`
  - Web: `window.location.origin`
- Google Calendar OAuth uses Capacitor browser plugin + deep-link instead of web popup

## Platform utilities (`src/lib/platform.ts`)

```typescript
import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const APP_SCHEME = 'com.peretarrida.fittracker'
export const ANDROID_REDIRECT_URI = `${APP_SCHEME}://auth/callback`
export const WEB_REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin : ''
```

Always use `isNative()` to branch between native and browser behavior. Never hard-code a platform.

## Android OAuth pattern (`useGoogleAuth.ts`)

The Android app cannot use `@react-oauth/google` (requires popup). Instead:

1. Generate CSRF state, store in `sessionStorage`
2. Open Google OAuth URL via `Browser.open()` from `@capacitor/browser`
3. Listen for `appUrlOpen` event via `CapApp.addListener()` — fires when the app receives the deep-link
4. Verify state, extract `access_token` from URL hash fragment
5. **Remove the listener immediately** after handling — prevents listener leaks

## Capacitor config (`capacitor.config.ts`)

```typescript
const config: CapacitorConfig = {
  appId: 'com.peretarrida.fittracker',
  appName: 'FitTracker',
  webDir: 'dist',
  server: { androidScheme: 'https' },
}
```

`androidScheme: 'https'` is required — Supabase auth callbacks need HTTPS cookies.

## Build & deploy workflow

### Development (test in browser first)

```bash
npm run dev
```

Capacitor wraps the web app. If a feature works in the browser, it will work on device.

### Android build

```bash
npm run build:android   # runs: tsc -b && vite build && npx cap sync android
npm run open:android    # opens Android Studio
```

In Android Studio: **Build → Generate Signed Bundle/APK**

### After adding npm packages or changing `capacitor.config.ts`

```bash
npx cap sync android
```

**Always build before syncing** — `cap sync` copies `dist/`. Syncing without building deploys a stale bundle.

## Supabase migrations

This app has 3 migrations (subset of the web app's 6):
- `001_initial_schema.sql`
- `002_progress_tables.sql`
- `003_activities.sql`

Migrations 004–006 (habits, shopping, meal_logs) are in `fitness-app/supabase/migrations/`. Copy and run them if those features are needed on Android.

## Porting a web feature to Android

1. Copy the types file, hook, and component directory from `fitness-app/src/` to this app's `src/`
2. Audit for `window.location` usage — replace with `isNative()` + appropriate redirect
3. Audit for `@react-oauth/google` usage — replace with `useGoogleAuth.ts` Capacitor flow
4. Run `npm run build:android` to catch TypeScript errors before testing on device
5. Test on device or emulator via Android Studio

## Common Capacitor pitfalls

- **Deep links not firing**: verify the app scheme is in `AndroidManifest.xml` (Capacitor handles this, but check after `cap sync`)
- **HTTPS required**: `androidScheme: 'https'` in config ensures requests are treated as secure by Supabase
- **Use `Browser` plugin, not WebView**: external OAuth must open in the `Browser` plugin so the OS can redirect back via the URL scheme
- **Listener leak**: always call `listener.remove()` after handling the `appUrlOpen` deep-link
- **Never edit `android/` directly**: Capacitor generates this directory — changes are overwritten on next `cap sync`
- **Build artifacts stale**: if the device shows old UI, run `npm run build:android` and reinstall the APK
