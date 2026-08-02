-- Teacher/Rebbe assignments separate from primary class/division assignment.
-- Supports multiple assignments per student with schedule metadata.

CREATE TABLE IF NOT EXISTS public.teacher_rebbe_assignments (
  id              TEXT PRIMARY KEY,
  student_id      INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_name    TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT '',
  class_or_group  TEXT NOT NULL DEFAULT '',
  period          TEXT NOT NULL DEFAULT '',
  weekdays        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  start_date      DATE,
  end_date        DATE,
  assignment_type TEXT NOT NULL DEFAULT 'additional' CHECK (assignment_type IN ('primary', 'additional')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  updated_by      TEXT NOT NULL DEFAULT 'System',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_rebbe_assignments_teacher ON public.teacher_rebbe_assignments(teacher_name);
CREATE INDEX IF NOT EXISTS idx_teacher_rebbe_assignments_student ON public.teacher_rebbe_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_rebbe_assignments_status ON public.teacher_rebbe_assignments(status);

CREATE OR REPLACE FUNCTION public.teacher_rebbe_assignments_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teacher_rebbe_assignments_updated_at ON public.teacher_rebbe_assignments;
CREATE TRIGGER teacher_rebbe_assignments_updated_at
  BEFORE UPDATE ON public.teacher_rebbe_assignments
  FOR EACH ROW EXECUTE FUNCTION public.teacher_rebbe_assignments_set_updated_at();

ALTER TABLE public.teacher_rebbe_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_rebbe_assignments_select_portal ON public.teacher_rebbe_assignments;
DROP POLICY IF EXISTS teacher_rebbe_assignments_insert_portal ON public.teacher_rebbe_assignments;
DROP POLICY IF EXISTS teacher_rebbe_assignments_update_portal ON public.teacher_rebbe_assignments;
DROP POLICY IF EXISTS teacher_rebbe_assignments_delete_portal ON public.teacher_rebbe_assignments;

CREATE POLICY teacher_rebbe_assignments_select_portal ON public.teacher_rebbe_assignments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY teacher_rebbe_assignments_insert_portal ON public.teacher_rebbe_assignments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY teacher_rebbe_assignments_update_portal ON public.teacher_rebbe_assignments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY teacher_rebbe_assignments_delete_portal ON public.teacher_rebbe_assignments
  FOR DELETE TO anon, authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'teacher_rebbe_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_rebbe_assignments;
  END IF;
END $$;
