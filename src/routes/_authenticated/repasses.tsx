import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Banknote, Check } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listPayouts, createPayout, settlePayout } from "@/lib/wave9.functions";
import { listProfessionals } from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/repasses")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listPayouts);
  const fetchPros = useServerFn(listProfessionals);
  const create = useServerFn(createPayout);
  const settle = useServerFn(settlePayout);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["payouts"], queryFn: () => fetchAll() });
  const { data: pros = [] } = useQuery({ queryKey: ["professionals-min"], queryFn: () => fetchPros() });
  const [f, setF] = useState({ professional_id: "", period_start: "", period_end: "", gross_amount: "", fees_amount: "0", payment_method: "Pix" });

  const createM = useMutation({
    mutationFn: () => create({ data: { ...f, gross_amount: parseFloat(f.gross_amount) || 0, fees_amount: parseFloat(f.fees_amount) || 0 } }),
    onSuccess: () => { toast.success("Repasse criado"); qc.invalidateQueries({ queryKey: ["payouts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const settleM = useMutation({ mutationFn: (id: string) => settle({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["payouts"] }) });

  return (
    <SimplePage title="Repasses a profissionais" description="Fechamento de comissões por período, líquido após taxas, com pagamento por Pix ou transferência.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4" /> Novo fechamento</h2>
          <div className="mt-4 space-y-3">
            <select value={f.professional_id} onChange={(e) => setF({ ...f, professional_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Profissional...</option>
              {pros.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={f.period_start} onChange={(e) => setF({ ...f, period_start: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="date" value={f.period_end} onChange={(e) => setF({ ...f, period_end: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <input value={f.gross_amount} onChange={(e) => setF({ ...f, gross_amount: e.target.value })} placeholder="Valor bruto R$" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.fees_amount} onChange={(e) => setF({ ...f, fees_amount: e.target.value })} placeholder="Taxas/descontos R$" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={f.payment_method} onChange={(e) => setF({ ...f, payment_method: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option>Pix</option><option>TED</option><option>Boleto</option>
            </select>
            <button onClick={() => createM.mutate()} disabled={!f.professional_id || !f.gross_amount || createM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Criar repasse</button>
          </div>
        </section>
        <div className="space-y-2">
          {data.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
              <div>
                <p className="font-medium">{p.professionals?.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.period_start} → {p.period_end} · {p.payment_method}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(p.net_amount).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">bruto R$ {Number(p.gross_amount).toFixed(2)}</p>
                </div>
                {p.status === "paid" ? (
                  <span className="text-[10px] uppercase rounded-full bg-success/15 text-success px-2 py-0.5">pago</span>
                ) : (
                  <button onClick={() => settleM.mutate(p.id)} className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent/10 flex items-center gap-1"><Check className="h-3 w-3" /> Liquidar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}
