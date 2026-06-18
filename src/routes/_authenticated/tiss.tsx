import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listTissGuides, saveTissGuide, settleTissGuide, listInsurancePlans } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/tiss")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listTissGuides);
  const fetchPlans = useServerFn(listInsurancePlans);
  const save = useServerFn(saveTissGuide);
  const settle = useServerFn(settleTissGuide);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["tiss-guides"], queryFn: () => fetchAll() });
  const { data: plans = [] } = useQuery({ queryKey: ["insurance-plans"], queryFn: () => fetchPlans() });
  const [f, setF] = useState({ insurance_plan_id: "", guide_type: "consulta" as const, guide_number: "", authorization_number: "", amount: "", service_date: "" });

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...f, amount: parseFloat(f.amount) || 0 } }),
    onSuccess: () => { toast.success("Guia registrada"); qc.invalidateQueries({ queryKey: ["tiss-guides"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const settleM = useMutation({
    mutationFn: ({ id, paid, glosa }: { id: string; paid: number; glosa: number }) => settle({ data: { id, paid_amount: paid, glosa_amount: glosa } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tiss-guides"] }),
  });

  return (
    <SimplePage title="Guias TISS" description="Faturamento de planos de saúde: guias de consulta, SADT e internação. Controle glosas e recebimentos.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><FileBarChart className="h-4 w-4" /> Nova guia</h2>
          <div className="mt-4 space-y-3">
            <select value={f.insurance_plan_id} onChange={(e) => setF({ ...f, insurance_plan_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Convênio...</option>
              {plans.map((p: any) => <option key={p.id} value={p.id}>{p.operator_name} · {p.plan_name}</option>)}
            </select>
            <select value={f.guide_type} onChange={(e) => setF({ ...f, guide_type: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="consulta">Consulta</option>
              <option value="sadt">SP/SADT</option>
              <option value="internacao">Internação</option>
              <option value="outras">Outras</option>
            </select>
            <input value={f.guide_number} onChange={(e) => setF({ ...f, guide_number: e.target.value })} placeholder="Nº da guia" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.authorization_number} onChange={(e) => setF({ ...f, authorization_number: e.target.value })} placeholder="Nº autorização" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="date" value={f.service_date} onChange={(e) => setF({ ...f, service_date: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Valor R$" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => saveM.mutate()} disabled={!f.amount || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Registrar</button>
          </div>
        </section>
        <div className="space-y-2">
          {data.map((g: any) => (
            <div key={g.id} className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium uppercase text-xs tracking-wider text-primary">{g.guide_type}</p>
                  <p className="font-medium">{g.insurance_plans?.operator_name} · {g.insurance_plans?.plan_name}</p>
                  <p className="text-xs text-muted-foreground">Guia {g.guide_number || "—"} · {g.service_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(g.amount).toFixed(2)}</p>
                  {g.status === "settled" ? (
                    <p className="text-[10px] text-muted-foreground">pago R$ {Number(g.paid_amount).toFixed(2)} · glosa R$ {Number(g.glosa_amount).toFixed(2)}</p>
                  ) : (
                    <button onClick={() => {
                      const paid = parseFloat(prompt("Valor pago R$", String(g.amount)) || "0");
                      const glosa = parseFloat(prompt("Glosa R$", "0") || "0");
                      settleM.mutate({ id: g.id, paid, glosa });
                    }} className="mt-1 rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent/10">Liquidar</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}
