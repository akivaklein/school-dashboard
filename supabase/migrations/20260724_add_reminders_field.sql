-- Add reminders count to students table
-- Tracks behavior reminders/warnings count for each student

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS reminders integer DEFAULT 0;
