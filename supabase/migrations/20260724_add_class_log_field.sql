-- Add class log JSONB column to students table
-- Stores student time in/out of class with staff assignments

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_log jsonb DEFAULT '[]'::jsonb;

-- Create GIN index for efficient querying
CREATE INDEX IF NOT EXISTS idx_students_class_log_gin ON public.students USING gin(class_log);
