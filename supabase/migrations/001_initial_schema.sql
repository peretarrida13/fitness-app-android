-- Run this in the Supabase SQL Editor at: supabase.com → Project → SQL Editor

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- -------------------------------------------------------

create table public.oauth_tokens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  provider       text not null,
  access_token   text not null,
  token_secret   text not null,
  garmin_user_id text,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null,
  unique(user_id, provider)
);

alter table public.oauth_tokens enable row level security;
create policy "Users can read own tokens"   on public.oauth_tokens for select using (auth.uid() = user_id);
create policy "Users can insert own tokens" on public.oauth_tokens for insert with check (auth.uid() = user_id);
create policy "Users can update own tokens" on public.oauth_tokens for update using (auth.uid() = user_id);

-- -------------------------------------------------------

create table public.workout_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  logged_date   date not null,
  gym_day_index int not null,
  notes         text,
  logged_at     timestamptz default now() not null,
  unique(user_id, logged_date)
);

alter table public.workout_logs enable row level security;
create policy "Users can read own logs"   on public.workout_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.workout_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs" on public.workout_logs for delete using (auth.uid() = user_id);
create policy "Users can update own logs" on public.workout_logs for update using (auth.uid() = user_id);

-- -------------------------------------------------------

create table public.daily_activity (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  activity_date      date not null,
  steps              int default 0,
  active_calories    int default 0,
  resting_heart_rate int,
  total_calories     int default 0,
  distance_meters    float default 0,
  synced_at          timestamptz default now() not null,
  unique(user_id, activity_date)
);

alter table public.daily_activity enable row level security;
create policy "Users can read own activity"   on public.daily_activity for select using (auth.uid() = user_id);
create policy "Users can insert own activity" on public.daily_activity for insert with check (auth.uid() = user_id);
create policy "Users can update own activity" on public.daily_activity for update using (auth.uid() = user_id);

-- -------------------------------------------------------

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
