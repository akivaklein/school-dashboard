-- Add multi-role and contact support to staff records.
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS roles TEXT[];

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE public.staff
SET roles = ARRAY[LOWER(REPLACE(COALESCE(NULLIF(role, ''), 'staff'), ' ', '-'))]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

ALTER TABLE public.staff
  ALTER COLUMN roles SET DEFAULT ARRAY['staff']::TEXT[];

UPDATE public.staff
SET roles = ARRAY['staff']
WHERE array_length(roles, 1) IS NULL;

ALTER TABLE public.staff
  ALTER COLUMN roles SET NOT NULL;

UPDATE public.staff
SET role = COALESCE(roles[1], 'staff')
WHERE role IS NULL OR role = '';

CREATE INDEX IF NOT EXISTS idx_staff_roles_gin ON public.staff USING gin(roles);
