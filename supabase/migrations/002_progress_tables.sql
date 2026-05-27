-- Run this in the Supabase SQL Editor after 001_initial_schema.sql

-- Body weight log
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  weight_kg   numeric(5,2) not null,
  note        text,
  created_at  timestamptz default now() not null,
  unique(user_id, logged_date)
);
alter table public.weight_logs enable row level security;
create policy "Users can read own weight" on public.weight_logs for select using (auth.uid() = user_id);
create policy "Users can insert own weight" on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own weight" on public.weight_logs for update using (auth.uid() = user_id);
create policy "Users can delete own weight" on public.weight_logs for delete using (auth.uid() = user_id);

-- Body measurements
create table public.measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  waist_cm    numeric(5,1),
  chest_cm    numeric(5,1),
  left_arm_cm numeric(5,1),
  hips_cm     numeric(5,1),
  note        text,
  created_at  timestamptz default now() not null,
  unique(user_id, logged_date)
);
alter table public.measurements enable row level security;
create policy "Users can read own measurements" on public.measurements for select using (auth.uid() = user_id);
create policy "Users can insert own measurements" on public.measurements for insert with check (auth.uid() = user_id);
create policy "Users can update own measurements" on public.measurements for update using (auth.uid() = user_id);
create policy "Users can delete own measurements" on public.measurements for delete using (auth.uid() = user_id);

-- Personal records (one row per attempt, so history is preserved)
create table public.personal_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  weight_kg     numeric(6,2) not null,
  reps          int not null,
  logged_date   date not null,
  note          text,
  created_at    timestamptz default now() not null
);
alter table public.personal_records enable row level security;
create policy "Users can read own PRs" on public.personal_records for select using (auth.uid() = user_id);
create policy "Users can insert own PRs" on public.personal_records for insert with check (auth.uid() = user_id);
create policy "Users can delete own PRs" on public.personal_records for delete using (auth.uid() = user_id);

-- Extend daily_activity with extra Garmin fields
alter table public.daily_activity add column if not exists stress_avg        int;
alter table public.daily_activity add column if not exists active_seconds    int default 0;
alter table public.daily_activity add column if not exists hrv_rmssd         numeric(6,2);
alter table public.daily_activity add column if not exists body_battery_low  int;
alter table public.daily_activity add column if not exists floors_climbed    int default 0;
