import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Receipt, Check } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listTaxObligations, saveTaxObligation, markTaxPaid } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/tributos")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listTaxObligations);
  const save = useServerFn(saveTaxObligation);
  const pay = useServerFn(markTaxPaid);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["tax-obligations"], queryFn: () => fetchAll() });
  const [f, setF] = useState({ kind: "DAS", period: "", amount: "", due_date: "", notes: "" });

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...f, amount: parseFloat(f.amount) || 0 } }),
    onSuccess: () => { toast.success("Obrigação registrada"); setF({ kind: "DAS", period: "", amount: "", due_date: "", notes: "" }); qc.invalidateQueries({ queryKey: ["tax-obligations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const payM = useMutation({ mutationFn: (id: string) => pay({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["tax-obligations"] }) });

  return (
    <SimplePage title="Tributos & obrigações" description="DAS, IRPJ, ISS, INSS e outras obrigações fiscais com vencimento e comprovantes.">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Nova obrigação</h2>
          <div className="mt-4 space-y-3">
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option>DAS</option><option>IRPJ</option><option>ISS</option><option>INSS</option><option>PIS/COFINS</option><option>Outras</option>
            </select>
            <input value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} placeholder="Competência (MM/AAAA)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Valor R$" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => saveM.mutate()} disabled={!f.period || !f.amount || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Adicionar</button>
          </div>
        </section>
        <div className="space-y-2">
          {data.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
              <div>
                <p className="font-medium">{t.kind} · {t.period}</p>
                <p className="text-xs text-muted-foreground">Vence em {t.due_date || "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">R$ {Number(t.amount).toFixed(2)}</p>
                {t.status === "paid" ? (
                  <span className="text-[10px] uppercase rounded-full bg-success/15 text-success px-2 py-0.5">pago</span>
                ) : (
                  <button onClick={() => payM.mutate(t.id)} className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent/10 flex items-center gap-1"><Check className="h-3 w-3" /> Pagar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}
