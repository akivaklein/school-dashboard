# Instructional Group Connection Plan

## Source of truth

The existing Supabase tables remain the only instructional schedule source:

- `instructional_periods`
- `instructional_groups`
- `instructional_group_memberships`
- `physical_rooms`

Permanent grade/homeroom data remains separate in the existing class and student class assignment structures.

## Shared rules

- Resolve assignments as student + current period -> instructional group -> teacher + room.
- Treat only two active group memberships in the same period as a conflict.
- Resolve a current period only Monday through Thursday and only when both start and end times are configured.
- Never infer a morning start time.
- Store group context on new grade records so later membership changes do not rewrite history.

## Consumer connections

| Consumer | Connection |
| --- | --- |
| Setup Center | Creates and edits persisted periods, groups, teachers, rooms, and memberships. |
| Admin Dashboard | Shows groups in the current configured period with subject, teacher, room, roster count, and live location counts. Group cards open the exact roster. |
| Teacher Dashboard | Shows groups assigned to the logged-in teacher in the current configured period. |
| Attendance | Keeps daily attendance independent and displays each student's expected current group. |
| Teaching Mode | Selects persisted period and instructional group; roster comes from persisted memberships. |
| Grades / Tests | Filters bulk entry by period/group and snapshots period, group, teacher, and room on every new score. |
| Schedule | Shows all persisted periods and their groups, teacher, room, and roster counts. |
| Students | Keeps Grade as homeroom and adds Current Group to table/directory views. |
| Student Profile | Keeps permanent student data and adds the current instructional assignment. |

## Intentionally homeroom-based consumers

- School structure and grade placement
- Grade/homeroom filters in Students, Attendance status boards, Behavior, and attendance reports
- Division access and permanent teacher/homeroom ownership

These remain available because they answer permanent grade/homeroom questions. They must not be repurposed as period assignments.

## Historical compatibility

Existing attendance, homeroom, multi-class, and test-score records are not migrated or deleted. Older grade records without an instructional snapshot continue to display normally; new records include the snapshot fields.