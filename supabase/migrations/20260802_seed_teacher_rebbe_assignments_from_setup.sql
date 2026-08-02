-- One-time import of existing teacher class rosters into teacher_rebbe_assignments.
-- Source of truth after this import remains public.teacher_rebbe_assignments.
--
-- What this does:
-- 1) Imports Period 1/2/3 rosters from setup_assignments JSON into teacher_rebbe_assignments.
-- 2) Re-activates existing matching rows (id conflict upsert) instead of duplicating.
-- 3) Deactivates duplicate active rows on same logical assignment key.
-- 4) Adds a unique partial index to prevent duplicate active assignments.

CREATE OR REPLACE FUNCTION public.normalize_assignment_slug(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(trim(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g');
$$;

WITH period_source AS (
  SELECT
    sa.staff_name AS teacher_name,
    period_num,
    student_id,
    CASE WHEN period_num = 1 THEN 'primary' ELSE 'additional' END AS assignment_type,
    format('Period %s', period_num) AS period_label
  FROM public.setup_assignments sa
  CROSS JOIN LATERAL (
    SELECT
      p.period_num,
      (jsonb_array_elements_text(
        coalesce(sa.assignments_data -> 'periods' -> p.period_num::TEXT, '[]'::jsonb)
      ))::INTEGER AS student_id
    FROM (VALUES (1), (2), (3)) AS p(period_num)
  ) expanded
  WHERE sa.staff_name IS NOT NULL
    AND sa.staff_name NOT LIKE '__%'
),
class_map AS (
  SELECT
    sca.student_id,
    sca.class_id,
    CASE sca.class_id
      WHEN 'a' THEN 'Dargei Alef'
      WHEN 'b' THEN 'Dargei Beis'
      WHEN 'c' THEN 'Dargei Gimmel'
      WHEN 'd' THEN 'Dargei Daled'
      WHEN 'yk-a' THEN 'Yeshiva Ketana Alef'
      WHEN 'yk-b' THEN 'Yeshiva Ketana Beis'
      ELSE sca.class_id
    END AS class_or_group
  FROM public.student_class_assignments sca
),
import_rows AS (
  SELECT DISTINCT
    ps.student_id,
    ps.teacher_name,
    'General'::TEXT AS subject,
    coalesce(cm.class_or_group, 'Unassigned Class') AS class_or_group,
    ps.period_label AS period,
    ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']::TEXT[] AS weekdays,
    NULL::DATE AS start_date,
    NULL::DATE AS end_date,
    ps.assignment_type,
    'active'::TEXT AS status,
    'Setup import'::TEXT AS updated_by,
    (
      'tra-' || ps.student_id::TEXT || '-' ||
      public.normalize_assignment_slug(ps.teacher_name) || '-' ||
      public.normalize_assignment_slug('General') || '-' ||
      public.normalize_assignment_slug(coalesce(cm.class_or_group, 'Unassigned Class')) || '-' ||
      public.normalize_assignment_slug(ps.period_label) || '-' ||
      ps.assignment_type
    ) AS id
  FROM period_source ps
  LEFT JOIN class_map cm
    ON cm.student_id = ps.student_id
)
INSERT INTO public.teacher_rebbe_assignments (
  id,
  student_id,
  teacher_name,
  subject,
  class_or_group,
  period,
  weekdays,
  start_date,
  end_date,
  assignment_type,
  status,
  updated_by,
  updated_at
)
SELECT
  id,
  student_id,
  teacher_name,
  subject,
  class_or_group,
  period,
  weekdays,
  start_date,
  end_date,
  assignment_type,
  status,
  updated_by,
  now()
FROM import_rows
ON CONFLICT (id) DO UPDATE
SET
  student_id = EXCLUDED.student_id,
  teacher_name = EXCLUDED.teacher_name,
  subject = EXCLUDED.subject,
  class_or_group = EXCLUDED.class_or_group,
  period = EXCLUDED.period,
  weekdays = EXCLUDED.weekdays,
  assignment_type = EXCLUDED.assignment_type,
  status = 'active',
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

WITH ranked_active AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY
        student_id,
        lower(trim(teacher_name)),
        lower(trim(subject)),
        lower(trim(class_or_group)),
        lower(trim(period)),
        assignment_type
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.teacher_rebbe_assignments
  WHERE status = 'active'
)
UPDATE public.teacher_rebbe_assignments t
SET
  status = 'inactive',
  updated_by = 'Setup import dedupe',
  updated_at = now()
FROM ranked_active r
WHERE t.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_rebbe_active_assignment
ON public.teacher_rebbe_assignments (
  student_id,
  lower(trim(teacher_name)),
  lower(trim(subject)),
  lower(trim(class_or_group)),
  lower(trim(period)),
  assignment_type
)
WHERE status = 'active';
