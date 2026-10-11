# Shachris: First Checkpoint

Branch: `yeshiva-ketana-secure`. Today's complete Shachris release is authorized; Student Events remains deferred.

## Ended Live Controls (2026-10-11)

Frontend follow-up: the existing `live-session-ended` marker also disables normal arrival, nonattendance, leave, return, personal-completion, communal-milestone, and bulk-Hodu controls. Live action handlers reject submissions after ending, independently of the disabled controls. Deliberate late-reason corrections, stay/progression editing, start corrections, confirmed Restart Today, and Weekly Record / History editing remain available under existing permissions. A deliberate restart clears the ended state and restores live controls once Hodu starts. This follow-up requires no database change.

Frontend follow-up verification: 24 focused utility/service tests, focused lint, production build, and the synthetic secure-browser regression pass. Browser checks cover all disabled live controls, reload persistence, absence-handler rejection even if the DOM control is re-enabled, saving a late-reason correction, accessible stay/progression/history edit tools, and restoring live controls only through confirmed Restart Today. Root typecheck retains only the two known unrelated Teaching Mode test errors. Deployment targets only `school-dashboard-secure` and its `yeshiva-ketana-secure.vercel.app` alias; no database change is required.

## Authorized Secure Release (2026-10-11)

This release includes Weekly Record / History, editable weekly treat-eligibility settings, audited historical Edit Day, compact landscape-tablet cards with a 4/3/2/1 responsive grid, neutral leave action buttons with permission-colored saved leave information, separated softly shaded daily cells, and Restart Today's Session with preserved voided history. The dated local-review sections below describe earlier checkpoints, not the current deployment authorization.

Only `20261011050804_shachris_historical_day_results.sql` and `20261011055815_shachris_restart_today.sql` were applied to the live secure backing project `ednjpqtuttutoatahorn`, in that order, using targeted database queries. Do not rerun them or use a general `db push`. No attendance restart, historical entry, settings change, or class-assignment change was performed during release verification.

Before/after counts and hashes match: sessions 6 (`f38a266cf9e06a237bc2ed0d8993a8d5`), student records 96 (`cd39f29c034d5acf46eda37b929f377c`), events 172 (`c18f2c1d16c0f3d0be9bcef2790c3805`), and start audits 5 (`5e3d3f5644c479dbc693eb4be03739ac`). Session/record hashes exclude only the newly added nullable columns. Settings, progression/stay expectations, and Student Class Assignments hashes also match. No existing session was voided and no historical override was created.

Release checks: 35 focused tests, focused lint, secure build, and synthetic desktop/tablet/mobile browser workflows pass. The live Weekly Record date/void filter is valid under the authenticated database role; without a user identity RLS returns no rows. Anonymous restart/historical writes and direct authenticated record updates are denied. The token lacks `advisors_read`, so a full security-advisor audit is unavailable. Root typecheck retains the two previously documented unrelated Teaching Mode test errors. Deploy only to `school-dashboard-secure` / `yeshiva-ketana-secure.vercel.app`; main and public-demo projects remain untouched.

## Restart Today Review Checkpoint (2026-10-11)

Restart Today's Session is available inside the existing Correct Hodu Start area to anyone with Attendance Edit permission, today only. An unstarted today session exposes the same drawer as Session Corrections. The secure-only restart choice requires a reason and explicit confirmation that today's active attendance will be replaced. The public/demo backend does not expose this option.

Migration `supabase/migrations/20261011055815_shachris_restart_today.sql` is **local-only, not applied remotely**. It adds void markers and a replacement-session link, changes the date uniqueness rule to one nonvoided session per date, and reuses `shachris_correct_start`, `shachris_open_session`, and the existing `shachris_start_audit` ledger. Restart marks the old session voided, leaves all its records/events untouched, creates a new same-date session using current settings/normal expectation resolution, and appends exactly one restarted audit entry containing old/new session IDs, actor, authenticated user, reason, and server timestamp. No records or events are hard-deleted; class assignments and continuing/individual expectation assignments are not changed.

The fresh session has no Hodu/milestone times and newly defaulted active-roster records: Not Marked, no arrival/late/leave/return/absence/clearance/checklist/rating/note/daily facts. Database guards reject writes against voided sessions and their records/events, including stale browser writes. Reopening selects the new active session. Weekly/history queries and weekly eligibility ignore voided sessions; the existing correction drawer shows the day's preserved start/restart audit across session generations.

The existing empty-start reset and start-time correction remain unchanged behind a private wrapper. The historical-edit RPC's reviewed date lookup/conflict clauses are updated in place to target only the active session. Apply the reviewed historical-result migration first, then this restart migration; do not run a general `db push` or apply either to the school backend before review.

Verification: 35 focused tests; isolated, rolled-back restart SQL checks for nonadmin permissions, today-only/reason/confirmation/stale guards, fresh fields, immutable prior records/events, active-date uniqueness, and linked audit; neighboring historical-edit and roster/grace/start-correction SQL checks; synthetic browser reason/confirmation/restart/audit/reopen/history exclusion; focused lint and secure build pass. Root typecheck retains only the two known Teaching Mode test errors. Preview http://localhost:5192/. No remote database writes, push, main/public-demo edits, or deployment were performed.

## Historical Editing And Compact Cards Review (2026-10-11)

Weekly day details remain read-only until an Attendance Editor explicitly chooses Edit Day. Past Sunday-Friday dates, including dates with no saved session/record, support On Time/Late, late reason/note/excusal, Stayed Required Time, Attended/Absent/Excused from Shul/Not in Shul, and a day note. Save requires a separate entry/correction reason. Cancel writes nothing; stale saves show an error and retain the draft.

The new migration `supabase/migrations/20261011050804_shachris_historical_day_results.sql` is **local-only and NOT applied to the school database**. It adds one nullable `historical_result` JSON column on the existing student-record table and one explicit historical-save RPC. No new table is required. Existing attendance fields, timestamps, stay snapshots, clearances, events, checklist marks, and notes are preserved. Every save appends an existing `shachris_events` entry containing the full before/after record, correction reason, authenticated user ID, actor name, and server timestamp. The drawer displays entered results separately from Original Recorded Facts and shows the edit audit.

The RPC checks authenticated identity, Attendance Edit permission, active authoritative `yk-a`/`yk-b` membership, a past school date, validated result fields, and an expected record revision. An explicit Save may create only the selected missing student/day record and a dated unstarted session; it never fabricates Hodu, arrival, leave/return, or clearance timestamps. Weekly eligibility uses this explicit result for that student/day even if there was no live session. Other students are not automatically marked or treated as present. Live Session RPC guards remain unchanged.

Only student-card layout was compressed: tighter padding/gaps, compact Required Until, compact secondary results, and side-by-side arrival/nonattendance controls. Primary attendance buttons remain at least 44px tall. Davening Progress stays collapsed by default. The original grid/responsive breakpoints, top milestones, summary, and attendance actions/data logic were preserved. Synthetic browser measurement: 348.6px original versus 237px compact, **32% shorter**.

Verification: 33 focused tests and isolated PostgreSQL transaction checks pass for backfill/correction, complete audit snapshots, preservation, stale saves, dates, roster, identity, permissions, and validation. The synthetic browser workflow verifies read-only viewing/cancel, explicit edit/save, backfill without timestamps, audit, failure feedback, recalculated eligibility, view-only restrictions, card-height reduction, and desktop/tablet/mobile layouts. Focused lint and secure build pass; typecheck retains only the two pre-existing Teaching Mode test errors. Review preview: http://localhost:5192/. No school database writes, push, main/public-demo changes, or deployment were performed. After review, apply only the reviewed new migration before expecting historical Save to work against the school backend; never run a general `db push`.

## Weekly Record Review Checkpoint (2026-10-11)

The secure Shachris backend now provides a SELECT-only Weekly Record / History tab, This Week / Last Week and previous/next navigation, Sunday-Friday columns, and saved day details for the existing active authoritative `yk-b` / `yk-a` roster. Older dates in Live Session also use the read-only loader rather than `shachris_open_session`; historical attendance/checklist actions are disabled. No database schema, session, record, event, assignment, or production deployment was changed by this implementation.

Required days are the saved sessions with Hodu started. There is no saved Shachris school-day/holiday calendar: a date without a saved session is shown as such, not treated as an absence or a successful attendance day. A required session with a missing/unmarked student record or an unconfirmed required result cannot earn eligibility via the exceptions allowance. Weeks with no applicable required days return No. This Week is provisional and uses only saved facts, not predicted future attendance.

On Time uses each session's saved start and grace snapshot, separately from excusal. Stayed Entire Time requires the saved stay result to be met, arrival no later than the student's saved required milestone, and no positive-duration departure before that milestone, with or without permission. A known interruption/absence is a failed stay; pending confirmation is not invented. Departures after the individual required milestone do not invalidate completion. Day details retain the saved result and personal clearance separately from this derived weekly result.

The five editable eligibility controls live in existing Rules & Settings and save through the existing revision-guarded RPC in `config.weeklyEligibility`. Defaults require both On Time and Entire Stay, do not ignore excused lateness/absence, and allow zero exceptions. Exceptions count failed days, not individual conditions. Current rules recalculate all viewed weeks; eligibility is not a historical reward award or a stored snapshot. No treat-given tracking, points, prizes, streaks, or rewards tables were added.

Known returned intervals contribute their saved duration to time out. An unreturned interval is bounded by saved End Davening if available; otherwise its unknown duration is labeled, never accumulated through subsequent days. The standalone/public demo has no history loader, so it gains neither the tab nor weekly rule controls. No demo files were changed.

Verification: 30 focused utility/service/schema-contract tests, focused lint, secure production build, and the existing synthetic browser workflow pass. Browser checks cover Live Session regression, history GET-only requests and unchanged fixture snapshots, editable settings JSON, day details, empty weeks, previous/next navigation, historical-date read-only behavior, and 1440px/390px/320px viewports. Root typecheck still has only the two existing Teaching Mode test errors. No real school reads/writes were used for browser verification. Local preview: http://localhost:5190/. Stop for review before any push that could trigger deployment or any manual deployment.

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
6. Presence events save immediately; a failed write is shown and the previous state remains. Extra-stay intervals start at personal clearance, stop on departure, and reopen on return; time out is excluded. The live star/badge uses those intervals, and a departure stores the observed stayed-beyond-required flag. Open intervals remain explicit ongoing facts, not assumed finalized rewards. Once personally cleared, today's required snapshot is protected against changes. Audited Hodu start correction is now available to ordinary Shachris editors; individual event-time correction remains deferred.

## Daily Facts And Personal Clearance (2026-10-06)

Targeted migration `supabase/migrations/20261006042222_shachris_personal_clearance.sql` is applied to `ednjpqtuttutoatahorn`. It adds daily late minutes/reason/note/excusal, explicit nonattendance status, personal clearance time/user/name/required milestone, extra-stay intervals, and an observed extra-stay flag. Arrival, late-reason corrections, nonattendance changes, personal confirmation, and departures/returns are logged in the existing permission-guarded event ledger. This supports a future Weekly Record without building that view or reward values now.

The new authenticated `shachris_update_daily_fact` RPC checks identity, Attendance Edit permission, today's started session, the student/session key, and expected revision. Personal clearance also requires In Shul and the required communal milestone. Attendance RPCs use server time; the generic checklist writer cannot change presence or forge clearance/extra-stay facts. Existing RLS and anonymous read denial remain in place. No extra anonymous database access is enabled for the demo.

The original October 5 session's prior-record, event, and session hashes matched before/after rollout. Concurrent admin activity created a separate October 6 session before the migration ran; those records/events were left untouched. No old automatic result was converted into fabricated personal clearance. Only existing factual late minutes and existing Absent classifications were backfilled; unknown historical reasons and personal checks were not guessed.

The shared screen and backend contract power both Hadran and the isolated in-memory demo. The demo link was updated and publicly browser-tested; the older main Hadran production alias was not repointed. The actual database migration is live, and current shared dashboard code uses it. Standalone login and organization/division isolation remain deferred, with server-authorized backend scoping still required before real multi-tenant use.

Validation: 345 repository tests pass; main and demo builds, demo typecheck/privacy audit, focused lint, isolated SQL save/reopen/permission/stale-write checks, and both adapter browser workflows pass. Popup and session layouts were checked at desktop, 390px, and 320px widths. Root typecheck still has the two unchanged Teaching Mode test errors. The scoped token lacks `advisors_read`; direct RPC grant/RLS checks passed, but no full database advisor audit is claimed.

Settings apply when creating new dated sessions. Existing sessions keep their settings and expectation snapshots. Section and milestone IDs cannot be removed through the settings service.

## Verification

### Roster, Grace And Safe Start Correction (2026-10-06)

Migration `supabase/migrations/20261006050418_shachris_roster_grace_start_correction.sql` is applied. Both the shared screen and session RPC restrict the roster to active students whose authoritative Student Class Assignments are `yk-b` or `yk-a`. The selector has only Entire roster, 7th Grade, and 8th Grade. Broader classes/groups passed by Hadran are ignored; the assignment system and demo roster data were not modified. Older out-of-scope session rows remain stored, not deleted.

Arrival grace defaults to 2 minutes and is configurable from 0 to 10 in existing Shachris settings. Each new Hodu start snapshots the current setting. Individual arrivals up to and including the grace boundary are On Time with no late popup; later arrivals show factual minutes measured from Hodu. Bulk Hodu arrivals keep the exact Hodu timestamp. Already-started historical sessions retain a zero-grace snapshot so this additive rollout does not silently change historical lateness; deliberate start correction records and applies the current grace policy.

Correct Hodu Start uses the same Attendance Edit permission as normal Shachris actions. There is no admin role requirement. View-only and anonymous callers cannot perform corrections. An empty start can be reset only if there are no attendance/checklist events, modified student records, or communal milestones beyond Hodu. Otherwise reset is blocked and only deliberate time correction is offered. Correction requires a reason, explicit confirmation, today's session, and the expected original start; future times or a start after recorded communal milestones are rejected.

The correction transaction locks the session and its student rows. It preserves actual arrivals, departures, milestones, personal clearance, and attendance events; it recalculates only derived late minutes. A separate RLS-protected start audit stores the previous/new start, actor, reason, prior grace, and pre-correction arrival facts. Ordinary permitted viewers can read that audit. No existing start was automatically reset or corrected by this rollout.

Live attendance record/event hashes matched before and after, as did session facts excluding the newly added grace key; all 76 events remain. Validation: 350 repository tests, focused lint, main/demo builds, standalone typecheck, nonadmin-editor SQL correction/security checks, secure-adapter roster/grace browser scenario, and public demo correction/mobile/privacy checks passed. Root typecheck still has the two previously documented Teaching Mode test errors; the scoped token still lacks full advisor access. Main production UI was not redeployed.

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

The deployed DOB import is complete. Weekly Record is now local-only pending review; Student Events, Summary/Rewards, and individual event-time correction remain deferred. Do not deploy this weekly checkpoint before review.