GRANT INSERT ON public.user_roles TO authenticated;

CREATE POLICY "Owners can create their own owner role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'::public.app_role
  AND EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = user_roles.tenant_id
      AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can read roles in their tenant"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = user_roles.tenant_id
      AND t.owner_id = auth.uid()
  )
);