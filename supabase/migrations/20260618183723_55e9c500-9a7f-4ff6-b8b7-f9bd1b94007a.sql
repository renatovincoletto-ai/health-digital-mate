
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('bug','duvida','melhoria','outro')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa','media','alta','critica')),
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_analise','em_progresso','resolvido','fechado')),
  title text NOT NULL,
  description text NOT NULL,
  module text,
  votes int NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members view tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()));
CREATE POLICY "tenant members create tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "author or admin update ticket" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) AND (created_by = auth.uid() OR public.has_role(auth.uid(), tenant_id, 'admin') OR public.has_role(auth.uid(), tenant_id, 'owner')))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));
CREATE POLICY "author or admin delete ticket" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) AND (created_by = auth.uid() OR public.has_role(auth.uid(), tenant_id, 'admin') OR public.has_role(auth.uid(), tenant_id, 'owner')));

CREATE INDEX idx_tickets_tenant_status ON public.support_tickets(tenant_id, status, created_at DESC);
CREATE TRIGGER trg_tickets_upd BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.support_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.support_ticket_comments TO authenticated;
GRANT ALL ON public.support_ticket_comments TO service_role;
ALTER TABLE public.support_ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members view comments" ON public.support_ticket_comments
  FOR SELECT TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()));
CREATE POLICY "tenant members add comments" ON public.support_ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "author deletes own comment" ON public.support_ticket_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE INDEX idx_ticket_comments_ticket ON public.support_ticket_comments(ticket_id, created_at);
