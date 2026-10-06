# Temporary Shachris Demo

Share link: https://shachris-daily-session-demo.vercel.app

This standalone entry point renders the same Daily Live Session component used by Hadran. No login, school dashboard, real attendance history, Supabase client, database credentials, API functions, or DOB values are deployed. Everyone with the link can see the roster; no-index headers discourage indexing but are not access control.

The roster is a sanitized snapshot from 2026-10-06: 16 names, integer ages calculated in the database, primary grade assignments for filtering, and new demo-local IDs. Ages remain the snapshot ages. Actual birth dates and real student IDs were not exported. Rules match the Shachris configuration read on that date. Attendance, progression, override history, and session times are simulated, not copied from school records.

Changes are held only in memory in each visitor's browser. Refresh or the reset icon clears the entire demo. Reload Session reopens the current in-memory session. No changes are shared between visitors or saved to school data. Today/future choices simulate the existing UI contract; nothing survives a page refresh.

## Shared Daily Functionality (2026-10-06)

The same shared UI now supports factual late arrival plus Transportation/Excused/No Reason/Other, independent late excusal, Not Marked/Absent/Excused from Shul/Not in Shul, communal-only milestones, Ready for Check, explicit personal completion, and an extra-stay star. The real adapter stores these daily facts in the school database; this adapter simulates them only in memory. Changing today's required milestone is blocked after personal clearance. Extra stay starts only after clearance, stops while out, and resumes on return; no rewards or weekly UI are implemented.

## Shared Architecture

- `src/components/ShachrisWorkspace.tsx` is the single session UI for both Hadran and this app. It receives a `ShachrisBackend` rather than importing a database client. `liveOnly` removes settings/date navigation, and the standalone shell supplies no dashboard back-navigation.
- `src/services/shachrisBackend.ts` describes the session/settings/permission contract. Its service type imports are erased; they do not bundle the secure backend.
- `secureShachrisBackend` in `src/services/shachrisService.ts` retains the dashboard's authenticated Supabase behavior and server-enforced permissions. The settings editor receives its save operation through the same boundary.
- `createShachrisDemoBackend(roster, config)` creates isolated in-memory state for each app instance. The fixture roster is confined to this demo shell; it is not a shared school roster or a production fallback.
- A later standalone authenticated shell can load its authorized roster/settings and inject a backend without copying the UI. A future organization/division-aware backend must derive its scope from authenticated membership and enforce that scope on every read/write, including session IDs and histories, using server authorization and database isolation. UI role strings, roster filters, or a client-selected division are not security boundaries.
- No standalone login, organization/division schema, user management, or multi-tenant guarantees have been implemented. The existing dashboard database is unchanged; real multi-organization use will require a separately reviewed server/RLS design.

## Local Checks

Run from the repository root, using the existing dependency installation:

```bash
npm test -- src/services/__tests__/shachrisDemo.test.ts
npm run typecheck:shachris-demo
npm run build:shachris-demo
npx vite preview --config apps/shachris-demo/vite.config.ts --host 0.0.0.0 --port 5191 --strictPort
```

In another terminal:

```bash
node apps/shachris-demo/verify.browser.mjs
SHACHRIS_DEMO_URL=https://shachris-daily-session-demo.vercel.app/ node apps/shachris-demo/verify.browser.mjs
```

The build rejects unrelated school modules and Supabase dependencies. Its artifact audit rejects DOB fields/date literals, credentials, school APIs, source maps, and unexpected files. Browser checks exercise the simulated workflow, reset, filtering, mobile layouts, and no external/API requests. Screenshots go to `/tmp`, not the deployed artifact or repository.

## Dedicated Deployment

Vercel project: `shachris-daily-session-demo` (`prj_eCDDU0Bbnvkf3HszpvZ73Sp5uBZN`), team `akiva-klein-s-projects`. It is not Git-connected. Only the audited `dist` directory is uploaded; the root workspace's existing Vercel link must not be used. There are no environment variables required for this project.

```bash
npm run build:shachris-demo
VERCEL_ORG_ID=team_nh2loA9U7aYFO6xYZqlQyt33 VERCEL_PROJECT_ID=prj_eCDDU0Bbnvkf3HszpvZ73Sp5uBZN npx --yes vercel@59.26.0 deploy --cwd apps/shachris-demo/dist --prod --yes --scope akiva-klein-s-projects
```

The deployed artifact has only HTML, JS, CSS, and routing/header configuration. Unknown paths return 404. CSP blocks backend connections and framing; responses use no-store, no-referrer, and no-index headers. There is no automatic expiry. To retire the demo, delete **only** `shachris-daily-session-demo` and its deployments in Vercel; this removes the friendly and generated deployment URLs. Never delete or change the secure dashboard or other demo projects. Previously downloaded names/ages cannot be recalled.

## Verification On 2026-10-06

Before implementation, branch `yeshiva-ketana-secure` and pushed checkpoints `5210127`/`f85f013` were confirmed. Read-only live checks on `ednjpqtuttutoatahorn` confirmed the live-attendance schema, start/milestone RPCs, 16 stay snapshots in the original session, enabled RLS, and denied anonymous stay-history SELECT. The original session has since been started; this demo did not modify it or any school records. No migration was rerun.

The main production domain was verified separately: `yeshiva-ketana-secure.vercel.app` serves September 24 commit `3da4f9b`, not the October checkpoint. No main deployment or alias was changed.

All 345 repository tests pass after the personal-clearance update, as do the main/demo builds, standalone typecheck/privacy audit, focused Shachris lint, isolated SQL daily-fact save/reopen/security checks, dashboard synthetic browser regression, and public demo desktop/mobile workflow (including the late-reason popup). Root typecheck still reports the two previously documented errors in unchanged `teachingModeUtils.test.ts`. `AttendancePage.tsx` has seven pre-existing lint errors, confirmed against the pushed checkpoint; its adapter import/call change adds none. No full-project database advisory audit is claimed.