import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileBarChart, AlertTriangle, ShieldCheck, Clock, Filter, Check } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listTissGuides, saveTissGuide, settleTissGuide, listInsurancePlans } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/tiss")({ component: Page });

type Guide = {
  id: string;
  insurance_plan_id: string | null;
  guide_type: "consulta" | "sadt" | "internacao" | "outras";
  guide_number: string | null;
  authorization_number: string | null;
  service_date: string | null;
  amount: number;
  paid_amount: number | null;
  glosa_amount: number | null;
  status: string;
  insurance_plans?: { operator_name: string; plan_name: string } | null;
};

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
const typeLabel: Record<string, string> = { consulta: "Consulta", sadt: "SP/SADT", internacao: "Internação", outras: "Outras" };

function Page() {
  const fetchAll = useServerFn(listTissGuides);
  const fetchPlans = useServerFn(listInsurancePlans);
  const save = useServerFn(saveTissGuide);
  const settle = useServerFn(settleTissGuide);
  const qc = useQueryClient();
  const { data = [] } = useQuery<Guide[]>({ queryKey: ["tiss-guides"], queryFn: () => fetchAll() as Promise<Guide[]> });
  const { data: plans = [] } = useQuery<{ id: string; operator_name: string; plan_name: string }[]>({
    queryKey: ["insurance-plans"],
    queryFn: () => fetchPlans() as Promise<{ id: string; operator_name: string; plan_name: string }[]>,
  });

  const [f, setF] = useState<{
    insurance_plan_id: string;
    guide_type: "consulta" | "sadt" | "internacao" | "outras";
    guide_number: string;
    authorization_number: string;
    amount: string;
    service_date: string;
  }>({ insurance_plan_id: "", guide_type: "consulta", guide_number: "", authorization_number: "", amount: "", service_date: "" });

  const [filter, setFilter] = useState({ status: "all", type: "all", plan: "all" });
  const [settling, setSettling] = useState<{ id: string; amount: number } | null>(null);
  const [settleForm, setSettleForm] = useState({ paid: "", glosa: "0", glosa_reason: "" });

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...f, amount: parseFloat(f.amount) || 0 } }),
    onSuccess: () => {
      toast.success("Guia registrada");
      setF({ insurance_plan_id: "", guide_type: "consulta", guide_number: "", authorization_number: "", amount: "", service_date: "" });
      qc.invalidateQueries({ queryKey: ["tiss-guides"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settleM = useMutation({
    mutationFn: ({ id, paid, glosa }: { id: string; paid: number; glosa: number }) =>
      settle({ data: { id, paid_amount: paid, glosa_amount: glosa } }),
    onSuccess: () => {
      toast.success("Guia liquidada");
      setSettling(null);
      qc.invalidateQueries({ queryKey: ["tiss-guides"] });
    },
  });

  const filtered = useMemo(() => {
    return data.filter((g) => {
      if (filter.status !== "all" && g.status !== filter.status) return false;
      if (filter.type !== "all" && g.guide_type !== filter.type) return false;
      if (filter.plan !== "all" && g.insurance_plan_id !== filter.plan) return false;
      return true;
    });
  }, [data, filter]);

  const totals = useMemo(() => {
    const open = filtered.filter((g) => g.status !== "settled");
    const settled = filtered.filter((g) => g.status === "settled");
    return {
      billed: filtered.reduce((s, g) => s + Number(g.amount || 0), 0),
      open: open.reduce((s, g) => s + Number(g.amount || 0), 0),
      received: settled.reduce((s, g) => s + Number(g.paid_amount || 0), 0),
      glosa: settled.reduce((s, g) => s + Number(g.glosa_amount || 0), 0),
      openCount: open.length,
      settledCount: settled.length,
    };
  }, [filtered]);

  return (
    <SimplePage title="Guias TISS" description="Faturamento de planos de saúde: guias de consulta, SADT e internação. Controle glosas e recebimentos.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={Clock} label="Em aberto" value={brl(totals.open)} hint={`${totals.openCount} guia(s)`} tone="warn" />
        <Kpi icon={ShieldCheck} label="Recebido" value={brl(totals.received)} hint={`${totals.settledCount} liquidadas`} tone="success" />
        <Kpi icon={AlertTriangle} label="Glosas" value={brl(totals.glosa)} tone="danger" />
        <Kpi icon={FileBarChart} label="Faturado total" value={brl(totals.billed)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6 self-start">
          <h2 className="font-semibold flex items-center gap-2"><FileBarChart className="h-4 w-4" /> Nova guia</h2>
          <div className="mt-4 space-y-3">
            <Field label="Convênio"><select value={f.insurance_plan_id} onChange={(e) => setF({ ...f, insurance_plan_id: e.target.value })} className={inputCls}>
              <option value="">Selecione...</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.operator_name} · {p.plan_name}</option>)}
            </select></Field>
            <Field label="Tipo"><select value={f.guide_type} onChange={(e) => setF({ ...f, guide_type: e.target.value as "consulta" | "sadt" | "internacao" | "outras" })} className={inputCls}>
              <option value="consulta">Consulta</option>
              <option value="sadt">SP/SADT</option>
              <option value="internacao">Internação</option>
              <option value="outras">Outras</option>
            </select></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nº guia"><input value={f.guide_number} onChange={(e) => setF({ ...f, guide_number: e.target.value })} className={inputCls} /></Field>
              <Field label="Nº autorização"><input value={f.authorization_number} onChange={(e) => setF({ ...f, authorization_number: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Data do atendimento"><input type="date" value={f.service_date} onChange={(e) => setF({ ...f, service_date: e.target.value })} className={inputCls} /></Field>
              <Field label="Valor (R$)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" className={inputCls} /></Field>
            </div>
            <button onClick={() => saveM.mutate()} disabled={!f.amount || !f.insurance_plan_id || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {saveM.isPending ? "Salvando..." : "Registrar guia"}
            </button>
          </div>
        </section>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos status</option><option value="pending">Em aberto</option><option value="settled">Liquidadas</option>
            </select>
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos tipos</option>
              {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filter.plan} onChange={(e) => setFilter({ ...filter, plan: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos convênios</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.operator_name}</option>)}
            </select>
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} guia(s)</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
              <FileBarChart className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhuma guia</p>
              <p className="text-xs text-muted-foreground mt-1">Registre a primeira guia no painel ao lado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((g) => (
                <div key={g.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider rounded bg-accent/20 px-1.5 py-0.5 font-semibold">{typeLabel[g.guide_type]}</span>
                        <p className="font-medium">{g.insurance_plans?.operator_name} · {g.insurance_plans?.plan_name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Guia {g.guide_number || "—"} · Aut {g.authorization_number || "—"} · {g.service_date ?? "sem data"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{brl(Number(g.amount))}</p>
                      <div className="mt-1">
                        {g.status === "settled" ? (
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            <div>pago: <span className="text-success font-medium">{brl(Number(g.paid_amount || 0))}</span></div>
                            {Number(g.glosa_amount || 0) > 0 && <div>glosa: <span className="text-destructive font-medium">{brl(Number(g.glosa_amount || 0))}</span></div>}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSettling({ id: g.id, amount: Number(g.amount) }); setSettleForm({ paid: String(g.amount), glosa: "0", glosa_reason: "" }); }}
                            className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent/10 inline-flex items-center gap-1"
                          ><Check className="h-3 w-3" /> Liquidar</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settle modal */}
      {settling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSettling(null)}>
          <div className="bg-surface-elevated rounded-2xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Liquidar guia</h3>
            <p className="text-xs text-muted-foreground mt-1">Valor faturado: {brl(settling.amount)}</p>
            <div className="mt-4 space-y-3">
              <Field label="Valor recebido (R$)">
                <input inputMode="decimal" value={settleForm.paid} onChange={(e) => setSettleForm({ ...settleForm, paid: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Glosa (R$)">
                <input inputMode="decimal" value={settleForm.glosa} onChange={(e) => setSettleForm({ ...settleForm, glosa: e.target.value })} className={inputCls} />
              </Field>
              {parseFloat(settleForm.glosa) > 0 && (
                <Field label="Motivo da glosa">
                  <textarea value={settleForm.glosa_reason} onChange={(e) => setSettleForm({ ...settleForm, glosa_reason: e.target.value })} rows={2} className={inputCls} placeholder="ex: divergência de código, falta de autorização..." />
                </Field>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setSettling(null)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm">Cancelar</button>
                <button
                  onClick={() => settleM.mutate({ id: settling.id, paid: parseFloat(settleForm.paid) || 0, glosa: parseFloat(settleForm.glosa) || 0 })}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
                  disabled={settleM.isPending}
                >Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SimplePage>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
function Kpi({ icon: Icon, label, value, hint, tone }: { icon: typeof FileBarChart; label: string; value: string; hint?: string; tone?: "success" | "warn" | "danger" }) {
  const cls = tone === "success" ? "text-success" : tone === "warn" ? "text-amber-600" : tone === "danger" ? "text-destructive" : "";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${cls}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
