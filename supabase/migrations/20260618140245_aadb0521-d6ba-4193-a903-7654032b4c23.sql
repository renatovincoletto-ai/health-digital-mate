
-- 1) Professionals: hide email/phone from anon via column-level grants
REVOKE SELECT ON public.professionals FROM anon;
GRANT SELECT (id, tenant_id, full_name, specialty, council_type, council_number, council_state, bio, avatar_url, color, is_active, created_at, updated_at) ON public.professionals TO anon;

-- 2) user_tenant_id determinism
CREATE OR REPLACE FUNCTION public.user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tenant_id FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY created_at ASC, tenant_id ASC
  LIMIT 1
$$;

-- 3) integration_accounts: restrict to tenant owner
DROP POLICY IF EXISTS "Members manage integrations" ON public.integration_accounts;
CREATE POLICY "Tenant owner manages integrations"
  ON public.integration_accounts
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = integration_accounts.tenant_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = integration_accounts.tenant_id AND t.owner_id = auth.uid()));
