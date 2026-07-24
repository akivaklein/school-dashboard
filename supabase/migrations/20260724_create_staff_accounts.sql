-- Create staff table for real, trackable accounts
CREATE TABLE IF NOT EXISTS public.staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin', 'teacher', 'therapist', 'staff'
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.staff IS
  'Real staff member accounts for name-based login and action tracking. Each staff member is trackable for testing and auditing.';

COMMENT ON COLUMN public.staff.id IS 'Unique staff identifier';
COMMENT ON COLUMN public.staff.name IS 'Staff member full name (unique, required)';
COMMENT ON COLUMN public.staff.role IS 'Role type: admin, teacher, therapist, or staff';
COMMENT ON COLUMN public.staff.active IS 'Whether this staff member can log in';
COMMENT ON COLUMN public.staff.created_at IS 'When staff account was created';
COMMENT ON COLUMN public.staff.updated_at IS 'When staff account was last updated';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_name ON public.staff(name);
CREATE INDEX IF NOT EXISTS idx_staff_active ON public.staff(active);

-- Seed with initial staff from the app
INSERT INTO public.staff (name, role, active) VALUES
  ('Rabbi Baum', 'admin', true),
  ('Eli Bloom', 'admin', true),
  ('Zev Reisman', 'admin', true),
  ('Eli Stern', 'admin', true),
  ('Rabbi Ehrnreich', 'admin', true),
  ('Rabbi Weiss', 'admin', true),
  ('Rabbi Hillel', 'admin', true),
  ('Rabbi Fried', 'admin', true),
  ('Rabbi Blau', 'admin', true),
  ('Rabbi Abramowitz', 'admin', true),
  ('Rabbi Lefkowitz', 'admin', true),
  ('Rabbi Klein', 'teacher', true),
  ('Rabbi Schults', 'teacher', true),
  ('Rabbi Schimborski', 'teacher', true),
  ('Rabbi Goldstein', 'teacher', true),
  ('Rabbi Ambush', 'teacher', true),
  ('Rabbi Abowitz', 'teacher', true),
  ('Shelly Wagschal', 'therapist', true),
  ('Aryeh Schechter', 'therapist', true),
  ('Tzvi Malks', 'therapist', true),
  ('Yitzi Liebowitz', 'therapist', true),
  ('Mrs. Goldberg', 'therapist', true),
  ('Mrs. Friedman', 'therapist', true),
  ('Canteen Register', 'staff', true)
ON CONFLICT (name) DO NOTHING;
