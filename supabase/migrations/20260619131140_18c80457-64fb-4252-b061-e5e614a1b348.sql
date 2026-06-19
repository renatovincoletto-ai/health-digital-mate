
DROP VIEW IF EXISTS public.patient_wallet_balances;
CREATE VIEW public.patient_wallet_balances
WITH (security_invoker = true) AS
SELECT
  p.id AS patient_id,
  p.tenant_id,
  p.full_name,
  COALESCE(SUM(
    CASE
      WHEN t.kind IN ('credit','refund') THEN t.amount
      WHEN t.kind = 'debit' THEN -t.amount
      WHEN t.kind = 'adjustment' THEN t.amount
      ELSE 0
    END
  ), 0)::numeric(12,2) AS balance
FROM public.patients p
LEFT JOIN public.patient_wallet_transactions t ON t.patient_id = p.id
GROUP BY p.id, p.tenant_id, p.full_name;

GRANT SELECT ON public.patient_wallet_balances TO authenticated;
GRANT ALL ON public.patient_wallet_balances TO service_role;
