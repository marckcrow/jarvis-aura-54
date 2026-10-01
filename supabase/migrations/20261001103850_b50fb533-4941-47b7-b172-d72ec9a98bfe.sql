create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where role = 'admin') $$;

create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  perform pg_advisory_xact_lock(424242);
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
  return true;
end; $$;

revoke execute on function public.admin_exists() from public, anon;
revoke execute on function public.claim_first_admin() from public, anon;
grant execute on function public.admin_exists() to authenticated;
grant execute on function public.claim_first_admin() to authenticated;