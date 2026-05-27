# Deployment TODO

## Step 1 — Supabase (required for everything)

- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] SQL Editor → run migrations in order:
  - [ ] `supabase/migrations/001_initial_schema.sql`
  - [ ] `supabase/migrations/002_progress_tables.sql`
  - [ ] `supabase/migrations/003_activities.sql`
- [ ] Project Settings → API → copy `Project URL` and `anon public` key
- [ ] Authentication → URL Configuration → add your Netlify URL to **Site URL** and **Redirect URLs**

## Step 2 — Deploy to Netlify

- [ ] Go to [netlify.com](https://netlify.com) → Add new site → Import from Git → GitHub → pick `fitness-app` repo (branch `master`)
- [ ] Site settings → Environment variables → add:
  - [ ] `VITE_SUPABASE_URL` — from Step 1
  - [ ] `VITE_SUPABASE_ANON_KEY` — from Step 1
  - [ ] `VITE_APP_PASSWORD` — any password you want for the app gate
  - [ ] `VITE_GOOGLE_CLIENT_ID` — can leave blank for now, add later
- [ ] Deploy and note your Netlify URL (e.g. `https://your-site.netlify.app`)

## Step 3 — Wire Supabase redirect back to Netlify

- [ ] Supabase → Authentication → URL Configuration:
  - [ ] **Site URL**: `https://your-site.netlify.app`
  - [ ] **Redirect URLs**: add `https://your-site.netlify.app/**`

> After this step the app is fully functional (login, calendar, workout logging, progress tracking).

---

## Step 4 — Google Calendar (optional)

- [ ] [Google Cloud Console](https://console.cloud.google.com) → create project → enable **Google Calendar API**
- [ ] APIs & Services → Credentials → Create OAuth client ID → Web application
- [ ] Add `https://your-site.netlify.app` to **Authorized JavaScript origins**
- [ ] Copy Client ID → add `VITE_GOOGLE_CLIENT_ID` in Netlify env vars → redeploy

## Step 5 — Garmin sync (optional)

> Requires a Garmin developer account. Approval is usually within a day for personal projects.

- [ ] Register at [developer.garmin.com/health-api](https://developer.garmin.com/health-api/overview/) and create an app to get Consumer Key + Secret
- [ ] Set Garmin OAuth callback URL to: `https://<your-supabase-ref>.supabase.co/functions/v1/garmin-oauth-callback`
- [ ] Supabase → Edge Functions → Manage secrets → add:
  - [ ] `GARMIN_CONSUMER_KEY`
  - [ ] `GARMIN_CONSUMER_SECRET`
  - [ ] `APP_URL` = `https://your-site.netlify.app`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role key)
- [ ] Deploy the 3 edge functions:
  ```bash
  supabase login
  supabase link --project-ref <your-project-ref>
  supabase functions deploy garmin-request-token
  supabase functions deploy garmin-oauth-callback
  supabase functions deploy garmin-sync
  ```
