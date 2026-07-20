# FitTracker

A calorie and macro tracker built with Expo (SDK 57) and expo-router, designed for Android phones.
All data is stored locally on the device — no account, no network.

## Run it

```bash
npm install
npm run android      # or: npx expo start --android
```

Press `a` in the Expo dev server to open Android, or scan the QR code with Expo Go.

## Supabase setup (optional)

There are **no accounts**. Your diary and profile live on the device and are never
uploaded. Supabase is used for one thing only: serving the shared food catalog, which
is world-readable and needs no sign-in. Skip this section entirely and the app runs on
the bundled 55-item list instead.

1. In the Supabase SQL editor, run:
   - `supabase/migrations/0001_schema.sql` — creates the `foods` table and its RLS policy
   - `supabase/migrations/0002_seed_foods.sql` — the 55-item catalog
2. Copy `.env.example` to `.env` and fill in your project URL and anon key
   (Project Settings → Data API / API Keys).
3. Restart with `npx expo start --clear` so the new env vars are picked up.

Editing foods in the Supabase dashboard then updates every install without shipping a
new build. If the fetch fails for any reason, the app silently falls back to the
bundled list.

Notes:
- `EXPO_PUBLIC_*` values are compiled into the JS bundle, so they are public by design.
  Only the anon key belongs there; **never** the `service_role` key.
- `foods` is world-readable but has **no write policy** — the catalog can only be edited
  from the dashboard, never from a client.
- `0001_schema.sql` also creates `profiles` and `diary_entries` from when the app had
  accounts. They're unused now; `0003_drop_unused_auth_tables.sql` removes them if you
  want, but keeping them costs nothing.
- Regenerate the seed after editing `src/lib/foods.ts` rather than hand-editing the SQL.

## Features

- **Today** — calorie ring against your daily target, macro bars, and a diary split into
  breakfast / lunch / dinner / snacks. Move between days with the arrows in the header.
- **Add food** — search a built-in list of ~55 common foods (including Filipino staples and
  dishes), pick a serving count, and log it to any meal.
- **Progress** — 7-day calorie chart with your goal line, plus average intake and macros.
- **Profile** — sex, age, height, weight, activity level, and goal. The daily calorie target is
  derived from Mifflin-St Jeor BMR × activity factor, adjusted for your goal.

## Layout

```
src/
  app/                   expo-router screens (one file per tab)
    _layout.tsx          theme + TrackerProvider + tab navigator
    index.tsx            Today
    add.tsx              Add food
    progress.tsx         Progress
    profile.tsx          Profile
  components/            CalorieRing, MacroBar, Card, themed primitives
  constants/theme.ts     colors, spacing, macro palette
  hooks/use-tracker.tsx  diary + profile state, persisted to AsyncStorage
  lib/
    nutrition.ts         types and all calorie/macro math (pure)
    foods.ts             bundled food database + filtering
    storage.ts           AsyncStorage read/write
    supabase.ts          client, null when env vars are absent
    remote.ts            fetches the food catalog, falls back silently
supabase/migrations/     SQL to run against your project
```

## Notes

- Macro targets: protein scales with body weight (1.6–2.2 g/kg by goal), fat is 25% of calories,
  carbs take the remainder. The calorie target is floored at 1200 kcal.
- `lib/foods.ts` is a static list. To use a real food API, keep the `Food` type and replace
  `searchFoods` — nothing else needs to change.
