import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Banknote, Check, Download, Filter, TrendingUp, Wallet, Clock } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listPayouts, createPayout, settlePayout, listProfessionalsLite } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/repasses")({ component: Page });

type Payout = {
  id: string;
  professional_id: string;
  period_start: string;
  period_end: string;
  gross_amount: number;
  fees_amount: number;
  net_amount: number;
  payment_method: string | null;
  status: string;
  paid_at: string | null;
  professionals?: { full_name: string } | null;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Page() {
  const fetchAll = useServerFn(listPayouts);
  const fetchPros = useServerFn(listProfessionalsLite);
  const create = useServerFn(createPayout);
  const settle = useServerFn(settlePayout);
  const qc = useQueryClient();
  const { data = [] } = useQuery<Payout[]>({ queryKey: ["payouts"], queryFn: () => fetchAll() as Promise<Payout[]> });
  const { data: pros = [] } = useQuery<{ id: string; full_name: string }[]>({
    queryKey: ["professionals-min"],
    queryFn: () => fetchPros() as Promise<{ id: string; full_name: string }[]>,
  });

  const [filter, setFilter] = useState<{ pro: string; status: string }>({ pro: "all", status: "all" });
  const [f, setF] = useState({
    professional_id: "",
    period_start: "",
    period_end: "",
    gross_amount: "",
    fees_pct: "0",
    payment_method: "Pix",
  });

  const feesAmount = useMemo(() => {
    const g = parseFloat(f.gross_amount) || 0;
    const p = parseFloat(f.fees_pct) || 0;
    return +(g * (p / 100)).toFixed(2);
  }, [f.gross_amount, f.fees_pct]);
  const netPreview = (parseFloat(f.gross_amount) || 0) - feesAmount;

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (filter.pro !== "all" && p.professional_id !== filter.pro) return false;
      if (filter.status !== "all" && p.status !== filter.status) return false;
      return true;
    });
  }, [data, filter]);

  const totals = useMemo(() => {
    const open = filtered.filter((p) => p.status !== "paid");
    const paid = filtered.filter((p) => p.status === "paid");
    return {
      openCount: open.length,
      openValue: open.reduce((s, p) => s + Number(p.net_amount || 0), 0),
      paidValue: paid.reduce((s, p) => s + Number(p.net_amount || 0), 0),
      grossValue: filtered.reduce((s, p) => s + Number(p.gross_amount || 0), 0),
    };
  }, [filtered]);

  const createM = useMutation({
    mutationFn: () =>
      create({
        data: {
          professional_id: f.professional_id,
          period_start: f.period_start,
          period_end: f.period_end,
          gross_amount: parseFloat(f.gross_amount) || 0,
          fees_amount: feesAmount,
          payment_method: f.payment_method,
        },
      }),
    onSuccess: () => {
      toast.success("Repasse criado");
      setF({ professional_id: "", period_start: "", period_end: "", gross_amount: "", fees_pct: "0", payment_method: "Pix" });
      qc.invalidateQueries({ queryKey: ["payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const settleM = useMutation({
    mutationFn: (id: string) => settle({ data: { id } }),
    onSuccess: () => {
      toast.success("Repasse liquidado");
      qc.invalidateQueries({ queryKey: ["payouts"] });
    },
  });

  function exportCsv() {
    const rows = [
      ["Profissional", "Período", "Bruto", "Taxas", "Líquido", "Método", "Status", "Pago em"],
      ...filtered.map((p) => [
        p.professionals?.full_name ?? "",
        `${p.period_start} a ${p.period_end}`,
        Number(p.gross_amount).toFixed(2),
        Number(p.fees_amount).toFixed(2),
        Number(p.net_amount).toFixed(2),
        p.payment_method ?? "",
        p.status,
        p.paid_at ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repasses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <SimplePage
      title="Repasses a profissionais"
      description="Fechamento de comissões por período, líquido após taxas, com pagamento por Pix ou transferência."
      actions={
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm hover:bg-accent/10"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard icon={Clock} label="Em aberto" value={brl(totals.openValue)} hint={`${totals.openCount} repasse(s)`} tone="warn" />
        <KpiCard icon={Check} label="Pago no período" value={brl(totals.paidValue)} tone="success" />
        <KpiCard icon={TrendingUp} label="Bruto total" value={brl(totals.grossValue)} />
        <KpiCard icon={Wallet} label="Profissionais ativos" value={String(pros.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Form */}
        <section className="rounded-2xl border border-border bg-surface-elevated p-6 self-start">
          <h2 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4" /> Novo fechamento</h2>
          <p className="mt-1 text-xs text-muted-foreground">Comissão calculada por % sobre o bruto.</p>
          <div className="mt-4 space-y-3">
            <Field label="Profissional">
              <select value={f.professional_id} onChange={(e) => setF({ ...f, professional_id: e.target.value })} className={inputCls}>
                <option value="">Selecione...</option>
                {pros.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Início"><input type="date" value={f.period_start} onChange={(e) => setF({ ...f, period_start: e.target.value })} className={inputCls} /></Field>
              <Field label="Fim"><input type="date" value={f.period_end} onChange={(e) => setF({ ...f, period_end: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Valor bruto (R$)"><input inputMode="decimal" value={f.gross_amount} onChange={(e) => setF({ ...f, gross_amount: e.target.value })} placeholder="0,00" className={inputCls} /></Field>
            <Field label="Comissão / taxas (%)"><input inputMode="decimal" value={f.fees_pct} onChange={(e) => setF({ ...f, fees_pct: e.target.value })} placeholder="0" className={inputCls} /></Field>
            <Field label="Método"><select value={f.payment_method} onChange={(e) => setF({ ...f, payment_method: e.target.value })} className={inputCls}>
              <option>Pix</option><option>TED</option><option>Boleto</option><option>Dinheiro</option>
            </select></Field>

            <div className="rounded-lg border border-dashed border-border bg-background/50 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>{brl(feesAmount)}</span></div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-border"><span>Líquido a pagar</span><span>{brl(netPreview)}</span></div>
            </div>

            <button
              onClick={() => createM.mutate()}
              disabled={!f.professional_id || !f.gross_amount || !f.period_start || !f.period_end || createM.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createM.isPending ? "Salvando..." : "Criar repasse"}
            </button>
          </div>
        </section>

        {/* Listing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={filter.pro} onChange={(e) => setFilter({ ...filter, pro: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos os profissionais</option>
              {pros.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagos</option>
            </select>
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Banknote} title="Nenhum repasse" hint="Crie o primeiro fechamento no painel ao lado." />
          ) : (
            <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5">Profissional</th>
                    <th className="text-left px-4 py-2.5">Período</th>
                    <th className="text-right px-4 py-2.5">Bruto</th>
                    <th className="text-right px-4 py-2.5">Líquido</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-background/40">
                      <td className="px-4 py-3 font-medium">{p.professionals?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.period_start} → {p.period_end}
                        <div className="text-[10px]">{p.payment_method}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{brl(Number(p.gross_amount))}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{brl(Number(p.net_amount))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status !== "paid" && (
                          <button
                            onClick={() => settleM.mutate(p.id)}
                            className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent/10 inline-flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Liquidar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SimplePage>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warn";
}) {
  const toneCls = tone === "success" ? "text-success" : tone === "warn" ? "text-amber-600" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Pago", cls: "bg-success/15 text-success" },
    pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-700" },
    canceled: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${m.cls}`}>{m.label}</span>;
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Banknote; title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
      <Icon className="h-8 w-8 mx-auto text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
