# School Dashboard Public Demo

Public, no-login blueprint built from the fixture-only `f7ca09c` snapshot.

## Safety boundary

- All displayed records are hardcoded sample fixtures.
- The app has no Supabase dependency or environment configuration.
- The app makes no external data or API calls.
- The app includes no serverless functions or authentication gate.
- `npm run build` audits both source and compiled output for forbidden integrations.

This branch must remain deployed through its own Vercel project. Do not link it to the secure dashboard project.