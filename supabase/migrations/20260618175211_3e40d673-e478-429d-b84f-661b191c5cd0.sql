
CREATE TABLE public.automation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.journey_enrollments(id) ON DELETE SET NULL,
  provider_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_jobs TO authenticated;
GRANT ALL ON public.automation_jobs TO service_role;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage automation jobs" ON public.automation_jobs FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER automation_jobs_set_updated BEFORE UPDATE ON public.automation_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX automation_jobs_pending_idx ON public.automation_jobs(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX automation_jobs_tenant_idx ON public.automation_jobs(tenant_id, created_at DESC);

CREATE TABLE public.automation_settings (
  tenant_id UUID NOT NULL PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  email_from_name TEXT,
  email_from_address TEXT,
  twilio_from_number TEXT,
  twilio_whatsapp_from TEXT,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_settings TO authenticated;
GRANT ALL ON public.automation_settings TO service_role;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage automation settings" ON public.automation_settings FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER automation_settings_set_updated BEFORE UPDATE ON public.automation_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
