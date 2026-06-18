
-- ============ PAYROLL ============
CREATE TABLE public.payroll_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  reference_month DATE NOT NULL,
  full_name TEXT NOT NULL,
  role_label TEXT,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  pro_labore NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  inss NUMERIC(12,2) NOT NULL DEFAULT 0,
  fgts NUMERIC(12,2) NOT NULL DEFAULT 0,
  irrf NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_entries TO authenticated;
GRANT ALL ON public.payroll_entries TO service_role;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_manage_payroll" ON public.payroll_entries
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE INDEX idx_payroll_tenant_month ON public.payroll_entries(tenant_id, reference_month DESC);
CREATE TRIGGER set_payroll_updated_at BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROLE PERMISSIONS ============
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  max_discount_pct NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role, module)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_view_role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()));
CREATE POLICY "tenant_admins_manage_role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
           OR public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role));
CREATE TRIGGER set_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ DEBT NEGOTIATIONS ============
CREATE TABLE public.debt_negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  original_amount NUMERIC(12,2) NOT NULL,
  interest_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  fine_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  installments INT NOT NULL DEFAULT 1,
  installment_amount NUMERIC(12,2) NOT NULL,
  final_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  due_first DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_negotiations TO authenticated;
GRANT ALL ON public.debt_negotiations TO service_role;
ALTER TABLE public.debt_negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_manage_debt_negotiations" ON public.debt_negotiations
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER set_debt_negotiations_updated_at BEFORE UPDATE ON public.debt_negotiations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
