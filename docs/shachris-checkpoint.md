# Shachris: First Checkpoint

Branch: `yeshiva-ketana-secure`. Student Events and Weekly Record are not implemented yet.

## Current Status

The Live Session, individual expectations/progression, basic settings, and editable regular DOB/age are implemented and the targeted schema is deployed to the secure backing project `ednjpqtuttutoatahorn`. Browser layout verification uses synthetic students; deployed RPCs were also verified against the real roster under authenticated leadership permissions in a fully rolled-back transaction.

On 2026-10-05, only `supabase/migrations/20261005_shachris_checkpoint.sql` and the reviewed `docs/20261005_shachris_dob_import.sql` were applied via targeted `db query --linked --file` commands. All 16 DOBs were verified afterward. The active roster is eight students in 7th grade and eight in 8th grade. The user explicitly confirmed seven name aliases before import; each import row is pinned to its reviewed student ID. No fuzzy matching or student renaming was performed.

Existing-data counts and hashes matched before/after, excluding only the authorized new DOB field: 60 students, 28 staff, 17 primary class assignments, 224 teacher/rebbe assignments, 17 setup assignments, 8 classes, 4 instructional groups, 32 memberships, 2 legacy Davening templates, 5 legacy checklists, and 0 legacy marks. No Hebrew DOB or optional contact fields were added.

Defaults are grade-only, sourced exclusively from `student_class_assignments` (`yk-b` = 7th, `yk-a` = 8th). Mishna/Gemara/Math/Reading levels, teacher groups, and DOB/age are never default sources. Instructional groups may filter the visible roster without changing expectations. Manual overrides take priority. Settings permit one rule per actual grade; unconfigured grades use the explicit school fallback. Age remains informational only.

## Local Login Preview

The local Vite server reads `VITE_SUPABASE_YK_URL` and `VITE_SUPABASE_YK_ANON_KEY` from ignored `.env.local`, using the secure project's public browser configuration. Never commit that file or put a service-role key in a browser variable. Restart Vite after changing environment values.

Use the normal secure-site email/password login. The Codespaces forwarded port should remain private. Development skips service-worker registration and unregisters an existing local root worker to prevent activation reloads; production registration is unchanged.

This preview uses the real secure project's Auth/backend, not an isolated data sandbox. The targeted migration and reviewed DOB import are now deployed, so Live Session and profile DOB saving are available. Normal workflow changes save real records. No database changes were performed during the earlier preview-login fix.

## Daily Workflow

1. Open School Day > Shachris Live Session and select a class/group.
2. Use All In Shul for the visible roster, correcting absent/left students individually.
3. Use Complete Present Requirements to fill each visible In Shul student's own required sections. Absent, left, and unmarked students are excluded; presence and rating are unchanged. Individual section corrections remain available, but there is no bulk option including absent students.
4. Select an overall rating independently, per student or for the visible roster.
5. Open Expectation / History to advance, lower, choose required sections, save a manual override, or return to defaults. Select Today only (the safe initial choice) or Today and future before saving. Temporary changes persist for today's session and remain in history, but tomorrow resumes the prior continuing assignment or default. Earlier daily snapshots stay unchanged.
6. Changes save immediately. Saving temporarily locks edits; a failed write restores the previous values and shows an error. Reload retrieves saved records. Concurrent writes with stale revisions are rejected atomically.

Settings apply when creating new dated sessions. Existing sessions keep their settings and expectation snapshots. Section and milestone IDs cannot be removed through the settings service.

## Verification

- `npm test -- src/utils/__tests__/shachris.test.ts src/services/__tests__/shachrisMigration.test.ts`
- `npm run dev -- --host 0.0.0.0 --port 5190 --strictPort`
- `node src/components/__tests__/shachris.browser.mjs`
- Local SQL fixtures: `src/services/__tests__/fixtures/shachrisDatabaseSetup.sql` and `shachrisDatabaseChecks.sql`, run before/after the migration in an empty isolated test database only. Their permission helpers are test stubs, not production permission verification.
- `node src/services/__tests__/fixtures/shachrisDobImportChecks.mjs` tests the import on synthetic local rows only, including the incomplete-14 gate and the 16-entry success/missing/duplicate/conflict cases. Never point this script at the school database.
- Desktop/mobile/progression screenshots are alongside this document. They contain synthetic students.
- Production build passes. Repository typecheck currently reports two unrelated errors in the unchanged `teachingModeUtils.test.ts`.
- Deployed verification: all 16 DOBs, exact ID/name matches, schema-cache visibility, new-table RLS/grants, authenticated RPC save/reopen, manual override expiry, and grade-only 8/8 resolution passed. Remote test marks, settings changes, and overrides were rolled back; no test history was retained.
- Advisory API access is unavailable with the scoped token (`advisors_read` denied). Targeted SQL permissions/RLS and anonymous Data API denial were inspected directly; no full-project advisory audit is claimed.

## Deployment Gate

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

Completed on 2026-10-05 after the read-only review and explicit alias confirmation. Do not rerun the schema file against the deployed tables. It was executed directly rather than through `db push`; unrelated pending migration history must not be pushed indiscriminately.

The deployed import matches explicit approved names and pinned IDs, requires exactly 16 supplied entries and 16 unique active matches, and refuses conflicting existing DOBs. Existing values are never overwritten. Student Events and Weekly Record remain deferred until the user reviews this checkpoint.