begin;

create table if not exists public.davening_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  title text not null default 'Davening Checklist',
  show_numbering boolean not null default true,
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  ratings jsonb not null default '[]'::jsonb check (jsonb_typeof(ratings) = 'array'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (created_by, name)
);

create table if not exists public.davening_checklists (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.davening_templates(id) on delete set null,
  checklist_date date not null,
  scope_type text not null check (scope_type in ('class', 'group')),
  scope_id text not null,
  scope_label text not null,
  title text not null,
  sections jsonb not null check (jsonb_typeof(sections) = 'array'),
  ratings jsonb not null check (jsonb_typeof(ratings) = 'array'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_by_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (template_id, checklist_date, scope_type, scope_id)
);

create table if not exists public.davening_marks (
  checklist_id uuid not null references public.davening_checklists(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  section_id text not null,
  rating_id text not null,
  updated_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by_name text not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (checklist_id, student_id, section_id)
);

create index if not exists davening_checklists_date_idx on public.davening_checklists (checklist_date desc);
create index if not exists davening_marks_student_idx on public.davening_marks (student_id, updated_at desc);

alter table public.davening_templates enable row level security;
alter table public.davening_checklists enable row level security;
alter table public.davening_marks enable row level security;

revoke all on table public.davening_templates from anon;
revoke all on table public.davening_checklists from anon;
revoke all on table public.davening_marks from anon;
grant select, insert, update, delete on table public.davening_templates to authenticated;
grant select, insert, update, delete on table public.davening_checklists to authenticated;
grant select, insert, update, delete on table public.davening_marks to authenticated;

create policy davening_templates_select_secure on public.davening_templates for select to authenticated using (true);
create policy davening_templates_insert_secure on public.davening_templates for insert to authenticated with check (created_by = auth.uid());
create policy davening_templates_update_secure on public.davening_templates for update to authenticated using (true) with check (true);
create policy davening_templates_delete_secure on public.davening_templates for delete to authenticated using (true);

create policy davening_checklists_select_secure on public.davening_checklists for select to authenticated using (true);
create policy davening_checklists_insert_secure on public.davening_checklists for insert to authenticated with check (created_by = auth.uid());
create policy davening_checklists_update_secure on public.davening_checklists for update to authenticated using (true) with check (true);
create policy davening_checklists_delete_secure on public.davening_checklists for delete to authenticated using (true);

create policy davening_marks_select_secure on public.davening_marks for select to authenticated using (true);
create policy davening_marks_insert_secure on public.davening_marks for insert to authenticated with check (updated_by = auth.uid());
create policy davening_marks_update_secure on public.davening_marks for update to authenticated using (true) with check (true);
create policy davening_marks_delete_secure on public.davening_marks for delete to authenticated using (true);

commit;
