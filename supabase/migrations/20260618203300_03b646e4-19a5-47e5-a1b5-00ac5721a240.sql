-- 1) Restringe leitura anônima de anamnese_templates apenas a tenants com onboarding concluído
DROP POLICY IF EXISTS "public can read active anamnese templates" ON public.anamnese_templates;
CREATE POLICY "anon reads active templates of live tenants"
  ON public.anamnese_templates FOR SELECT TO anon
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = anamnese_templates.tenant_id
        AND t.onboarding_status = 'completed'
    )
  );

-- 2) Move a extensão pg_trgm para fora do schema public
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3) Política explícita "sem acesso público" em patient_portal_sessions
--    (a tabela só é acessada pelo backend via service_role, que sempre bypassa RLS)
CREATE POLICY "no anon or authenticated access"
  ON public.patient_portal_sessions FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
