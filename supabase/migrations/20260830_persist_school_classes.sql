-- =============================================================================
-- Persist school classes (Setup > Classes & Divisions)
-- Run this entire script in Supabase SQL Editor (project > SQL Editor > New Query)
--
-- Classes created via "+ Add Class" were only held in an in-memory JS array and
-- disappeared on refresh/logout/another device. This adds a real table and
-- seeds it with the existing 7th/8th Grade classes so nothing regresses for
-- current real students.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id           TEXT          PRIMARY KEY,
  name         TEXT          NOT NULL,
  grade        TEXT          NOT NULL DEFAULT '',
  teacher      TEXT          NOT NULL DEFAULT '',
  division_key TEXT          NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.classes_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS classes_updated_at ON public.classes;
CREATE TRIGGER classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.classes_set_updated_at();

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classes_select_portal ON public.classes;
DROP POLICY IF EXISTS classes_insert_portal ON public.classes;
DROP POLICY IF EXISTS classes_update_portal ON public.classes;
DROP POLICY IF EXISTS classes_delete_portal ON public.classes;

CREATE POLICY classes_select_portal ON public.classes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY classes_insert_portal ON public.classes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY classes_update_portal ON public.classes
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY classes_delete_portal ON public.classes
  FOR DELETE TO anon, authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'classes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
  END IF;
END $$;

-- Seed the existing Yeshiva Ketana classes so real students keep their class
-- immediately after this migration runs. Safe to re-run (no-op if present).
INSERT INTO public.classes (id, name, grade, teacher, division_key) VALUES
  ('yk-a', '8th Grade', '8th Grade', 'Rabbi Schults', 'yeshiva_ketana'),
  ('yk-b', '7th Grade', '7th Grade', 'Rabbi Schimborski', 'yeshiva_ketana')
ON CONFLICT (id) DO NOTHING;
