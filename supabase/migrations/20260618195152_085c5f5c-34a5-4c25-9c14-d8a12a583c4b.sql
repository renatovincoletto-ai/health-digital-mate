
-- Audit log (observabilidade) + Rate limit (segurança) — Onda K

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_tenant_created ON public.audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_tenant" ON public.audit_log
  FOR SELECT TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()));

CREATE POLICY "audit_log_insert_tenant" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- Rate limit (proteção de rotas públicas)
CREATE TABLE public.rate_limit_hits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  ip text,
  hit_count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_bucket_window ON public.rate_limit_hits(bucket, window_start DESC);
CREATE INDEX idx_rate_limit_ip_window ON public.rate_limit_hits(ip, window_start DESC);

GRANT ALL ON public.rate_limit_hits TO service_role;

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_service_only" ON public.rate_limit_hits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Função helper para registrar auditoria (chamada por triggers/server fns)
CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _resource_type text,
  _resource_id text,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _severity text DEFAULT 'info'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_tenant uuid;
BEGIN
  v_tenant := public.user_tenant_id(auth.uid());
  IF v_tenant IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_type, resource_id, metadata, severity)
  VALUES (v_tenant, auth.uid(), _action, _resource_type, _resource_id, COALESCE(_metadata,'{}'::jsonb), _severity)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Cleanup automático de logs > 180 dias (chamado por cron existente ou manualmente)
CREATE OR REPLACE FUNCTION public.cleanup_audit_log()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deleted int;
BEGIN
  DELETE FROM public.audit_log WHERE created_at < now() - INTERVAL '180 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  DELETE FROM public.rate_limit_hits WHERE created_at < now() - INTERVAL '7 days';
  RETURN v_deleted;
END;
$$;
