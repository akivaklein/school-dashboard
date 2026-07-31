-- =============================================================================
-- Grade Entries + Student Class Assignments
-- Run this entire script in Supabase SQL Editor (project > SQL Editor > New Query)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.  grade_entries  –  one row per assessment result, replaces JSONB blobs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.grade_entries (
  id              TEXT          PRIMARY KEY,
  student_id      INTEGER       NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher         TEXT          NOT NULL,
  subject         TEXT          NOT NULL,
  skill           TEXT          NOT NULL DEFAULT '',
  assessment_name TEXT          NOT NULL,
  assessment_type TEXT          NOT NULL DEFAULT 'Quiz',
  date            DATE          NOT NULL,
  score_type      TEXT          NOT NULL DEFAULT 'points',
  score           INTEGER,
  max_score       INTEGER,
  rating          TEXT,
  attempt_status  TEXT          NOT NULL DEFAULT 'scored',
  grading_method  TEXT          NOT NULL DEFAULT 'points',
  notes           TEXT          NOT NULL DEFAULT '',
  entered_by      TEXT          NOT NULL DEFAULT 'Staff',
  entered_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  source_context  TEXT          NOT NULL DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_grade_entries_student  ON public.grade_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_entries_teacher  ON public.grade_entries(teacher);
CREATE INDEX IF NOT EXISTS idx_grade_entries_subject  ON public.grade_entries(subject);
CREATE INDEX IF NOT EXISTS idx_grade_entries_date     ON public.grade_entries(date DESC);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.grade_entries_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS grade_entries_updated_at ON public.grade_entries;
CREATE TRIGGER grade_entries_updated_at
  BEFORE UPDATE ON public.grade_entries
  FOR EACH ROW EXECUTE FUNCTION public.grade_entries_set_updated_at();

-- RLS (open to anon/authenticated for demo — tighten before production)
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_entries_select_portal ON public.grade_entries;
DROP POLICY IF EXISTS grade_entries_insert_portal ON public.grade_entries;
DROP POLICY IF EXISTS grade_entries_update_portal ON public.grade_entries;
DROP POLICY IF EXISTS grade_entries_delete_portal ON public.grade_entries;

CREATE POLICY grade_entries_select_portal ON public.grade_entries
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY grade_entries_insert_portal ON public.grade_entries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY grade_entries_update_portal ON public.grade_entries
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY grade_entries_delete_portal ON public.grade_entries
  FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 2.  student_class_assignments  –  persists division/class per student
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_class_assignments (
  student_id    INTEGER       PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  class_id      TEXT          NOT NULL DEFAULT '',
  division_key  TEXT          NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_by    TEXT          NOT NULL DEFAULT 'Admin'
);

CREATE INDEX IF NOT EXISTS idx_sca_class_id     ON public.student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_sca_division_key ON public.student_class_assignments(division_key);

CREATE OR REPLACE FUNCTION public.sca_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS sca_updated_at ON public.student_class_assignments;
CREATE TRIGGER sca_updated_at
  BEFORE UPDATE ON public.student_class_assignments
  FOR EACH ROW EXECUTE FUNCTION public.sca_set_updated_at();

ALTER TABLE public.student_class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sca_select_portal ON public.student_class_assignments;
DROP POLICY IF EXISTS sca_insert_portal ON public.student_class_assignments;
DROP POLICY IF EXISTS sca_update_portal ON public.student_class_assignments;
DROP POLICY IF EXISTS sca_delete_portal ON public.student_class_assignments;

CREATE POLICY sca_select_portal ON public.student_class_assignments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY sca_insert_portal ON public.student_class_assignments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY sca_update_portal ON public.student_class_assignments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY sca_delete_portal ON public.student_class_assignments
  FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 3.  Realtime publication
--     Supabase broadcasts changes to subscribed clients for both tables.
-- ---------------------------------------------------------------------------

-- Add grade_entries to realtime (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'grade_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.grade_entries;
  END IF;
END $$;

-- Add student_class_assignments to realtime (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'student_class_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_class_assignments;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Done.  Run this once; subsequent runs are safe (all statements are idempotent).
-- ---------------------------------------------------------------------------
