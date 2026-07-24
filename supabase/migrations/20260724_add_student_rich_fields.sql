-- Add JSONB columns to students table for rich fields persistence
-- Following the same pattern as student_flags: store as JSONB to maintain flexibility

ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS attendance jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS behavior_log jsonb DEFAULT '[]'::jsonb;

-- Create indexes for efficient queries on these columns if needed
CREATE INDEX IF NOT EXISTS idx_students_attendance
  ON public.students USING GIN (attendance);

CREATE INDEX IF NOT EXISTS idx_students_notes
  ON public.students USING GIN (notes);

CREATE INDEX IF NOT EXISTS idx_students_behavior_log
  ON public.students USING GIN (behavior_log);

COMMENT ON COLUMN public.students.attendance IS
  'Array of attendance records { date, status, ... }. Stored as JSONB to preserve flexibility while migrating from local-only state.';

COMMENT ON COLUMN public.students.notes IS
  'Array of student notes { date, author, text }. Stored as JSONB to preserve flexibility while migrating from local-only state.';

COMMENT ON COLUMN public.students.behavior_log IS
  'Array of behavior log entries { date, staff, incident, action, ... }. Stored as JSONB to preserve flexibility while migrating from local-only state.';
