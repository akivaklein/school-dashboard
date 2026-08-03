# Persistence, Realtime, and Handoff Audit

## Scope
This branch focuses on hardening the principal demo experience without altering existing Supabase business data. The goal is to make persistence behavior clearer, keep demo fixtures separate from live data, and leave behind an auditable handoff note for follow-up work.

## Current persistence map

### Fully persisted via Supabase-backed services
- Student profile fields: attendance, notes, behavior log, parent calls, reminders, test scores, class log, and related support data are routed through the student persistence service or dedicated service helpers.
- Points events and token-store redemptions: these flows use RPC-backed helpers and local optimistic state updates with rollback on failure.
- Store inventory: inventory edits and stock changes are persisted through store service helpers and surfaced through the sync banner in the token store UI.

### Realtime-backed surfaces
- Student and points updates are synchronized through the dashboard realtime subscriptions.
- Store and support-session changes are also surfaced through realtime listeners when persistence is available.
- The UI keeps a visible sync state so users can distinguish pending local writes from confirmed remote updates.

### Demo-only or fixture-backed data
- Tracking history and showcase student fixtures are intentionally isolated in the dashboard data layer and should not be confused with live Supabase records.
- The app retains demo defaults for certain views when no persisted rows exist yet.

### Partially persisted or intentionally local-only
- Some visual-only state (for example temporary search filter state or transient modal UI) remains local to the browser and does not need persistence.
- Any write that cannot be completed should surface a visible failure state rather than silently leaving the UI in a misleading optimistic state.

## Write-path expectations
- User actions should update the local UI immediately when appropriate, but persistence failures must revert the optimistic change or clearly indicate the failure.
- The store and points flows already attempt rollback/visible error handling; follow-up work should keep this pattern consistent across attendance, teaching mode, academics, and support-session actions.
- If a write is blocked because persistence is not ready, the UI should explain that explicitly and avoid pretending the action completed.

## Role and scope guardrails
- Role-based page access is handled centrally in the dashboard role config and should remain the single source of truth.
- Teacher and therapist scope checks should stay narrowed to their assigned students and classes; demo fixtures should never override those restrictions.
- Admin/leadership pages should remain visible only when the effective role allows them.

## Demo data caution
- Do not reseed or overwrite existing business data in Supabase.
- Demo fixtures are for showcase and fallback behavior only; persisted rows should remain authoritative when present.
- When a record has a real persisted source, the app should prefer it over fixture-only data.

## Suggested follow-up checklist
1. Review remaining write actions for rollback feedback and visible error messaging.
2. Confirm realtime subscriptions clean up correctly and only listen to the intended scope.
3. Keep role matrix and role-based UI access documented as the app evolves.
4. Continue adding regression tests around utility helpers and persistence edge cases.
