-- Create login_sessions table for tracking staff login activity
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  role TEXT NOT NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_time TIMESTAMPTZ,
  session_duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.login_sessions IS
  'Tracks all staff login/logout sessions for auditing and analytics.';

COMMENT ON COLUMN public.login_sessions.staff_id IS 'Reference to staff member';
COMMENT ON COLUMN public.login_sessions.staff_name IS 'Staff name snapshot at login time';
COMMENT ON COLUMN public.login_sessions.role IS 'Staff role snapshot at login time';
COMMENT ON COLUMN public.login_sessions.login_time IS 'When staff logged in';
COMMENT ON COLUMN public.login_sessions.logout_time IS 'When staff logged out (NULL if still logged in)';
COMMENT ON COLUMN public.login_sessions.session_duration_seconds IS 'Total session duration (calculated on logout)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_login_sessions_staff_id ON public.login_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_time ON public.login_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_sessions_staff_name ON public.login_sessions(staff_name);
