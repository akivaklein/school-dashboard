# Tomorrow Morning Handoff (principal-demo-polish)

## How To Start
Send this exact message:

Start from branch principal-demo-polish at commit 90cfb08. Use docs/tomorrow-plan.md as the source of truth. Execute priorities in order, test/build after each logical section, commit and push only to principal-demo-polish, and do not merge to main.

## Locked Rules
- Do not merge into main.
- Do not reseed or recreate teacher/rebbe assignment tables unless a verified issue requires it.
- Supabase is source of truth for persisted business data.
- localStorage allowed only for harmless UI preferences.
- No silent fallback to fixtures for business data after seeding.
- Show visible save errors.
- Prevent duplicate subscriptions and duplicate writes.
- Clean up Realtime channels on unmount.

## Confirmed Foundation Status
- teacher_rebbe_assignments table exists.
- Indexes, trigger, RLS, policies, and Realtime verified.
- Legacy-roster seed executed successfully.
- Teacher scope reads Supabase assignments.
- Weekday gating and strict-name matching bugs were fixed.
- Current active distinct student counts from verified run:
  - Rabbi Klein: 8
  - Rabbi Schimborski: 8
  - Rabbi Schults: 8
  - Rabbi Abowitz: 7
  - Rabbi Ambush: 7
  - Rabbi Ehrnreich: 7
  - Rabbi Goldstein: 7
  - Rabbi Lefkowitz: 7

## Priority Order (Do In Sequence)
1) Verify complete Teacher experience (Rabbi Klein + Rabbi Goldstein, separate sessions).
2) Restore original Tracking presentation from main while preserving new data logic.
3) Make Test Scores tab fully clickable with detail drill-downs and real grade_entries behavior.
4) Teacher Dashboard + Teaching Mode cleanup.
5) Attendance and classroom-location synchronization fixes.
6) Therapist return-to-class workflow.
7) Compact Therapy/BCBA schedule.
8) Compact Therapist Assignments.
9) View As verification (Teacher/Therapist/Canteen).
10) Users & Access invite state improvements (honest disabled state).
11) Multiple teacher/rebbe assignments + bulk assignment workflow.
12) Classroom coverage detail compact design.
13) Token Store barcode readiness (without delaying higher priorities).
14) Preserve old/new dashboard choices and produce comparison before any merge consideration.

## Verification Standard For Each Completed Section
- Save works.
- Refresh persists.
- Sign out/in persists.
- Second browser/session behavior verified where applicable.
- Realtime update verified where applicable.
- Role scope verified.
- No duplicate records.
- Run targeted tests where relevant.
- Run full test suite + production build at checkpoint boundaries.

## End-of-Batch Reporting Requirements
Report exactly:
1. Completed items
2. Commit hashes
3. Test/build results
4. Migrations added
5. Full SQL for any required manual migration
6. What remains localStorage
7. What remains fixture-only
8. What remains placeholder
9. What could not be tested interactively
