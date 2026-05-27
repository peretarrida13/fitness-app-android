-- Run this in the Supabase SQL Editor after 002_progress_tables.sql

create table public.activities (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  garmin_activity_id  text not null,
  activity_date       date not null,
  activity_type       text not null,            -- 'RUNNING', 'TREADMILL_RUNNING', etc.
  name                text,
  duration_seconds    int,
  distance_meters     float,
  avg_pace_sec_per_km float,                    -- null for non-running types
  avg_heart_rate      int,
  calories            int,
  elevation_gain_m    float,
  avg_cadence         int,
  synced_at           timestamptz default now() not null,
  unique(user_id, garmin_activity_id)
);

alter table public.activities enable row level security;
create policy "Users can read own activities"  on public.activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on public.activities for insert with check (auth.uid() = user_id);
create policy "Users can update own activities" on public.activities for update using (auth.uid() = user_id);
