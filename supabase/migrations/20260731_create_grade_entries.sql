-- Grade entries table for realtime sync between teachers and admin
-- Stores individual assessment results separate from the JSONB students.test_scores column
-- This allows realtime subscription and cross-session sync without reloading all students

CREATE TABLE IF NOT EXISTS public.grade_entries (
  id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher TEXT NOT NULL,
  subject TEXT NOT NULL,
  skill TEXT NOT NULL DEFAULT '',
  assessment_name TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'Quiz',
  date DATE NOT NULL,
  score_type TEXT NOT NULL DEFAULT 'points',  -- 'points' | 'rating' | 'status'
  score INTEGER,
  max_score INTEGER,
  rating TEXT,                                 -- 'Great' | 'Good' | 'Developing' | 'Weak'
  attempt_status TEXT DEFAULT 'scored',        -- 'scored' | 'missed' | 'absent'
  grading_method TEXT DEFAULT 'points',
  notes TEXT DEFAULT '',
  entered_by TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_context TEXT DEFAULT 'manual'         -- 'bulk-entry' | 'single-entry' | 'demo'
);

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_grade_entries_student ON public.grade_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_entries_teacher ON public.grade_entries(teacher);
CREATE INDEX IF NOT EXISTS idx_grade_entries_subject ON public.grade_entries(subject);
CREATE INDEX IF NOT EXISTS idx_grade_entries_date ON public.grade_entries(date DESC);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_grade_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grade_entries_updated_at_trigger
BEFORE UPDATE ON public.grade_entries
FOR EACH ROW
EXECUTE FUNCTION update_grade_entries_updated_at();

-- Note: RLS should be configured based on your auth setup.
-- For the demo (no-password mode), we leave RLS disabled.
-- Before production: enable RLS and add role-based policies.
