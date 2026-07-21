# BantayMuscles

Calorie and macro tracker. This repo holds two projects:

| Folder | What it is |
| --- | --- |
| [`fittracker-app/`](fittracker-app) | The mobile app — Expo / React Native (Android-first). This is the shipping product. |
| [`fittracker-webapp/`](fittracker-webapp) | The web app — not started yet. |

## Working on the mobile app

All the app commands run from inside `fittracker-app`:

```bash
cd fittracker-app
npm install
npx expo start        # dev (Expo Go)
eas build -p android --profile preview   # tester APK
```

Its own README, in that folder, has the full setup (Supabase, EAS, features).
