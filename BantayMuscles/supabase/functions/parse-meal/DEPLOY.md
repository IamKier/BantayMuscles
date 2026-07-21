# Deploying the `parse-meal` AI function

This function powers natural-language food logging ("2 itlog, kanin, adobo" →
foods with macros). It calls Gemini **server-side**, so the API key never ships
in the app.

You run these once, against your own Supabase project (`bgofzvzvfedrfcelrljs`).

## 1. Install the Supabase CLI (not yet installed)

- Windows (Scoop):  `scoop install supabase`
- or npm:           `npm i -g supabase`
- Docs: https://supabase.com/docs/guides/cli

## 2. Log in and link the project

```bash
supabase login
cd BantayMuscles
supabase link --project-ref bgofzvzvfedrfcelrljs
```

## 3. Set the Gemini key as a secret (never commit it)

Get a free key at https://aistudio.google.com  →  API keys.

```bash
supabase secrets set GEMINI_API_KEY=YOUR_KEY_HERE
```

(You can also set it in the dashboard: Project → Edge Functions → Secrets.)

## 4. Deploy the function

It authenticates with the app's anon/publishable key in the `apikey` header,
so JWT verification is disabled:

```bash
supabase functions deploy parse-meal --no-verify-jwt
```

## 5. Test it

```bash
curl -X POST "https://bgofzvzvfedrfcelrljs.supabase.co/functions/v1/parse-meal" \
  -H "apikey: <your anon/publishable key>" \
  -H "Content-Type: application/json" \
  -d '{"text":"2 boiled eggs and a cup of rice"}'
```

You should get `{"foods":[ ... ]}`. The **Log AI** button ships in app builds from
this commit onward — rebuild the app (`flutter build apk --release`) to get it.
After that, deploying/updating the function needs no app rebuild; the app just
calls this URL.

## Alternative: deploy via the Claude Supabase connector

If you reconnect the connector to the account that owns this project, I can
deploy the function for you — but you'd still set the `GEMINI_API_KEY` secret
yourself (there's no secret-setting tool over the connector).
