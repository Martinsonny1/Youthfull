-- Youthfull: applications table.
-- Run ONCE in Supabase > SQL Editor, in the same project as the Meet GH app.
-- Requires public.is_admin() from the main schema.sql (already in your project).
-- Safe to re-run.

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text not null check (role = 'woman'),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^[0-9]{11,15}$'),
  email text check (email is null or char_length(email) <= 160),
  dob date not null,
  city text not null check (char_length(city) between 2 and 120),
  goal text,
  partner_age_min int,
  partner_age_max int,
  occupation text check (occupation is null or char_length(occupation) <= 160),
  about text not null check (char_length(about) between 5 and 2000),
  heard_from text,
  consent boolean not null check (consent = true),
  status text not null default 'new' check (status in ('new','contacted','verifying','approved','introduced','rejected')),
  notes text
);

create index if not exists applications_created_idx on public.applications (created_at desc);
create index if not exists applications_status_idx on public.applications (status);

-- Enforce the age rules in the database, so they cannot be bypassed from the browser.
-- Change the numbers here if you change them in js/config.js.
create or replace function public.applications_check_age() returns trigger
language plpgsql as $$
declare a int := extract(year from age(current_date, new.dob));
begin
  if new.role = 'woman' and a < 35 then raise exception 'age_rule_woman'; end if;
  if tg_op = 'INSERT' then
    new.status := 'new'; new.notes := null;   -- applicants cannot set these
  end if;
  return new;
end $$;

drop trigger if exists applications_age_trg on public.applications;
create trigger applications_age_trg before insert or update on public.applications
for each row execute function public.applications_check_age();

alter table public.applications enable row level security;

drop policy if exists applications_insert on public.applications;
create policy applications_insert on public.applications
  for insert to anon, authenticated with check (consent = true);

drop policy if exists applications_admin_select on public.applications;
create policy applications_admin_select on public.applications
  for select to authenticated using (public.is_admin());

drop policy if exists applications_admin_update on public.applications;
create policy applications_admin_update on public.applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists applications_admin_delete on public.applications;
create policy applications_admin_delete on public.applications
  for delete to authenticated using (public.is_admin());

grant insert on public.applications to anon, authenticated;
grant select, update, delete on public.applications to authenticated;
