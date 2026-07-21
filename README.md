# BantayMuscles

Calorie and macro tracker. This repo holds two app projects:

| Folder | What it is |
| --- | --- |
| [`fittracker-app/`](fittracker-app) | Expo / React Native app (Android-first). The shipping product. |
| [`BantayMuscles-app(flutter)/`](BantayMuscles-app(flutter)) | Flutter version — not started yet. |

## Working on the Expo app

All app commands run from inside `fittracker-app`:

```bash
cd fittracker-app
npm install
npx expo start                            # dev (Expo Go)
eas build -p android --profile preview    # tester APK
```

Its own README, in that folder, has the full setup (Supabase, EAS, features).
