
-- ============ PATIENTS / CRM ============
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access patients" ON public.patients FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR portal_user_id = auth.uid())
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_patients_tenant ON public.patients(tenant_id);

-- ============ TELEMEDICINE ============
CREATE TABLE public.telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  room_url TEXT NOT NULL,
  room_token TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telemedicine_sessions TO authenticated;
GRANT ALL ON public.telemedicine_sessions TO service_role;
ALTER TABLE public.telemedicine_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access tele" ON public.telemedicine_sessions FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR patient_id IN (SELECT id FROM public.patients WHERE portal_user_id = auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_tele_updated BEFORE UPDATE ON public.telemedicine_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PRESCRIPTIONS ============
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL DEFAULT 'receita',
  content TEXT NOT NULL,
  signature_provider TEXT,
  signature_id TEXT,
  qr_code TEXT,
  valid_until DATE,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access rx" ON public.prescriptions FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR patient_id IN (SELECT id FROM public.patients WHERE portal_user_id = auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_rx_updated BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TREATMENT PLANS ============
CREATE TABLE public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_value NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proposed',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_plans TO authenticated;
GRANT ALL ON public.treatment_plans TO service_role;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access tp" ON public.treatment_plans FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR patient_id IN (SELECT id FROM public.patients WHERE portal_user_id = auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_tp_updated BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.treatment_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  tooth TEXT,
  face TEXT,
  quantity INT DEFAULT 1,
  unit_value NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_plan_items TO authenticated;
GRANT ALL ON public.treatment_plan_items TO service_role;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access tpi" ON public.treatment_plan_items FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_tpi_updated BEFORE UPDATE ON public.treatment_plan_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ODONTOGRAM ============
CREATE TABLE public.odontogram_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth TEXT NOT NULL,
  face TEXT,
  condition TEXT NOT NULL,
  procedure TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.odontogram_entries TO authenticated;
GRANT ALL ON public.odontogram_entries TO service_role;
ALTER TABLE public.odontogram_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access odo" ON public.odontogram_entries FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_odo_updated BEFORE UPDATE ON public.odontogram_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FINANCEIRO ============
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'bank',
  bank_name TEXT,
  balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO authenticated;
GRANT ALL ON public.financial_accounts TO service_role;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access fa" ON public.financial_accounts FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_fa_updated BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  direction TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access ft" ON public.financial_transactions FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_ft_updated BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_ft_tenant_status ON public.financial_transactions(tenant_id, status);

CREATE TABLE public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  provider TEXT NOT NULL DEFAULT 'pix',
  external_id TEXT,
  url TEXT,
  qr_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_links TO authenticated;
GRANT ALL ON public.payment_links TO service_role;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access pl" ON public.payment_links FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_pl_updated BEFORE UPDATE ON public.payment_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.professional_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL DEFAULT 'percentage',
  rule_value NUMERIC(8,2) NOT NULL DEFAULT 0,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_splits TO authenticated;
GRANT ALL ON public.professional_splits TO service_role;
ALTER TABLE public.professional_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access ps" ON public.professional_splits FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_ps_updated BEFORE UPDATE ON public.professional_splits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_value NUMERIC(14,2) DEFAULT 0,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'sent',
  accepted_at TIMESTAMPTZ,
  signature TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access quotes" ON public.quotes FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ESTOQUE ============
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'un',
  quantity NUMERIC(12,2) DEFAULT 0,
  min_quantity NUMERIC(12,2) DEFAULT 0,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access inv" ON public.inventory_items FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access invm" ON public.inventory_movements FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

-- ============ CHAT INTERNO ============
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_messages TO authenticated;
GRANT ALL ON public.internal_messages TO service_role;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access im" ON public.internal_messages FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()) AND sender_id = auth.uid());

-- ============ CALL CENTER ============
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES auth.users(id),
  direction TEXT NOT NULL,
  from_number TEXT,
  to_number TEXT,
  duration_seconds INT DEFAULT 0,
  outcome TEXT,
  notes TEXT,
  recording_url TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access calls" ON public.call_logs FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

-- ============ REMINDERS / CRM ============
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  scheduled_for TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmation TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access rem" ON public.reminders FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_rem_updated BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  referrer_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  referred_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  referrer_email TEXT,
  referred_email TEXT,
  code TEXT UNIQUE,
  reward_type TEXT,
  reward_value NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending',
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access ref" ON public.referrals FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_ref_updated BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  score INT,
  category TEXT,
  comment TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_surveys TO authenticated;
GRANT ALL ON public.nps_surveys TO service_role;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access nps" ON public.nps_surveys FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_nps_updated BEFORE UPDATE ON public.nps_surveys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ BI SNAPSHOTS ============
CREATE TABLE public.bi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_snapshots TO authenticated;
GRANT ALL ON public.bi_snapshots TO service_role;
ALTER TABLE public.bi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant access bi" ON public.bi_snapshots FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE INDEX idx_bi_tenant_date ON public.bi_snapshots(tenant_id, snapshot_date);
