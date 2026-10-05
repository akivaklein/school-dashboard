# Shachris: First Checkpoint

Branch: `yeshiva-ketana-secure`. Student Events and Weekly Record are not implemented yet.

## Current Status

The Live Session, individual expectations/progression, basic settings, and editable regular DOB/age are implemented. The schema was exercised in an isolated PostgreSQL container. Browser verification used synthetic students and intercepted API responses, not school records.

The migration and DOB import have NOT been applied to the school database: this environment has no Supabase management token or database connection. The import contains only the 14 supplied DOBs and is blocked until 16 reviewed DOBs and 16 unique active student matches are available. The two missing students cannot be verified without the real roster. Real-school refresh/persistence and existing production RLS still need verification after access is restored. No Hebrew DOB or optional contact fields were added.

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

4. Confirm the real active roster contains 16 students, resolve exact-name discrepancies against real IDs, and identify the two missing DOBs. Supply those DOBs before completing/reviewing the import. No fuzzy matching or guessed dates.

### Targeted Rollout After Review

After restoring Supabase access, verify the linked project is the secure dashboard's backing database and inspect the existing schema/permissions. Apply only `supabase/migrations/20261005_shachris_checkpoint.sql`; do not use an unrestricted `db push`, because unrelated migrations are pending.

Review `docs/20261005_shachris_dob_import.sql` against actual student IDs before executing. It matches explicit supplied/reversed names, requires exactly 16 supplied entries and 16 unique active matches, and refuses conflicting existing DOBs. Do not apply it while the two DOBs are missing. Verify unrelated fields/history counts are unchanged and test refresh/save with authorized and read-only accounts before claiming the checkpoint is live. Use targeted `db query --linked --file <reviewed-file>` commands only; the import stays paused until review is complete.