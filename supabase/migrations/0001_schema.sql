-- FitTracker schema: shared food catalog + per-user profile and diary.
-- Run this in the Supabase SQL editor (or `supabase db push`) before starting the app.

-- ---------------------------------------------------------------------------
-- foods: shared, read-only catalog. Everyone reads the same rows.
-- ---------------------------------------------------------------------------
create table if not exists public.foods (
  id          text primary key,
  name        text not null,
  serving     text not null,
  calories    integer not null check (calories >= 0),
  protein     integer not null check (protein  >= 0),
  carbs       integer not null check (carbs    >= 0),
  fat         integer not null check (fat      >= 0),
  created_at  timestamptz not null default now()
);

-- Case-insensitive substring search on name (matches the app's searchFoods).
create extension if not exists pg_trgm;
create index if not exists foods_name_trgm_idx on public.foods using gin (name gin_trgm_ops);

alter table public.foods enable row level security;

drop policy if exists "foods are readable by everyone" on public.foods;
create policy "foods are readable by everyone"
  on public.foods for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policy: the catalog is curated via the dashboard or
-- the service role key, never from the client.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds the goal inputs.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users on delete cascade,
  sex              text    not null default 'male'     check (sex in ('male','female')),
  age              integer not null default 30         check (age between 13 and 120),
  height_cm        integer not null default 170        check (height_cm between 80 and 250),
  weight_kg        numeric not null default 70         check (weight_kg between 25 and 400),
  activity         text    not null default 'light'    check (activity in ('sedentary','light','moderate','active','athlete')),
  goal             text    not null default 'maintain' check (goal in ('lose','maintain','gain')),
  custom_calories  integer check (custom_calories is null or custom_calories >= 1000),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Give every new signup a profile row so the app never reads an empty result.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- diary_entries: one row per logged food.
-- Macros are denormalized on purpose — a food's values may be corrected later,
-- but what you ate that day should not silently change.
-- ---------------------------------------------------------------------------
create table if not exists public.diary_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  entry_date  date not null,
  meal        text not null check (meal in ('breakfast','lunch','dinner','snack')),
  name        text not null,
  serving     text not null,
  servings    numeric not null check (servings > 0),
  calories    integer not null check (calories >= 0),
  protein     integer not null check (protein  >= 0),
  carbs       integer not null check (carbs    >= 0),
  fat         integer not null check (fat      >= 0),
  created_at  timestamptz not null default now()
);

-- The app's hot path: "everything I ate on this day".
create index if not exists diary_entries_user_date_idx
  on public.diary_entries (user_id, entry_date desc);

alter table public.diary_entries enable row level security;

drop policy if exists "users read own entries" on public.diary_entries;
create policy "users read own entries"
  on public.diary_entries for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users insert own entries" on public.diary_entries;
create policy "users insert own entries"
  on public.diary_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users update own entries" on public.diary_entries;
create policy "users update own entries"
  on public.diary_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users delete own entries" on public.diary_entries;
create policy "users delete own entries"
  on public.diary_entries for delete to authenticated
  using ((select auth.uid()) = user_id);
