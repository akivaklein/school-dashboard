-- Add JSONB column for parent calls to students table
-- Following the pattern from attendance, notes, behavior_log, medical, family

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_calls jsonb DEFAULT '[]'::jsonb;

-- Create GIN index for efficient querying
CREATE INDEX IF NOT EXISTS idx_students_parent_calls_gin ON public.students USING gin(parent_calls);
