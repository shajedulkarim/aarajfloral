-- 002_staff_permissions.sql
-- Owner and staff roles with per-person permissions. Run after 001. Safe to re-run.
--
-- BEFORE running: create the owner's login first (Dashboard > Authentication > Users > Add user,
-- tick "Auto confirm user"). This script makes the earliest existing user the owner if no owner exists yet.
-- To name a different owner later, run:  select public.make_owner('someone@example.com');

create table if not exists public.staff_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text not null default '',
  role       text not null default 'staff' check (role in ('owner','staff')),
  perms      jsonb not null default '{"orders":false,"availability":false,"menu":false,"insights":false,"photos":false,"settings":false}',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.staff_profiles enable row level security;

-- The real permission check. Owners pass everything. Staff pass what their perms allow.
create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_profiles s
    where s.user_id = auth.uid() and s.active
      and (s.role = 'owner' or coalesce((s.perms ->> p)::boolean, false))
  )
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_profiles s where s.user_id = auth.uid() and s.active and s.role = 'owner')
$$;

-- Staff can read their own row. Owners can read all rows. Nobody writes directly: use the RPCs in 003.
drop policy if exists staff_read_own on public.staff_profiles;
create policy staff_read_own on public.staff_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_owner());

grant select on public.staff_profiles to authenticated;
grant execute on function public.has_perm(text) to anon, authenticated;
grant execute on function public.is_owner() to authenticated;

-- Promote an existing login to owner. Callable only from the SQL editor (postgres role).
create or replace function public.make_owner(p_email text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'no auth user with email %', p_email; end if;
  insert into public.staff_profiles (user_id, email, name, role, perms, active)
  values (uid, lower(p_email), 'Owner', 'owner',
          '{"orders":true,"availability":true,"menu":true,"insights":true,"photos":true,"settings":true}', true)
  on conflict (user_id) do update set role = 'owner', active = true,
    perms = '{"orders":true,"availability":true,"menu":true,"insights":true,"photos":true,"settings":true}';
end $$;
revoke execute on function public.make_owner(text) from public, anon, authenticated;

-- First run: if nobody is an owner yet, the earliest login becomes the owner.
insert into public.staff_profiles (user_id, email, name, role, perms, active)
select u.id, lower(u.email), 'Owner', 'owner',
       '{"orders":true,"availability":true,"menu":true,"insights":true,"photos":true,"settings":true}', true
from auth.users u
where not exists (select 1 from public.staff_profiles where role = 'owner')
order by u.created_at
limit 1
on conflict (user_id) do nothing;

-- Tighten policies that 001 created so settings-level actions need the right permission.
-- (001 policies already call has_perm(), so they pick up the real check automatically.)
-- Hidden categories and items stay visible to anyone who can manage the menu or availability.
