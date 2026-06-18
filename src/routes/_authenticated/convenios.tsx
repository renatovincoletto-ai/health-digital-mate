import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building, Search, ShieldCheck, FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/simple-page";
import { listInsurancePlans, saveInsurancePlan, listTissGuides } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/convenios")({ component: Page });

type Plan = { id: string; operator_name: string; plan_name: string; ans_code: string | null; contract_number: string | null };
type Guide = { id: string; insurance_plan_id: string | null; amount: number; paid_amount: number | null; status: string };

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function Page() {
  const fetchAll = useServerFn(listInsurancePlans);
  const fetchGuides = useServerFn(listTissGuides);
  const save = useServerFn(saveInsurancePlan);
  const qc = useQueryClient();
  const { data = [] } = useQuery<Plan[]>({ queryKey: ["insurance-plans"], queryFn: () => fetchAll() as Promise<Plan[]> });
  const { data: guides = [] } = useQuery<Guide[]>({ queryKey: ["tiss-guides"], queryFn: () => fetchGuides() as Promise<Guide[]> });
  const [f, setF] = useState({ operator_name: "", plan_name: "", ans_code: "", contract_number: "" });
  const [search, setSearch] = useState("");

  const saveM = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => {
      toast.success("Convênio cadastrado");
      setF({ operator_name: "", plan_name: "", ans_code: "", contract_number: "" });
      qc.invalidateQueries({ queryKey: ["insurance-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statsByPlan = useMemo(() => {
    const m: Record<string, { count: number; billed: number; received: number }> = {};
    for (const g of guides) {
      if (!g.insurance_plan_id) continue;
      m[g.insurance_plan_id] = m[g.insurance_plan_id] ?? { count: 0, billed: 0, received: 0 };
      m[g.insurance_plan_id].count++;
      m[g.insurance_plan_id].billed += Number(g.amount || 0);
      m[g.insurance_plan_id].received += Number(g.paid_amount || 0);
    }
    return m;
  }, [guides]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((p) =>
      !q || p.operator_name.toLowerCase().includes(q) || p.plan_name.toLowerCase().includes(q) || (p.ans_code ?? "").includes(q),
    );
  }, [data, search]);

  const totals = useMemo(() => ({
    plans: data.length,
    operators: new Set(data.map((p) => p.operator_name)).size,
    billed: guides.reduce((s, g) => s + Number(g.amount || 0), 0),
    received: guides.reduce((s, g) => s + Number(g.paid_amount || 0), 0),
  }), [data, guides]);

  return (
    <SimplePage title="Convênios" description="Cadastro de operadoras e planos de saúde aceitos. Use junto com Guias TISS para faturamento.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={Building} label="Planos cadastrados" value={String(totals.plans)} hint={`${totals.operators} operadora(s)`} />
        <Kpi icon={FileBarChart} label="Guias emitidas" value={String(guides.length)} />
        <Kpi icon={ShieldCheck} label="Faturado total" value={brl(totals.billed)} />
        <Kpi icon={ShieldCheck} label="Recebido total" value={brl(totals.received)} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6 self-start">
          <h2 className="font-semibold flex items-center gap-2"><Building className="h-4 w-4" /> Novo convênio</h2>
          <div className="mt-4 space-y-3">
            <Field label="Operadora"><input value={f.operator_name} onChange={(e) => setF({ ...f, operator_name: e.target.value })} placeholder="ex: Unimed, Bradesco Saúde" className={inputCls} /></Field>
            <Field label="Nome do plano"><input value={f.plan_name} onChange={(e) => setF({ ...f, plan_name: e.target.value })} placeholder="ex: Empresarial Pleno" className={inputCls} /></Field>
            <Field label="Registro ANS"><input value={f.ans_code} onChange={(e) => setF({ ...f, ans_code: e.target.value })} placeholder="6 dígitos" className={inputCls} /></Field>
            <Field label="Nº contrato"><input value={f.contract_number} onChange={(e) => setF({ ...f, contract_number: e.target.value })} placeholder="opcional" className={inputCls} /></Field>
            <button onClick={() => saveM.mutate()} disabled={!f.operator_name || !f.plan_name || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {saveM.isPending ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
          <div className="mt-5 rounded-lg border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Próximos passos</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Após cadastrar, emita guias em <Link to="/tiss" className="text-primary hover:underline">Guias TISS</Link></li>
              <li>Acompanhe glosas e recebimentos por operadora</li>
            </ul>
          </div>
        </section>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por operadora, plano ou ANS..." className={inputCls + " pl-9"} />
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} de {data.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
              <Building className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhum convênio</p>
              <p className="text-xs text-muted-foreground mt-1">Cadastre o primeiro plano no painel ao lado.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((p) => {
                const s = statsByPlan[p.id];
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{p.operator_name} <span className="text-muted-foreground font-normal">· {p.plan_name}</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ANS {p.ans_code || "—"} · Contrato {p.contract_number || "—"}
                        </p>
                      </div>
                      <Link to="/tiss" className="text-xs text-primary hover:underline">Faturar →</Link>
                    </div>
                    {s && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <Stat label="Guias" value={String(s.count)} />
                        <Stat label="Faturado" value={brl(s.billed)} />
                        <Stat label="Recebido" value={brl(s.received)} tone="success" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-lg bg-background/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-semibold tabular-nums ${tone === "success" ? "text-success" : ""}`}>{value}</p>
    </div>
  );
}
function Kpi({ icon: Icon, label, value, hint, tone }: { icon: typeof Building; label: string; value: string; hint?: string; tone?: "success" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${tone === "success" ? "text-success" : ""}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
