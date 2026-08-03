# Dashboard Layout Comparison (principal-demo-polish)

This branch keeps both dashboard navigation options available before any merge decision.

## Layout Choices Preserved

1. Two-Level Navigation (default)
- Top area tabs (Dashboard, Students, School Day, Support, Reports, Messages, Setup)
- Contextual submenu per top area
- Best for reducing clutter and keeping role-relevant sections grouped

2. Legacy Sidebar Layout
- Single, flat sidebar behavior
- Familiar flow for staff used to the older dashboard layout
- Useful for quick access when users prefer one persistent list

## How Users Switch

- In the dashboard header controls, use the layout toggle:
  - `Layout: Two-Level`
  - `Layout: Legacy`
- Preference is stored in local browser storage (`schoolDashboardLayoutModeV1`).

## Behavior Notes

- Role-based access still applies in both layouts.
- View As preview uses role-specific navigation and page gating.
- No data behavior changes are tied to layout mode; this is navigation/UI only.

## Recommendation Before Merge Consideration

- Keep both options active through principal demo week.
- Gather staff preference notes by role (Admin, Teacher/Rebbe, Therapist, Canteen).
- Decide post-demo whether to:
  1. keep both modes,
  2. make Legacy opt-in only, or
  3. retire Legacy after onboarding.
