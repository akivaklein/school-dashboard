-- One-time roster seed for teacher_rebbe_assignments.
--
-- Why this exists:
-- - setup_assignments may not contain full historical rosters.
-- - Existing full demo roster currently lives in fixture mappings (class -> teacher, student -> class).
--
-- What this does:
-- 1) Uses student_class_assignments where present.
-- 2) Falls back to known fixture student->class roster for students missing DB class rows.
-- 3) Maps class->teacher from known class roster.
-- 4) Seeds Period 1/2/3 assignments (P1=primary, P2/P3=additional).
-- 5) Does NOT overwrite existing active assignment for same student+period (preserves manual moves made today).
-- 6) Prevents duplicate active logical assignments via partial unique index.

CREATE OR REPLACE FUNCTION public.normalize_assignment_slug(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(trim(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g');
$$;

WITH class_teacher_map AS (
  SELECT * FROM (VALUES
    ('a'::TEXT, 'Dargei Alef'::TEXT, 'Rabbi Klein'::TEXT),
    ('a'::TEXT, 'Dargei Alef'::TEXT, 'Rabbi Lefkowitz'::TEXT),
    ('a'::TEXT, 'Dargei Alef'::TEXT, 'Rabbi Abowitz'::TEXT),
    ('b'::TEXT, 'Dargei Beis'::TEXT, 'Rabbi Goldstein'::TEXT),
    ('c'::TEXT, 'Dargei Gimmel'::TEXT, 'Rabbi Ehrnreich'::TEXT),
    ('d'::TEXT, 'Dargei Daled'::TEXT, 'Rabbi Ambush'::TEXT),
    ('yk-a'::TEXT, 'Yeshiva Ketana Alef'::TEXT, 'Rabbi Schults'::TEXT),
    ('yk-b'::TEXT, 'Yeshiva Ketana Beis'::TEXT, 'Rabbi Schimborski'::TEXT)
  ) AS t(class_id, class_or_group, teacher_name)
),
fixture_student_classes AS (
  SELECT * FROM (VALUES
    (1, 'a'), (2, 'a'), (3, 'a'), (4, 'a'), (5, 'a'), (6, 'a'), (7, 'a'),
    (8, 'b'), (9, 'b'), (10, 'b'), (11, 'b'), (12, 'b'), (13, 'b'), (14, 'b'),
    (15, 'c'), (16, 'c'), (17, 'c'), (18, 'c'), (19, 'c'), (20, 'c'), (21, 'c'),
    (22, 'd'), (23, 'd'), (24, 'd'), (25, 'd'), (26, 'd'), (27, 'd'), (28, 'd'),
    (101, 'yk-a'), (102, 'yk-a'), (103, 'yk-a'), (104, 'yk-a'), (105, 'yk-a'), (106, 'yk-a'), (107, 'yk-a'), (108, 'yk-a'),
    (109, 'yk-b'), (110, 'yk-b'), (111, 'yk-b'), (112, 'yk-b'), (113, 'yk-b'), (114, 'yk-b'), (115, 'yk-b')
  ) AS f(student_id, class_id)
),
db_student_classes AS (
  SELECT student_id, class_id
  FROM public.student_class_assignments
  WHERE class_id IS NOT NULL
    AND trim(class_id) <> ''
),
merged_student_classes AS (
  SELECT student_id, class_id
  FROM db_student_classes

  UNION ALL

  SELECT f.student_id, f.class_id
  FROM fixture_student_classes f
  WHERE NOT EXISTS (
    SELECT 1
    FROM db_student_classes d
    WHERE d.student_id = f.student_id
  )
),
valid_students AS (
  SELECT DISTINCT m.student_id, m.class_id
  FROM merged_student_classes m
  INNER JOIN public.students s
    ON s.id = m.student_id
),
period_template AS (
  SELECT * FROM (VALUES
    (1, 'Period 1'::TEXT, 'primary'::TEXT),
    (2, 'Period 2'::TEXT, 'additional'::TEXT),
    (3, 'Period 3'::TEXT, 'additional'::TEXT)
  ) AS p(period_num, period_label, assignment_type)
),
candidates AS (
  SELECT
    vs.student_id,
    ctm.teacher_name,
    'General'::TEXT AS subject,
    ctm.class_or_group,
    p.period_label AS period,
    ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']::TEXT[] AS weekdays,
    NULL::DATE AS start_date,
    NULL::DATE AS end_date,
    p.assignment_type,
    'active'::TEXT AS status,
    'Roster fixture seed'::TEXT AS updated_by,
    (
      'tra-' || vs.student_id::TEXT || '-' ||
      public.normalize_assignment_slug(ctm.teacher_name) || '-' ||
      public.normalize_assignment_slug('General') || '-' ||
      public.normalize_assignment_slug(ctm.class_or_group) || '-' ||
      public.normalize_assignment_slug(p.period_label) || '-' ||
      p.assignment_type
    ) AS id
  FROM valid_students vs
  INNER JOIN class_teacher_map ctm
    ON ctm.class_id = vs.class_id
  CROSS JOIN period_template p
),
filtered_candidates AS (
  SELECT c.*
  FROM candidates c
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.teacher_rebbe_assignments existing
    WHERE existing.student_id = c.student_id
      AND existing.status = 'active'
      AND lower(trim(existing.period)) = lower(trim(c.period))
  )
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
FROM filtered_candidates
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
  updated_by = 'Roster fixture seed dedupe',
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
