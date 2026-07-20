-- OPTIONAL CLEANUP — read before running.
--
-- The app no longer has accounts: the diary and profile live on the device, and
-- Supabase serves only the shared `foods` catalog. That leaves the per-user
-- tables from 0001 unused.
--
-- This DROPS them and everything in them. Both were empty when auth was removed,
-- but verify for yourself before running:
--
--   select count(*) from public.profiles;
--   select count(*) from public.diary_entries;
--
-- Skip this file entirely if you might add accounts back later — unused empty
-- tables cost nothing to keep.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_username_available(text);

drop table if exists public.diary_entries;
drop table if exists public.profiles;
