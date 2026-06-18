
CREATE TABLE public.subscription_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_key text NOT NULL,
  professionals int NOT NULL DEFAULT 1 CHECK (professionals >= 1),
  units int NOT NULL DEFAULT 1 CHECK (units >= 1),
  patient_pack text NOT NULL DEFAULT 'starter',
  base_price numeric(10,2) NOT NULL,
  professionals_surcharge numeric(10,2) NOT NULL DEFAULT 0,
  units_surcharge numeric(10,2) NOT NULL DEFAULT 0,
  patient_pack_price numeric(10,2) NOT NULL DEFAULT 0,
  total_monthly numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_quotes TO authenticated;
GRANT ALL ON public.subscription_quotes TO service_role;

ALTER TABLE public.subscription_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read quotes"
ON public.subscription_quotes FOR SELECT TO authenticated
USING (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "tenant members write quotes"
ON public.subscription_quotes FOR INSERT TO authenticated
WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "tenant admins update quotes"
ON public.subscription_quotes FOR UPDATE TO authenticated
USING (tenant_id = public.user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "tenant admins delete quotes"
ON public.subscription_quotes FOR DELETE TO authenticated
USING (tenant_id = public.user_tenant_id(auth.uid()));

CREATE TRIGGER subscription_quotes_set_updated_at
BEFORE UPDATE ON public.subscription_quotes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX subscription_quotes_tenant_idx ON public.subscription_quotes(tenant_id, created_at DESC);
