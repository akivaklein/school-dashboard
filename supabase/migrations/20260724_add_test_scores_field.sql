-- Add test scores JSONB column to students table
-- Stores academic assessment scores and ratings

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS test_scores jsonb DEFAULT '[]'::jsonb;

-- Create GIN index for efficient querying
CREATE INDEX IF NOT EXISTS idx_students_test_scores_gin ON public.students USING gin(test_scores);
