-- =============================================================================
-- Multi-class membership + grade class context
-- Run this entire script in Supabase SQL Editor (project > SQL Editor > New Query)
--
-- Purely additive: does NOT touch students, grade_entries data, or the existing
-- single-value student_class_assignments table (still used as the student's
-- primary/homeroom class). This adds a new many-to-many table so a student can
-- ALSO belong to any number of additional classes (Gemara level, Math group,
-- Reading group, etc.) without losing their homeroom assignment.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. student_additional_classes — many-to-many, on top of the primary class
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_additional_classes (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  INTEGER       NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id    TEXT          NOT NULL,
  class_name  TEXT          NOT NULL DEFAULT '',
  added_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  added_by    TEXT          NOT NULL DEFAULT 'Admin',
  UNIQUE (student_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_sac_student_id ON public.student_additional_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_sac_class_id   ON public.student_additional_classes(class_id);

ALTER TABLE public.student_additional_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sac_select_portal ON public.student_additional_classes;
DROP POLICY IF EXISTS sac_insert_portal ON public.student_additional_classes;
DROP POLICY IF EXISTS sac_update_portal ON public.student_additional_classes;
DROP POLICY IF EXISTS sac_delete_portal ON public.student_additional_classes;

CREATE POLICY sac_select_portal ON public.student_additional_classes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY sac_insert_portal ON public.student_additional_classes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY sac_update_portal ON public.student_additional_classes
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY sac_delete_portal ON public.student_additional_classes
  FOR DELETE TO anon, authenticated USING (true);

-- Add to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_additional_classes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_additional_classes;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. grade_entries — record which class a grade belongs to
-- ---------------------------------------------------------------------------

ALTER TABLE public.grade_entries
  ADD COLUMN IF NOT EXISTS class_id   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS class_name TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_grade_entries_class_id ON public.grade_entries(class_id);
