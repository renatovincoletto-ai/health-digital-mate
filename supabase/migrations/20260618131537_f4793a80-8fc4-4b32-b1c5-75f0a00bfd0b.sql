
-- ============ PROFESSIONALS ============
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialty TEXT,
  council_type TEXT,
  council_number TEXT,
  council_state TEXT,
  bio TEXT,
  avatar_url TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT SELECT ON public.professionals TO anon;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage professionals"
  ON public.professionals FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "Public can read active professionals of published tenants"
  ON public.professionals FOR SELECT TO anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = professionals.tenant_id AND t.onboarding_status = 'completed'
    )
  );

CREATE TRIGGER trg_professionals_updated
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_professionals_tenant ON public.professionals(tenant_id);

-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  price_cents INTEGER,
  requires_deposit BOOLEAN NOT NULL DEFAULT false,
  deposit_cents INTEGER,
  color TEXT NOT NULL DEFAULT '#10B981',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage services"
  ON public.services FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "Public can read active public services"
  ON public.services FOR SELECT TO anon
  USING (
    is_active = true AND is_public = true
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = services.tenant_id AND t.onboarding_status = 'completed'
    )
  );

CREATE TRIGGER trg_services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_services_tenant ON public.services(tenant_id);

-- ============ AVAILABILITY RULES (recorrentes) ============
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=domingo
  start_minute SMALLINT NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute SMALLINT NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  CHECK (end_minute > start_minute),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_rules TO authenticated;
GRANT SELECT ON public.availability_rules TO anon;
GRANT ALL ON public.availability_rules TO service_role;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage availability rules"
  ON public.availability_rules FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "Public reads availability rules of published tenants"
  ON public.availability_rules FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = availability_rules.tenant_id AND t.onboarding_status = 'completed'
  ));

CREATE INDEX idx_avail_rules_prof ON public.availability_rules(professional_id);

-- ============ AVAILABILITY BLOCKS ============
CREATE TABLE public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_blocks TO authenticated;
GRANT SELECT ON public.availability_blocks TO anon;
GRANT ALL ON public.availability_blocks TO service_role;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage blocks"
  ON public.availability_blocks FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "Public reads future blocks"
  ON public.availability_blocks FOR SELECT TO anon
  USING (
    ends_at > now()
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = availability_blocks.tenant_id AND t.onboarding_status = 'completed'
    )
  );

CREATE INDEX idx_blocks_prof_time ON public.availability_blocks(professional_id, starts_at);

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  patient_phone TEXT,
  patient_notes TEXT,
  internal_notes TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','no_show','completed')),
  origin TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','public','whatsapp','google','outlook')),
  external_event_id TEXT,
  external_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT ON public.appointments TO anon;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "Public can create appointments on published tenants"
  ON public.appointments FOR INSERT TO anon
  WITH CHECK (
    origin = 'public'
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = appointments.tenant_id AND t.onboarding_status = 'completed'
    )
  );

CREATE TRIGGER trg_appointments_updated
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_appts_tenant_time ON public.appointments(tenant_id, starts_at);
CREATE INDEX idx_appts_prof_time ON public.appointments(professional_id, starts_at);

-- Evita sobreposição de agendamentos não cancelados para o mesmo profissional
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('pending','confirmed'));

-- ============ INTEGRATION ACCOUNTS ============
CREATE TABLE public.integration_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_calendar','outlook','whatsapp')),
  account_email TEXT,
  calendar_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','connected','expired','revoked')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_accounts TO authenticated;
GRANT ALL ON public.integration_accounts TO service_role;
ALTER TABLE public.integration_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage integrations"
  ON public.integration_accounts FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE TRIGGER trg_integration_accounts_updated
  BEFORE UPDATE ON public.integration_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
