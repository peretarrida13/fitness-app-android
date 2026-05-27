# Setup Guide

## Step 1 — Supabase (required for everything)

1. Go to [supabase.com](https://supabase.com), create a new project
2. Go to **SQL Editor** and run both migration files **in order**:
   - `supabase/migrations/001_initial_schema.sql` (auth, workout logs, Garmin tokens)
   - `supabase/migrations/002_progress_tables.sql` (weight, measurements, PRs, health columns)
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
4. Paste both into `.env.local` (file already exists at project root)
5. In Supabase → **Authentication → Providers → Email**, make sure "Enable Email" is on and "Confirm email" can be off for magic link

## Step 2 — Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or reuse an existing one)
3. Enable the **Google Calendar API**: APIs & Services → Library → search "Google Calendar API" → Enable
4. Create OAuth credentials: APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173` (add your production URL too when deploying)
5. Copy the **Client ID** into `.env.local` as `VITE_GOOGLE_CLIENT_ID`

## Step 3 — Garmin (requires developer approval)

> Note: Garmin's Health API requires registering a developer application. Approval is usually quick for personal projects.

1. Go to [developer.garmin.com/health-api](https://developer.garmin.com/health-api/overview/) and register an account
2. Create a new application to get your **Consumer Key** and **Consumer Secret**
3. Set the OAuth callback URL to: `https://<your-supabase-project>.supabase.co/functions/v1/garmin-oauth-callback`
4. In Supabase Dashboard → **Edge Functions → Manage secrets**, add:
   - `GARMIN_CONSUMER_KEY`
   - `GARMIN_CONSUMER_SECRET`
   - `APP_URL` — your app's base URL (e.g. `http://localhost:5173` for local dev)
   - `SUPABASE_SERVICE_ROLE_KEY` — found in Supabase → Project Settings → API → service_role key
5. Install the Supabase CLI if you haven't: `npm install -g supabase`
6. Login and link your project:
   ```
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
7. Deploy the three Edge Functions:
   ```
   supabase functions deploy garmin-request-token
   supabase functions deploy garmin-oauth-callback
   supabase functions deploy garmin-sync
   ```

## .env.local reference

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
VITE_APP_PASSWORD=<your-password>
```

## What works at each step

| Step completed | Features unlocked |
|---|---|
| Step 1 only | Magic link login, calendar week view, workout logging, workout history |
| Step 1 + 2 | All above + Google Calendar events in calendar day cells |
| Step 1 + 3 | All above + Garmin steps/calories sync |
| All three | Full feature set |
