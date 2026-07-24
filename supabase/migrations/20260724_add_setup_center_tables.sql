-- Create setup_assignments table for staff assignments (periods and caseload)
CREATE TABLE IF NOT EXISTS public.setup_assignments (
  staff_name TEXT PRIMARY KEY,
  assignments_data jsonb DEFAULT '{"periods":{"1":[],"2":[],"3":[]},"caseload":[]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create therapy_schedule table for therapy sessions
CREATE TABLE IF NOT EXISTS public.therapy_schedule (
  id INT PRIMARY KEY DEFAULT 1,
  schedule_data jsonb DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_accounts table for staff account settings (active, divisions)
CREATE TABLE IF NOT EXISTS public.staff_accounts (
  staff_name TEXT PRIMARY KEY,
  account_data jsonb DEFAULT '{"active":true,"divisions":"both"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GIN indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_setup_assignments_data_gin ON public.setup_assignments USING gin(assignments_data);
CREATE INDEX IF NOT EXISTS idx_therapy_schedule_data_gin ON public.therapy_schedule USING gin(schedule_data);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_data_gin ON public.staff_accounts USING gin(account_data);
