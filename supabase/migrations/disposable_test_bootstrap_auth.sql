-- Disposable-only bootstrap for local validation in a plain PostgreSQL container.
-- This file is NOT part of the production migration path and is never deployed to Supabase.

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid;
$$;

create table if not exists auth.users (
  id uuid primary key,
  email text not null unique
);

insert into auth.users (id, email)
values (
  '7ac63643-948e-438b-bc2c-dd3cae19b8b0',
  'admin@yeshiva-ketana.local'
)
on conflict (id) do nothing;
