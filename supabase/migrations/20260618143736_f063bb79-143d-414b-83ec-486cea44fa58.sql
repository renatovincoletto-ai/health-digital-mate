
-- ============ CONTÁBIL / FISCAL ============
CREATE TABLE public.nfse_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  number TEXT,
  rps_number TEXT,
  service_code TEXT,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  iss_rate NUMERIC(5,2) DEFAULT 0,
  iss_amount NUMERIC(12,2) DEFAULT 0,
  taker_name TEXT,
  taker_document TEXT,
  taker_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  pdf_url TEXT,
  xml_url TEXT,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfse_invoices TO authenticated;
GRANT ALL ON public.nfse_invoices TO service_role;
ALTER TABLE public.nfse_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_nfse" ON public.nfse_invoices FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_nfse_updated BEFORE UPDATE ON public.nfse_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  period TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_obligations TO authenticated;
GRANT ALL ON public.tax_obligations TO service_role;
ALTER TABLE public.tax_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_tax" ON public.tax_obligations FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_tax_updated BEFORE UPDATE ON public.tax_obligations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.accountant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  shared_with_accountant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountant_documents TO authenticated;
GRANT ALL ON public.accountant_documents TO service_role;
ALTER TABLE public.accountant_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_acctdocs" ON public.accountant_documents FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_acctdocs_updated BEFORE UPDATE ON public.accountant_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REPASSE / TEF ============
CREATE TABLE public.professional_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fees_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_payouts TO authenticated;
GRANT ALL ON public.professional_payouts TO service_role;
ALTER TABLE public.professional_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_payouts" ON public.professional_payouts FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_payouts_updated BEFORE UPDATE ON public.professional_payouts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pos_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  acquirer TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  label TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_terminals TO authenticated;
GRANT ALL ON public.pos_terminals TO service_role;
ALTER TABLE public.pos_terminals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_pos" ON public.pos_terminals FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_pos_updated BEFORE UPDATE ON public.pos_terminals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tef_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  terminal_id UUID REFERENCES public.pos_terminals(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  brand TEXT,
  installments INTEGER DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) DEFAULT 0,
  nsu TEXT,
  authorization_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tef_transactions TO authenticated;
GRANT ALL ON public.tef_transactions TO service_role;
ALTER TABLE public.tef_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_tef" ON public.tef_transactions FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_tef_updated BEFORE UPDATE ON public.tef_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TISS / CONVÊNIOS ============
CREATE TABLE public.insurance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  ans_code TEXT,
  plan_name TEXT NOT NULL,
  contract_number TEXT,
  rate_table JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_plans TO authenticated;
GRANT ALL ON public.insurance_plans TO service_role;
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_plans" ON public.insurance_plans FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_iplans_updated BEFORE UPDATE ON public.insurance_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tiss_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  insurance_plan_id UUID REFERENCES public.insurance_plans(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  guide_type TEXT NOT NULL,
  guide_number TEXT,
  authorization_number TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  glosa_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  service_date DATE,
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiss_guides TO authenticated;
GRANT ALL ON public.tiss_guides TO service_role;
ALTER TABLE public.tiss_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_guides" ON public.tiss_guides FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_guides_updated BEFORE UPDATE ON public.tiss_guides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ JORNADAS ============
CREATE TABLE public.patient_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_journeys TO authenticated;
GRANT ALL ON public.patient_journeys TO service_role;
ALTER TABLE public.patient_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_journeys" ON public.patient_journeys FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_journeys_updated BEFORE UPDATE ON public.patient_journeys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.patient_journeys(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL,
  template TEXT NOT NULL,
  action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_steps TO authenticated;
GRANT ALL ON public.journey_steps TO service_role;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_jsteps" ON public.journey_steps FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_jsteps_updated BEFORE UPDATE ON public.journey_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.journey_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.patient_journeys(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_run_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_enrollments TO authenticated;
GRANT ALL ON public.journey_enrollments TO service_role;
ALTER TABLE public.journey_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_jenroll" ON public.journey_enrollments FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_jenroll_updated BEFORE UPDATE ON public.journey_enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
