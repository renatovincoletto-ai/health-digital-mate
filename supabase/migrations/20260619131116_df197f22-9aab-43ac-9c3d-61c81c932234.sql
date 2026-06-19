
CREATE TABLE public.patient_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('credit','debit','refund','adjustment')),
  amount numeric(12,2) NOT NULL,
  description text,
  reference_type text,
  reference_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pwt_patient ON public.patient_wallet_transactions(patient_id, created_at DESC);
CREATE INDEX idx_pwt_tenant ON public.patient_wallet_transactions(tenant_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_wallet_transactions TO authenticated;
GRANT ALL ON public.patient_wallet_transactions TO service_role;

ALTER TABLE public.patient_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members manage wallet" ON public.patient_wallet_transactions
  FOR ALL TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.user_tenant_id(auth.uid()));

CREATE TRIGGER trg_pwt_updated_at
  BEFORE UPDATE ON public.patient_wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- View with running balance per patient
CREATE OR REPLACE VIEW public.patient_wallet_balances AS
SELECT
  p.id AS patient_id,
  p.tenant_id,
  p.full_name,
  COALESCE(SUM(
    CASE
      WHEN t.kind IN ('credit','refund') THEN t.amount
      WHEN t.kind IN ('debit') THEN -t.amount
      WHEN t.kind = 'adjustment' THEN t.amount
      ELSE 0
    END
  ), 0)::numeric(12,2) AS balance
FROM public.patients p
LEFT JOIN public.patient_wallet_transactions t ON t.patient_id = p.id
GROUP BY p.id, p.tenant_id, p.full_name;

GRANT SELECT ON public.patient_wallet_balances TO authenticated;
GRANT ALL ON public.patient_wallet_balances TO service_role;
