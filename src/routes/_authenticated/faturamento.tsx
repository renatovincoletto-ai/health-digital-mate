import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PricingCalculator } from "@/components/pricing-calculator";
import { listQuotes, saveQuote, deleteQuote, tenantUsage } from "@/lib/billing.functions";
import { fmtBRL, PACKAGE_PRICES, PATIENT_PACKS } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/faturamento")({ component: Page });

function Page() {
  const fetchList = useServerFn(listQuotes);
  const save = useServerFn(saveQuote);
  const del = useServerFn(deleteQuote);
  const fetchUsage = useServerFn(tenantUsage);
  const qc = useQueryClient();

  const { data: quotes = [] } = useQuery({ queryKey: ["quotes"], queryFn: () => fetchList() });
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: () => fetchUsage() });

  const saveMut = useMutation({
    mutationFn: (input: any) => save({ data: input }),
    onSuccess: () => { toast.success("Simulação salva"); qc.invalidateQueries({ queryKey: ["quotes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Financeiro</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Plano & Faturamento</h1>
          <p className="mt-1.5 text-muted-foreground">Simule o valor do seu plano de acordo com profissionais, unidades e pacote de pacientes.</p>
        </header>

        {usage && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <UsageCard label="Profissionais cadastrados" value={usage.professionals} />
            <UsageCard label="Unidades" value={usage.units} />
            <UsageCard label="Pacientes ativos" value={usage.patients} />
          </div>
        )}

        <PricingCalculator
          saving={saveMut.isPending}
          onSave={(s) => saveMut.mutate(s)}
        />

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Receipt className="h-5 w-5" /> Histórico de simulações</h2>
          <div className="mt-3 space-y-2">
            {quotes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma simulação salva ainda.</p>}
            {quotes.map((q: any) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated px-5 py-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {PACKAGE_PRICES[q.package_key as keyof typeof PACKAGE_PRICES]?.name ?? q.package_key}
                    {" · "}{q.professionals} prof · {q.units} unid · {PATIENT_PACKS[q.patient_pack as keyof typeof PATIENT_PACKS]?.name ?? q.patient_pack}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString("pt-BR")} · status: {q.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-semibold">{fmtBRL(Number(q.total_monthly))}</span>
                  <button onClick={() => delMut.mutate(q.id)} className="rounded p-1.5 text-muted-foreground hover:bg-accent/20" aria-label="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function UsageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
