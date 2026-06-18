
-- Templates de documentos (atestados, receituários, modelos de prontuário, pedidos de exame)
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('atestado','receituario','prontuario','exame','laudo','termo')),
  title text NOT NULL,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO authenticated;
GRANT ALL ON public.document_templates TO service_role;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage templates" ON public.document_templates
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE INDEX idx_doc_tpl_tenant_kind ON public.document_templates(tenant_id, kind);
CREATE TRIGGER trg_doc_tpl_upd BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Credenciais do portal do paciente (CPF + senha por clínica)
CREATE TABLE public.patient_portal_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  password_hash text NOT NULL,
  email text,
  reset_token text,
  reset_expires_at timestamptz,
  last_login_at timestamptz,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, cpf)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_portal_accounts TO authenticated;
GRANT ALL ON public.patient_portal_accounts TO service_role;
ALTER TABLE public.patient_portal_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant manages portal accounts" ON public.patient_portal_accounts
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE TRIGGER trg_portal_acc_upd BEFORE UPDATE ON public.patient_portal_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sessões do portal (token opaco, server-only)
CREATE TABLE public.patient_portal_sessions (
  token text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.patient_portal_accounts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.patient_portal_sessions TO service_role;
ALTER TABLE public.patient_portal_sessions ENABLE ROW LEVEL SECURITY;
-- Sem policies: acesso exclusivo via service_role nas rotas públicas.
