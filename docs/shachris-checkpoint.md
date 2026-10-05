# Shachris: First Checkpoint

Branch: `yeshiva-ketana-secure`. Student Events and Weekly Record are not implemented yet.

## Current Status

The Live Session, individual expectations/progression, basic settings, and editable regular DOB/age are implemented. The schema was exercised in an isolated PostgreSQL container. Browser verification used synthetic students and intercepted API responses, not school records.

The migration and 14-student DOB import have NOT been applied to the school database: this environment has no Supabase management token or database connection. Real-school refresh/persistence and existing production RLS still need verification after access is restored. No Hebrew DOB or optional contact fields were added.

## Daily Workflow

1. Open School Day > Shachris Live Session and select a class/group.
2. Use All In Shul for the visible roster, correcting absent/left students individually.
3. Use Complete Each Requirement to fill each visible student's own required sections. Presence and rating are unchanged. This applies to the visible roster, including any absent students; review exceptions.
4. Select an overall rating independently, per student or for the visible roster.
5. Open Expectation / History to advance, lower, choose required sections, save a manual override, or return to defaults. Changes apply to today and future sessions; earlier daily snapshots stay unchanged.
6. Changes save immediately. Saving temporarily locks edits; a failed write restores the previous values and shows an error. Reload retrieves saved records. Concurrent writes with stale revisions are rejected atomically.

Settings apply when creating new dated sessions. Existing sessions keep their settings and expectation snapshots. Section and milestone IDs cannot be removed through the settings service.

## Verification

- `npm test -- src/utils/__tests__/shachris.test.ts src/services/__tests__/shachrisMigration.test.ts`
- `npm run dev -- --host 0.0.0.0 --port 5190 --strictPort`
- `node src/components/__tests__/shachris.browser.mjs`
- Local SQL fixtures: `src/services/__tests__/fixtures/shachrisDatabaseSetup.sql` and `shachrisDatabaseChecks.sql`, run before/after the migration in an empty isolated test database only. Their permission helpers are test stubs, not production permission verification.
- Desktop/mobile/progression screenshots are alongside this document. They contain synthetic students.
- Production build passes. Repository typecheck currently reports two unrelated errors in the unchanged `teachingModeUtils.test.ts`.

## Deployment Gate

After restoring Supabase access, verify the linked project is the secure dashboard's backing database and inspect the existing schema/permissions. Apply only `supabase/migrations/20261005_shachris_checkpoint.sql`; do not use an unrestricted `db push`, because unrelated migrations are pending.

Review `docs/20261005_shachris_dob_import.sql` against actual student IDs before executing. It matches explicit supplied/reversed names, requires exactly 14 unique active matches, and refuses conflicting existing DOBs. Do not add fuzzy name matching. Verify unrelated fields/history counts are unchanged and test refresh/save with authorized and read-only accounts before claiming the checkpoint is live.