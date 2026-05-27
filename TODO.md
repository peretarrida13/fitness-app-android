# Deployment TODO

## Step 1 — Supabase (required for everything)

- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] SQL Editor → run migrations in order:
  - [ ] `supabase/migrations/001_initial_schema.sql`
  - [ ] `supabase/migrations/002_progress_tables.sql`
  - [ ] `supabase/migrations/003_activities.sql`
- [ ] Project Settings → API → copy `Project URL` and `anon public` key
- [ ] Authentication → URL Configuration → add redirect URLs:
  - [ ] `com.peretarrida.fittracker://auth/callback`
  - [ ] `com.peretarrida.fittracker://oauth/google`
  - [ ] `com.peretarrida.fittracker://oauth/garmin`

## Step 2 — Finish Capacitor setup (requires Node ≥ 22)

- [ ] Upgrade Node: `nvm install 22 && nvm use 22`
- [ ] `npx cap init "FitTracker" "com.peretarrida.fittracker" --web-dir dist`
- [ ] `npm run build`
- [ ] `npx cap add android`
- [ ] Edit `android/app/src/main/AndroidManifest.xml` — add inside `<activity>`:
  ```xml
  <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="com.peretarrida.fittracker" />
  </intent-filter>
  ```
- [ ] `npx cap sync android`

## Step 3 — Google Calendar (optional)

- [ ] [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0 Web Client → add to Authorized redirect URIs:
  - [ ] `com.peretarrida.fittracker://oauth/google`
- [ ] Add `VITE_GOOGLE_CLIENT_ID` to `.env.local`

## Step 4 — Garmin sync (optional)

- [ ] Register at [developer.garmin.com/health-api](https://developer.garmin.com/health-api/overview/) and create an app to get Consumer Key + Secret
- [ ] Set Garmin OAuth callback URL to: `https://<your-supabase-ref>.supabase.co/functions/v1/garmin-oauth-callback`
- [ ] Supabase → Edge Functions → Manage secrets → add:
  - [ ] `GARMIN_CONSUMER_KEY`
  - [ ] `GARMIN_CONSUMER_SECRET`
  - [ ] `APP_URL` = your Netlify URL
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role key)
- [ ] Deploy the edge functions:
  ```bash
  supabase login
  supabase link --project-ref <your-project-ref>
  supabase functions deploy garmin-request-token
  supabase functions deploy garmin-oauth-callback
  supabase functions deploy garmin-sync
  ```

---

## Step 5 — Build signed AAB

- [ ] `npm run open:android` — Android Studio opens
- [ ] **Build → Generate Signed Bundle / APK → Android App Bundle**
- [ ] Create a keystore at `~/keystores/fittracker.jks`
  - **Back this up somewhere safe** (iCloud, password manager). Losing it means you can never update the app on Play Store.
- [ ] Build variant: `release`
- [ ] Output: `android/app/release/app-release.aab`

## Step 6 — Google Play Store

- [ ] Go to [play.google.com/console](https://play.google.com/console) — pay the one-time $25 fee if not done yet
- [ ] **Create app** → fill in:
  - [ ] App name: FitTracker
  - [ ] Default language
  - [ ] App type: App
  - [ ] Free or paid
- [ ] **Store presence → Main store listing** → add:
  - [ ] Short description (max 80 chars)
  - [ ] Full description (max 4000 chars)
  - [ ] At least 2 phone screenshots (1080×1920 or 16:9)
  - [ ] Feature graphic (1024×500 PNG)
  - [ ] App icon (512×512 PNG, no rounded corners — Play Console adds them)
- [ ] **Policy → App content** → complete the IARC content rating questionnaire
- [ ] **Testing → Internal testing** → Create release → upload `app-release.aab` → add your email as tester → roll out
- [ ] Install the internal testing build on your phone and verify:
  - [ ] Magic link login works (tapping email link opens the app)
  - [ ] Google Calendar OAuth works
  - [ ] Garmin OAuth works
- [ ] **Production → Create release** → upload AAB → Submit for review

> Google review typically takes 1–3 days for the first submission.
