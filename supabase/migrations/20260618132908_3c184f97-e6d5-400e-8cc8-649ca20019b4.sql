
-- Wave 5: Reputation, Anamnese, Transcription, Email Marketing, Multi-unit

-- LOCATIONS (multi-unit)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  google_place_id text,
  is_primary boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages locations" ON public.locations
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER locations_updated BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ANAMNESE TEMPLATES
CREATE TABLE public.anamnese_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_templates TO authenticated;
GRANT SELECT ON public.anamnese_templates TO anon;
GRANT ALL ON public.anamnese_templates TO service_role;
ALTER TABLE public.anamnese_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages anamnese templates" ON public.anamnese_templates
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE POLICY "public can read active anamnese templates" ON public.anamnese_templates
  FOR SELECT TO anon USING (active = true);
CREATE TRIGGER anamnese_templates_updated BEFORE UPDATE ON public.anamnese_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ANAMNESE RESPONSES (patient submissions)
CREATE TABLE public.anamnese_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.anamnese_templates(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  patient_email text,
  patient_phone text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  lgpd_consent boolean NOT NULL DEFAULT false,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_responses TO authenticated;
GRANT INSERT ON public.anamnese_responses TO anon;
GRANT ALL ON public.anamnese_responses TO service_role;
ALTER TABLE public.anamnese_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant reads own anamnese responses" ON public.anamnese_responses
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE POLICY "public can submit anamnese with consent" ON public.anamnese_responses
  FOR INSERT TO anon WITH CHECK (lgpd_consent = true);
CREATE TRIGGER anamnese_responses_updated BEFORE UPDATE ON public.anamnese_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONSULTATION NOTES (AI transcriptions)
CREATE TABLE public.consultation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  transcript text,
  soap_subjective text,
  soap_objective text,
  soap_assessment text,
  soap_plan text,
  duration_seconds integer,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_notes TO authenticated;
GRANT ALL ON public.consultation_notes TO service_role;
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages consultation notes" ON public.consultation_notes
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER consultation_notes_updated BEFORE UPDATE ON public.consultation_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REVIEW REQUESTS
CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  patient_phone text,
  patient_email text,
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages review requests" ON public.review_requests
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER review_requests_updated BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REVIEWS (collected from Google or direct)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'google',
  author_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text,
  reply text,
  reply_status text NOT NULL DEFAULT 'pending',
  external_id text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EMAIL CAMPAIGNS
CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  preheader text,
  body_html text,
  body_text text,
  audience text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipients_count integer NOT NULL DEFAULT 0,
  opens_count integer NOT NULL DEFAULT 0,
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages email campaigns" ON public.email_campaigns
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER email_campaigns_updated BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EMAIL CONTACTS
CREATE TABLE public.email_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  subscribed boolean NOT NULL DEFAULT true,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_contacts TO authenticated;
GRANT ALL ON public.email_contacts TO service_role;
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages email contacts" ON public.email_contacts
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER email_contacts_updated BEFORE UPDATE ON public.email_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
