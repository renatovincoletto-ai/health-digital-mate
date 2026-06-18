import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Receipt, Check, AlertTriangle, Calendar, TrendingDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listTaxObligations, saveTaxObligation, markTaxPaid } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/tributos")({ component: Page });

type Tax = { id: string; kind: string; period: string; amount: number; due_date: string | null; status: string; paid_at: string | null };

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

const regimes: Record<string, string[]> = {
  "Simples Nacional": ["DAS", "ISS", "INSS", "FGTS"],
  "Lucro Presumido": ["IRPJ", "CSLL", "PIS/COFINS", "ISS", "INSS"],
  "Lucro Real": ["IRPJ", "CSLL", "PIS/COFINS", "ISS", "INSS"],
  "MEI": ["DAS"],
};

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function Page() {
  const fetchAll = useServerFn(listTaxObligations);
  const save = useServerFn(saveTaxObligation);
  const pay = useServerFn(markTaxPaid);
  const qc = useQueryClient();
  const { data = [] } = useQuery<Tax[]>({ queryKey: ["tax-obligations"], queryFn: () => fetchAll() as Promise<Tax[]> });
  const [f, setF] = useState({ kind: "DAS", period: "", amount: "", due_date: "", notes: "" });
  const [regime, setRegime] = useState<string>("Simples Nacional");
  const [filter, setFilter] = useState({ status: "all", kind: "all" });

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...f, amount: parseFloat(f.amount) || 0 } }),
    onSuccess: () => {
      toast.success("Obrigação registrada");
      setF({ kind: "DAS", period: "", amount: "", due_date: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["tax-obligations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const payM = useMutation({ mutationFn: (id: string) => pay({ data: { id } }), onSuccess: () => { toast.success("Pago"); qc.invalidateQueries({ queryKey: ["tax-obligations"] }); } });

  const filtered = useMemo(() => data.filter((t) => {
    if (filter.status !== "all" && t.status !== filter.status) return false;
    if (filter.kind !== "all" && t.kind !== filter.kind) return false;
    return true;
  }), [data, filter]);

  const totals = useMemo(() => {
    const open = filtered.filter((t) => t.status !== "paid");
    const overdue = open.filter((t) => (daysUntil(t.due_date) ?? 999) < 0);
    const due7 = open.filter((t) => { const d = daysUntil(t.due_date); return d !== null && d >= 0 && d <= 7; });
    return {
      openValue: open.reduce((s, t) => s + Number(t.amount || 0), 0),
      paidValue: filtered.filter((t) => t.status === "paid").reduce((s, t) => s + Number(t.amount || 0), 0),
      overdueCount: overdue.length,
      due7Count: due7.length,
    };
  }, [filtered]);

  // Group by month for calendar view
  const byMonth = useMemo(() => {
    const m: Record<string, Tax[]> = {};
    for (const t of filtered) {
      const k = t.due_date?.slice(0, 7) ?? t.period;
      m[k] = m[k] ?? [];
      m[k].push(t);
    }
    return Object.entries(m).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const kinds = Array.from(new Set(data.map((t) => t.kind)));

  return (
    <SimplePage title="Tributos & obrigações" description="DAS, IRPJ, ISS, INSS e outras obrigações fiscais com vencimento e comprovantes.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={AlertTriangle} label="Em atraso" value={String(totals.overdueCount)} tone={totals.overdueCount > 0 ? "danger" : "default"} />
        <Kpi icon={Calendar} label="Vencem em 7 dias" value={String(totals.due7Count)} tone={totals.due7Count > 0 ? "warn" : "default"} />
        <Kpi icon={TrendingDown} label="Em aberto" value={brl(totals.openValue)} />
        <Kpi icon={Check} label="Pago no histórico" value={brl(totals.paidValue)} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="space-y-4 self-start">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Nova obrigação</h2>
            <div className="mt-4 space-y-3">
              <Field label="Regime tributário">
                <select value={regime} onChange={(e) => { setRegime(e.target.value); setF({ ...f, kind: regimes[e.target.value][0] }); }} className={inputCls}>
                  {Object.keys(regimes).map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Tributo">
                <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={inputCls}>
                  {regimes[regime].map((k) => <option key={k}>{k}</option>)}
                  <option>Outras</option>
                </select>
              </Field>
              <Field label="Competência (MM/AAAA)"><input value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} placeholder="10/2026" className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Valor (R$)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" className={inputCls} /></Field>
                <Field label="Vencimento"><input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} className={inputCls} /></Field>
              </div>
              <button onClick={() => saveM.mutate()} disabled={!f.period || !f.amount || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {saveM.isPending ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Calendário {regime}</p>
            <ul className="space-y-1 list-disc list-inside">
              {regimes[regime].map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>
        </section>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos status</option><option value="pending">Pendentes</option><option value="paid">Pagos</option>
            </select>
            <select value={filter.kind} onChange={(e) => setFilter({ ...filter, kind: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos tributos</option>
              {kinds.map((k) => <option key={k}>{k}</option>)}
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} obrigação(ões)</span>
          </div>

          {byMonth.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
              <Receipt className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhuma obrigação</p>
              <p className="text-xs text-muted-foreground mt-1">Registre a primeira no painel ao lado.</p>
            </div>
          ) : (
            byMonth.map(([month, items]) => (
              <div key={month} className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
                <div className="bg-background/60 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">{month}</div>
                <div>
                  {items.map((t) => {
                    const d = daysUntil(t.due_date);
                    const overdue = t.status !== "paid" && d !== null && d < 0;
                    const soon = t.status !== "paid" && d !== null && d >= 0 && d <= 7;
                    return (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border first:border-t-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            overdue ? "bg-destructive/15 text-destructive" :
                            soon ? "bg-amber-500/15 text-amber-700" :
                            t.status === "paid" ? "bg-success/15 text-success" :
                            "bg-muted text-muted-foreground"
                          }`}>{t.kind.slice(0, 4)}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{t.kind} <span className="text-muted-foreground font-normal">· {t.period}</span></p>
                            <p className="text-xs text-muted-foreground">
                              {t.due_date ? `Vence ${new Date(t.due_date).toLocaleDateString("pt-BR")}` : "Sem vencimento"}
                              {overdue && <span className="ml-2 text-destructive font-medium">· {Math.abs(d!)}d em atraso</span>}
                              {soon && <span className="ml-2 text-amber-600 font-medium">· em {d}d</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="font-semibold tabular-nums text-sm">{brl(Number(t.amount))}</p>
                          {t.status === "paid" ? (
                            <span className="text-[10px] uppercase tracking-wider rounded-full bg-success/15 text-success px-2 py-0.5">pago</span>
                          ) : (
                            <button onClick={() => payM.mutate(t.id)} className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent/10 inline-flex items-center gap-1">
                              <Check className="h-3 w-3" /> Pagar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SimplePage>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Receipt; label: string; value: string; tone?: "success" | "warn" | "danger" | "default" }) {
  const cls = tone === "success" ? "text-success" : tone === "warn" ? "text-amber-600" : tone === "danger" ? "text-destructive" : "";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
