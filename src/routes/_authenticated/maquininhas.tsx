import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CreditCard, Smartphone, TrendingUp, Filter, Plug } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listTerminals, saveTerminal, listTefTransactions } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/maquininhas")({ component: Page });

type Terminal = { id: string; acquirer: string; model: string | null; serial_number: string | null; label: string | null };
type Tx = { id: string; brand: string | null; installments: number | null; nsu: string | null; amount: number; status: string | null; created_at: string; acquirer?: string };

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function Page() {
  const fetchT = useServerFn(listTerminals);
  const fetchX = useServerFn(listTefTransactions);
  const save = useServerFn(saveTerminal);
  const qc = useQueryClient();
  const { data: terminals = [] } = useQuery<Terminal[]>({ queryKey: ["pos"], queryFn: () => fetchT() as Promise<Terminal[]> });
  const { data: tx = [] } = useQuery<Tx[]>({ queryKey: ["tef"], queryFn: () => fetchX() as Promise<Tx[]> });
  const [f, setF] = useState({ acquirer: "Stone", model: "", serial_number: "", label: "" });
  const [filter, setFilter] = useState<{ acquirer: string }>({ acquirer: "all" });

  const saveM = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => {
      toast.success("Maquininha cadastrada");
      setF({ acquirer: "Stone", model: "", serial_number: "", label: "" });
      qc.invalidateQueries({ queryKey: ["pos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredTx = useMemo(() => {
    if (filter.acquirer === "all") return tx;
    return tx.filter((t) => t.acquirer === filter.acquirer);
  }, [tx, filter]);

  const totals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTx = filteredTx.filter((t) => t.created_at.startsWith(today));
    const byAcq: Record<string, { count: number; sum: number }> = {};
    for (const t of filteredTx) {
      const k = t.acquirer ?? "outros";
      byAcq[k] = byAcq[k] ?? { count: 0, sum: 0 };
      byAcq[k].count++;
      byAcq[k].sum += Number(t.amount || 0);
    }
    return {
      total: filteredTx.reduce((s, t) => s + Number(t.amount || 0), 0),
      count: filteredTx.length,
      today: todayTx.reduce((s, t) => s + Number(t.amount || 0), 0),
      todayCount: todayTx.length,
      byAcq,
    };
  }, [filteredTx]);

  return (
    <SimplePage title="Maquininhas & TEF" description="Cadastre POS físicas (Stone, Cielo, Rede, GetNet) e acompanhe transações de cartão integradas.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={Smartphone} label="Terminais ativos" value={String(terminals.length)} />
        <Kpi icon={TrendingUp} label="Vendas hoje" value={brl(totals.today)} hint={`${totals.todayCount} transações`} tone="success" />
        <Kpi icon={CreditCard} label="Volume total" value={brl(totals.total)} hint={`${totals.count} transações`} />
        <Kpi icon={Plug} label="Adquirentes" value={String(Object.keys(totals.byAcq).length || 0)} hint="conectados" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6 self-start">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Nova maquininha</h2>
          <div className="mt-4 space-y-3">
            <Field label="Adquirente"><select value={f.acquirer} onChange={(e) => setF({ ...f, acquirer: e.target.value })} className={inputCls}>
              <option>Stone</option><option>Cielo</option><option>Rede</option><option>GetNet</option><option>PagSeguro</option><option>SafraPay</option><option>Mercado Pago</option>
            </select></Field>
            <Field label="Modelo"><input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder="ex: S920, LIO V3" className={inputCls} /></Field>
            <Field label="Nº de série"><input value={f.serial_number} onChange={(e) => setF({ ...f, serial_number: e.target.value })} placeholder="000000000" className={inputCls} /></Field>
            <Field label="Apelido"><input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Recepção / Sala 1" className={inputCls} /></Field>
            <button onClick={() => saveM.mutate()} disabled={!f.acquirer || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {saveM.isPending ? "Salvando..." : "Adicionar terminal"}
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Terminais cadastrados</h3>
            <div className="space-y-2">
              {terminals.length === 0 && <p className="text-xs text-muted-foreground">Nenhum terminal ainda.</p>}
              {terminals.map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t.label || `${t.acquirer} ${t.model ?? ""}`}</p>
                    <span className="text-[10px] uppercase rounded-full bg-accent/20 px-2 py-0.5">{t.acquirer}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t.model ? `${t.model} · ` : ""}Série {t.serial_number || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h2 className="font-semibold">Transações TEF</h2>
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select value={filter.acquirer} onChange={(e) => setFilter({ acquirer: e.target.value })} className={inputCls + " w-auto"}>
                <option value="all">Todas adquirentes</option>
                {Array.from(new Set(terminals.map((t) => t.acquirer))).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhuma transação ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Conecte sua maquininha para capturar transações automaticamente.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5">Quando</th>
                    <th className="text-left px-4 py-2.5">Bandeira</th>
                    <th className="text-left px-4 py-2.5">NSU</th>
                    <th className="text-right px-4 py-2.5">Valor</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((t) => (
                    <tr key={t.id} className="border-t border-border hover:bg-background/40">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{t.brand ?? "—"}</span>
                        {t.installments && t.installments > 1 && <span className="ml-1 text-xs text-muted-foreground">{t.installments}x</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{t.nsu ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{brl(Number(t.amount))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                          t.status === "approved" ? "bg-success/15 text-success" :
                          t.status === "denied" ? "bg-destructive/15 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>{t.status ?? "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SimplePage>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
function Kpi({ icon: Icon, label, value, hint, tone }: { icon: typeof CreditCard; label: string; value: string; hint?: string; tone?: "success" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${tone === "success" ? "text-success" : ""}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
