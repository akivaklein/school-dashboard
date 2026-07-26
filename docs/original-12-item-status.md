# Original 12-Item Backlog Status

Last updated: 2026-07-26

## Done

1. Full staff management in Staff Directory (add, edit, multi-role, deactivate/reactivate).
2. Replace hardcoded staff dropdown sources with real staff list wiring.
3. Staff role/schema support for multi-role and contact fields.
4. Restrict teacher/rebbe from opening Staff Directory.
5. Restrict teacher/rebbe profile access to assigned student roster.
6. Bulk grade modal updates student rows when teacher selection changes.
7. Migration audit and SQL remediation guidance against live Supabase.
8. Admin-managed options principle documented and enforced directionally.

## In Progress

1. Teacher-scoping audit formalization.
   - Core restrictions are live.
   - Remaining work is documenting all scoped pages and expected behavior in one checklist.
2. Saved-locally visibility for fallback persistence.
   - Dashboard indicator added for queued local student updates.
   - Remaining work is optional per-form status chips if deeper UX is needed.

## Not Started

1. Contextual search unification across major pages.
2. Points history undo UX polish beyond functional behavior.
3. Dashboard.tsx phased decomposition into smaller modules.
4. Email invite system architecture and implementation.

## Execution Order For Remaining Work

1. Complete teacher-scoping audit checklist artifact.
2. Ship contextual search unification phase 1 (shared pattern + 2 high-traffic pages).
3. Ship points-history undo UX polish.
4. Start Dashboard decomposition with one safe extraction pass.
5. Draft and approve email invite architecture, then implement.