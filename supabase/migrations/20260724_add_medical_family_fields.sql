-- Add JSONB columns for medical and family information to students table
-- Following the pattern from student_flags and behavior_log

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS medical jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS family jsonb DEFAULT '{}'::jsonb;

-- Create GIN indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_students_medical_gin ON public.students USING gin(medical);
CREATE INDEX IF NOT EXISTS idx_students_family_gin ON public.students USING gin(family);
