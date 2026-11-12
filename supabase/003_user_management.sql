-- 003_user_management.sql
-- Owner-only RPCs to create staff logins with a generated password, change permissions,
-- reset passwords and remove users. Run after 002. Safe to re-run.
--
-- These functions write to auth.users directly (the same thing the Dashboard does through GoTrue).
-- If a future Supabase release changes the auth schema, create users in the Dashboard instead and the
-- rest of the admin keeps working: new users just need a row in staff_profiles (use admin_update_staff).

create or replace function public.admin_create_user(p_email text, p_name text, p_password text, p_perms jsonb)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
declare uid uuid := gen_random_uuid(); em text := lower(trim(p_email));
begin
  if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email'; end if;
  if char_length(coalesce(p_password,'')) < 8 then raise exception 'password must be at least 8 characters'; end if;
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'a user with this email already exists'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', jsonb_build_object('name', p_name), now(), now(),
          '', '', '', '');

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
          'email', uid::text, now(), now(), now());

  insert into public.staff_profiles (user_id, email, name, role, perms, active)
  values (uid, em, coalesce(p_name, ''), 'staff',
          jsonb_build_object(
            'orders',       coalesce((p_perms->>'orders')::boolean, false),
            'availability', coalesce((p_perms->>'availability')::boolean, false),
            'menu',         coalesce((p_perms->>'menu')::boolean, false),
            'insights',     coalesce((p_perms->>'insights')::boolean, false),
            'photos',       coalesce((p_perms->>'photos')::boolean, false),
            'settings',     coalesce((p_perms->>'settings')::boolean, false)), true);
  return uid;
end $$;

create or replace function public.admin_set_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
  if char_length(coalesce(p_password,'')) < 8 then raise exception 'password must be at least 8 characters'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

create or replace function public.admin_update_staff(p_user uuid, p_name text, p_perms jsonb, p_active boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
declare r text;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
  select role into r from public.staff_profiles where user_id = p_user;
  if r is null then raise exception 'no such staff member'; end if;
  if r = 'owner' and (p_active is false) then raise exception 'the owner cannot be deactivated'; end if;
  update public.staff_profiles set
    name   = coalesce(p_name, name),
    active = coalesce(p_active, active),
    perms  = case when role = 'owner' then perms else jsonb_build_object(
      'orders',       coalesce((p_perms->>'orders')::boolean, false),
      'availability', coalesce((p_perms->>'availability')::boolean, false),
      'menu',         coalesce((p_perms->>'menu')::boolean, false),
      'insights',     coalesce((p_perms->>'insights')::boolean, false),
      'photos',       coalesce((p_perms->>'photos')::boolean, false),
      'settings',     coalesce((p_perms->>'settings')::boolean, false)) end
  where user_id = p_user;
end $$;

create or replace function public.admin_remove_user(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'you cannot remove yourself'; end if;
  if exists (select 1 from public.staff_profiles where user_id = p_user and role = 'owner') then raise exception 'the owner cannot be removed'; end if;
  delete from auth.users where id = p_user;   -- staff_profiles row cascades
end $$;

-- Team list with last sign-in time (owner only).
create or replace function public.admin_list_team() returns table (user_id uuid, email text, name text, role text, perms jsonb, active boolean, last_sign_in_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
  return query select s.user_id, s.email, s.name, s.role, s.perms, s.active, u.last_sign_in_at, s.created_at
               from public.staff_profiles s join auth.users u on u.id = s.user_id order by s.role desc, s.created_at;
end $$;

revoke execute on function public.admin_create_user(text,text,text,jsonb) from public, anon;
revoke execute on function public.admin_set_password(uuid,text) from public, anon;
revoke execute on function public.admin_update_staff(uuid,text,jsonb,boolean) from public, anon;
revoke execute on function public.admin_remove_user(uuid) from public, anon;
revoke execute on function public.admin_list_team() from public, anon;
grant execute on function public.admin_create_user(text,text,text,jsonb) to authenticated;
grant execute on function public.admin_set_password(uuid,text) to authenticated;
grant execute on function public.admin_update_staff(uuid,text,jsonb,boolean) to authenticated;
grant execute on function public.admin_remove_user(uuid) to authenticated;
grant execute on function public.admin_list_team() to authenticated;
