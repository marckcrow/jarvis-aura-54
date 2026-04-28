
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
-- authenticated keeps execute on current_tenant_id (used in RLS)
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
