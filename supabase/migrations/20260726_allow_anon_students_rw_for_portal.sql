-- Temporary policy fix for production portal writes.
-- The app currently uses custom in-app login (not Supabase Auth user_profiles),
-- so strict role-based RLS can block all browser updates to students.
--
-- This migration opens students read/write to anon+authenticated so attendance and
-- other dashboard updates persist from the deployed Vercel app.
--
-- IMPORTANT: Replace with least-privilege policies after Supabase Auth integration.

begin;

alter table public.students enable row level security;

-- Remove stricter policies if they exist.
drop policy if exists students_select_authenticated on public.students;
drop policy if exists students_insert_admin on public.students;
drop policy if exists students_update_staff on public.students;
drop policy if exists students_delete_admin on public.students;

-- Open read/write for current portal architecture.
create policy students_select_portal
on public.students
for select
to anon, authenticated
using (true);

create policy students_insert_portal
on public.students
for insert
to anon, authenticated
with check (true);

create policy students_update_portal
on public.students
for update
to anon, authenticated
using (true)
with check (true);

create policy students_delete_portal
on public.students
for delete
to anon, authenticated
using (true);

commit;
