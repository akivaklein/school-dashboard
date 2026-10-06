# Shachris: First Checkpoint

Branch: `yeshiva-ketana-secure`. Student Events and Weekly Record are not implemented yet.

## Current Status

The Live Session, individual expectations/progression, basic settings, and editable regular DOB/age are implemented and the targeted schema is deployed to the secure backing project `ednjpqtuttutoatahorn`. Browser layout verification uses synthetic students; deployed RPCs were also verified against the real roster under authenticated leadership permissions in a fully rolled-back transaction.

On 2026-10-05, `supabase/migrations/20261005_shachris_checkpoint.sql` and the reviewed `docs/20261005_shachris_dob_import.sql` were applied via targeted `db query --linked --file` commands. All 16 DOBs were verified afterward. The active roster is eight students in 7th grade and eight in 8th grade. The user explicitly confirmed seven name aliases before import; each import row is pinned to its reviewed student ID. No fuzzy matching or student renaming was performed.

Existing-data counts and hashes matched before/after, excluding only the authorized new DOB field: 60 students, 28 staff, 17 primary class assignments, 224 teacher/rebbe assignments, 17 setup assignments, 8 classes, 4 instructional groups, 32 memberships, 2 legacy Davening templates, 5 legacy checklists, and 0 legacy marks. No Hebrew DOB or optional contact fields were added.

The earlier secondary **Davening Progress** defaults remain grade-only, sourced exclusively from `student_class_assignments` (`yk-b` = 7th, `yk-a` = 8th); instructional groups only filter visibility. The new primary **stay requirement** rules use the actual ages 11/12/13 and the communal milestones. Manual individual stay overrides take priority.

## Daily Live Session Safe Checkpoint

The shared Daily Live Session follows `.github/mockups/live-session.png`: Start Hodu, communal milestone strip, summary counts, compact student cards, and a collapsed secondary Davening Progress area. Requirements are age 11 → Shemoneh Esrei, age 12 → Chazaras HaShatz, age 13 → End Davening; manual overrides remain Today only or Today and future. Since the 2026-10-06 personal-clearance update, communal milestones do not complete students: an In Shul student becomes Ready for Check, and only personal confirmation makes Requirement Met. Departure does not undo personal clearance. Earlier automatic results/events remain historical facts, not personal-clearance records.

The additive migration `supabase/migrations/20261005213145_shachris_live_attendance.sql` was applied remotely on 2026-10-05 after the preservation/hash checks passed. The browser fixture/screenshots use synthetic students; production data is not included in screenshots. Do not run a general `db push`.

The existing production session `005083f4-1fba-4bb6-91c8-228d66c9d418` had 16 student records, 13 events, seven marked present, three marked out, and six with section marks before migration. Legacy-record hash `6b03fd38b5a36a73869ef48926183009` and event hash `69184df2d65a08c285fdda07f0f1f39b` matched afterward. The existing progress sections/milestones are unchanged; 16 age-based stay snapshots were added, and the session remains unstarted. The stay-history table has RLS, authenticated SELECT is permission-guarded, and anon SELECT is denied.

## Local Login Preview

The local Vite server reads `VITE_SUPABASE_YK_URL` and `VITE_SUPABASE_YK_ANON_KEY` from ignored `.env.local`, using the secure project's public browser configuration. Never commit that file or put a service-role key in a browser variable. Restart Vite after changing environment values.

Use the normal secure-site email/password login. The Codespaces forwarded port should remain private. Development skips service-worker registration and unregisters an existing local root worker to prevent activation reloads; production registration is unchanged.

This preview uses the real secure project's Auth/backend, not an isolated data sandbox. Both the base checkpoint and live-attendance schema are deployed. Browser workflow screenshots/tests use intercepted synthetic rows only.

## Daily Workflow

1. Start Hodu once; the server records the shared session baseline.
2. Use Mark Visible In Shul at Hodu to timestamp the boys already there against that baseline. Later arrivals get a server timestamp and calculated lateness.
3. A late arrival immediately opens a quick reason popup: Transportation, Excused, No Reason, or Other. Excusal never changes arrival time or factual minutes late. Excused lateness is neutral and does not add late-related Need Attention; independent unmarked/out/unconfigured issues remain separate. Not Marked, Absent, Excused from Shul, and Not in Shul are distinct nonattendance states, separate from lateness. Bulk Hodu arrival never overwrites explicit nonattendance choices.
4. Use Left With Permission / Left Without Permission and Returned. Each leave-return interval is retained. Mark communal milestones in order; this marks only the shared milestone. Ready for Check requires In Shul and a passed required milestone, including late arrivals after that milestone. Confirm Completion records the personal clearance time, actor, and required milestone. Only this turns the student's requirement green.
5. Use Change Requirement for Today only or Today and future. Expand Davening Progress for existing section marks, next section, ratings, and progress history.
6. Presence events save immediately; a failed write is shown and the previous state remains. Extra-stay intervals start at personal clearance, stop on departure, and reopen on return; time out is excluded. The live star/badge uses those intervals, and a departure stores the observed stayed-beyond-required flag. Open intervals remain explicit ongoing facts, not assumed finalized rewards. Once personally cleared, today's required snapshot is protected against changes. Session start time correction and event-time correction remain deferred.

## Daily Facts And Personal Clearance (2026-10-06)

Targeted migration `supabase/migrations/20261006042222_shachris_personal_clearance.sql` is applied to `ednjpqtuttutoatahorn`. It adds daily late minutes/reason/note/excusal, explicit nonattendance status, personal clearance time/user/name/required milestone, extra-stay intervals, and an observed extra-stay flag. Arrival, late-reason corrections, nonattendance changes, personal confirmation, and departures/returns are logged in the existing permission-guarded event ledger. This supports a future Weekly Record without building that view or reward values now.

The new authenticated `shachris_update_daily_fact` RPC checks identity, Attendance Edit permission, today's started session, the student/session key, and expected revision. Personal clearance also requires In Shul and the required communal milestone. Attendance RPCs use server time; the generic checklist writer cannot change presence or forge clearance/extra-stay facts. Existing RLS and anonymous read denial remain in place. No extra anonymous database access is enabled for the demo.

The original October 5 session's prior-record, event, and session hashes matched before/after rollout. Concurrent admin activity created a separate October 6 session before the migration ran; those records/events were left untouched. No old automatic result was converted into fabricated personal clearance. Only existing factual late minutes and existing Absent classifications were backfilled; unknown historical reasons and personal checks were not guessed.

The shared screen and backend contract power both Hadran and the isolated in-memory demo. The demo link was updated and publicly browser-tested; the older main Hadran production alias was not repointed. The actual database migration is live, and current shared dashboard code uses it. Standalone login and organization/division isolation remain deferred, with server-authorized backend scoping still required before real multi-tenant use.

Validation: 345 repository tests pass; main and demo builds, demo typecheck/privacy audit, focused lint, isolated SQL save/reopen/permission/stale-write checks, and both adapter browser workflows pass. Popup and session layouts were checked at desktop, 390px, and 320px widths. Root typecheck still has the two unchanged Teaching Mode test errors. The scoped token lacks `advisors_read`; direct RPC grant/RLS checks passed, but no full database advisor audit is claimed.

Settings apply when creating new dated sessions. Existing sessions keep their settings and expectation snapshots. Section and milestone IDs cannot be removed through the settings service.

## Verification

- `npm test -- src/utils/__tests__/shachris.test.ts src/services/__tests__/shachrisMigration.test.ts src/services/__tests__/daveningProgressMigration.test.ts src/components/__tests__/studentProfileNavigation.test.ts`
- `npm run dev -- --host 0.0.0.0 --port 5190 --strictPort`
- `node src/components/__tests__/shachris.browser.mjs`
- Local SQL fixtures: `src/services/__tests__/fixtures/shachrisDatabaseSetup.sql`, `shachrisDatabaseChecks.sql`, `shachrisLiveSessionChecks.sql`, and the legacy-session seed/check files. Both clean migration tests and legacy-session upgrade test passed in isolated PostgreSQL; fixture permission helpers are test stubs.
- Latest personal-clearance SQL fixture: `src/services/__tests__/fixtures/shachrisPersonalClearanceChecks.sql`, applied after all three targeted migrations on an isolated synthetic database. Earlier live-session fixtures document the pre-personal-clearance checkpoint, not the current semantics.
- `node src/services/__tests__/fixtures/shachrisDobImportChecks.mjs` tests the import on synthetic local rows only, including the incomplete-14 gate and the 16-entry success/missing/duplicate/conflict cases. Never point this script at the school database.
- [Presence-first Daily Live Session desktop](shachris-live-session-desktop.png) and [mobile](shachris-live-session-mobile.png) screenshots use synthetic students. Earlier checkpoint screenshots are also retained alongside this document.
- Production build passes. Repository typecheck currently reports two unrelated errors in the unchanged `teachingModeUtils.test.ts`.
- Deployed verification: all 16 DOBs, exact ID/name matches, schema-cache visibility, new-table RLS/grants, authenticated RPC save/reopen, manual override expiry, and grade-only 8/8 resolution passed. Remote test marks, settings changes, and overrides were rolled back; no test history was retained.
- Local latest Live Session gates: 29 focused/neighboring tests, synthetic browser scenario, focused lint, production build, clean SQL workflow test, and pre-existing-session preservation test all pass.
- Remote live migration check: all 16 stay snapshots present, legacy record/event hashes unchanged, session still unstarted, RLS enabled, and anon reads denied.
- Advisory API access is unavailable with the scoped token (`advisors_read` denied). Targeted SQL permissions/RLS and anonymous Data API denial were inspected directly; no full-project advisory audit is claimed.

## Deployment Gate

### Temporary Standalone Demo (2026-10-06)

Share https://shachris-daily-session-demo.vercel.app for the Shachris-only Daily Live Session. It reuses the dashboard's UI through a backend adapter, with a separate static Vercel deployment and simulated browser-local changes. Its sanitized roster contains names, age snapshots, grade assignments, and demo-local IDs only; no actual DOB, school API, login, real attendance history, or dashboard navigation is exposed. See [demo architecture, verification, and retirement instructions](../apps/shachris-demo/README.md).

Fresh read-only checks confirmed the live migration and all 16 stay snapshots. The original school session has since been started; no demo action touches it. The main production domain still serves commit `3da4f9b`; the pushed October checkpoint was not deployed there as part of this task. Existing production aliases were not changed. Standalone login and multi-organization/division support remain future work.

### Restore Access Without Applying SQL

1. Sign into the Supabase account that can manage project `ednjpqtuttutoatahorn` (the secure dashboard's backing project, historically named `school-dashboard-test`). At https://supabase.com/dashboard/account/tokens, create a scoped personal access token restricted to that project. Grant Project Settings Read and Database Read-write for the reviewed targeted migration/import workflow. Do not grant unrelated organization, billing, storage, or function access.
2. Run the following yourself in the VS Code terminal. Paste the token only into the hidden terminal prompt, never into chat, source files, or `VITE_*` variables:

```bash
read -rsp 'Supabase scoped access token: ' SUPABASE_ACCESS_TOKEN
printf '\n'
export SUPABASE_ACCESS_TOKEN
npx --yes supabase@latest login --token "$SUPABASE_ACCESS_TOKEN"
```

3. Tell the assistant that login is complete. The workspace is already linked to `ednjpqtuttutoatahorn`; do not relink it to another project. The first database command is read-only:

```bash
npx --yes supabase@latest db query --linked --file docs/20261005_shachris_roster_review.sql
```

4. Confirm the real active roster contains 16 students and resolve exact-name discrepancies against real IDs. All 16 DOBs have been supplied; verify every match before reviewing/applying the import. No fuzzy matching or guessed dates.

### Targeted Rollout After Review

Both targeted migrations and the reviewed DOB import are complete. Read-only verification on 2026-10-06 found that the original live session has since been started. Do not rerun either migration file or use `db push`.

The deployed DOB import is complete. Student Events, Weekly Record, Summary/Rewards, and start/event-time correction remain deferred until the user reviews this Daily Live Session checkpoint.