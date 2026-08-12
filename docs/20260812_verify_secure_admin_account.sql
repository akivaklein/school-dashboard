-- Read-only verification for the secure Yeshiva Ketana admin account.
-- Safe to run in the Supabase SQL editor: SELECT only, no writes, no password changes.

-- 1) Auth user exists and is confirmed.
select id, email, email_confirmed_at, last_sign_in_at, created_at
from auth.users
order by created_at;

-- 2) Every auth user's dashboard role record (0 rows here = the "no staff profile" screen).
select u.id as auth_user_id,
       u.email,
       ur.role,
       ur.display_name,
       ur.is_active
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
order by u.email;

-- 3) Duplicate role rows (should return no rows; the app now refuses to guess).
select user_id, count(*) as role_row_count
from public.user_roles
group by user_id
having count(*) > 1;

-- 4) Auth users with no role row at all.
select u.id, u.email
from auth.users u
where not exists (select 1 from public.user_roles ur where ur.user_id = u.id);

-- 5) RLS is still enabled on the secure tables.
select relname, relrowsecurity
from pg_class
where relname in ('user_roles', 'staff', 'students')
  and relnamespace = 'public'::regnamespace;
