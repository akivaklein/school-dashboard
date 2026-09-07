CREATE TABLE IF NOT EXISTS public.instructional_periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  daypart TEXT NOT NULL DEFAULT 'Morning',
  sort_order INTEGER NOT NULL DEFAULT 1,
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.physical_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instructional_groups (
  id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES public.instructional_periods(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  teacher_name TEXT NOT NULL DEFAULT '',
  room_id TEXT REFERENCES public.physical_rooms(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instructional_group_memberships (
  group_id TEXT NOT NULL REFERENCES public.instructional_groups(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  added_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_instructional_groups_period ON public.instructional_groups(period_id);
CREATE INDEX IF NOT EXISTS idx_instructional_group_memberships_student ON public.instructional_group_memberships(student_id);

ALTER TABLE public.instructional_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructional_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructional_group_memberships ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['instructional_periods', 'physical_rooms', 'instructional_groups', 'instructional_group_memberships'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_portal ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_read_school ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_write_leadership ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY %I_read_school ON public.%I FOR SELECT TO authenticated USING (public.dashboard_current_role() IN (''admin'', ''principal'', ''teacher'', ''rebbe'', ''therapist'', ''support_staff''))', table_name, table_name);
    EXECUTE format('CREATE POLICY %I_write_leadership ON public.%I FOR ALL TO authenticated USING (public.dashboard_is_leadership()) WITH CHECK (public.dashboard_is_leadership())', table_name, table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
  END LOOP;
END $$;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['instructional_periods', 'physical_rooms', 'instructional_groups', 'instructional_group_memberships'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;