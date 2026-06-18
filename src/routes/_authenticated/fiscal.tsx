import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Download, Search, TrendingUp, FileCheck2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listNfse, issueNfse } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/fiscal")({ component: Page });

type Nfse = {
  id: string;
  rps_number: string;
  description: string;
  amount: number;
  iss_rate: number;
  iss_amount: number;
  taker_name: string | null;
  taker_document: string | null;
  taker_email: string | null;
  status: string;
  issued_at: string | null;
};

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function Page() {
  const fetchAll = useServerFn(listNfse);
  const issueFn = useServerFn(issueNfse);
  const qc = useQueryClient();
  const { data = [] } = useQuery<Nfse[]>({ queryKey: ["nfse"], queryFn: () => fetchAll() as Promise<Nfse[]> });
  const [f, setF] = useState({ description: "", amount: "", iss_rate: "2", taker_name: "", taker_document: "", taker_email: "" });
  const [filter, setFilter] = useState({ status: "all", search: "" });
  const [preview, setPreview] = useState<Nfse | null>(null);

  const issuePreview = useMemo(() => {
    const amount = parseFloat(f.amount) || 0;
    const rate = parseFloat(f.iss_rate) || 0;
    const iss = +(amount * (rate / 100)).toFixed(2);
    return { amount, iss, liquid: amount - iss };
  }, [f.amount, f.iss_rate]);

  const issue = useMutation({
    mutationFn: () => issueFn({ data: { ...f, amount: parseFloat(f.amount) || 0, iss_rate: parseFloat(f.iss_rate) || 0 } }),
    onSuccess: () => {
      toast.success("NFS-e emitida");
      setF({ description: "", amount: "", iss_rate: "2", taker_name: "", taker_document: "", taker_email: "" });
      qc.invalidateQueries({ queryKey: ["nfse"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = filter.search.toLowerCase();
    return data.filter((n) => {
      if (filter.status !== "all" && n.status !== filter.status) return false;
      if (q && !n.description.toLowerCase().includes(q) && !(n.taker_name ?? "").toLowerCase().includes(q) && !n.rps_number.includes(q)) return false;
      return true;
    });
  }, [data, filter]);

  const totals = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const thisMonth = data.filter((n) => (n.issued_at ?? "").startsWith(month));
    return {
      total: data.length,
      issued: data.filter((n) => n.status === "issued").length,
      month: thisMonth.reduce((s, n) => s + Number(n.amount), 0),
      iss: thisMonth.reduce((s, n) => s + Number(n.iss_amount), 0),
    };
  }, [data]);

  return (
    <SimplePage title="Notas fiscais (NFS-e)" description="Emita notas de serviço com cálculo automático de ISS e armazene PDF/XML.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={FileCheck2} label="Notas emitidas" value={String(totals.issued)} hint={`${totals.total} total`} />
        <Kpi icon={TrendingUp} label="Faturado no mês" value={brl(totals.month)} tone="success" />
        <Kpi icon={FileText} label="ISS recolhido (mês)" value={brl(totals.iss)} />
        <Kpi icon={AlertCircle} label="Pendentes" value={String(data.filter((n) => n.status === "pending").length)} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6 self-start">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Nova NFS-e</h2>
          <div className="mt-4 space-y-3">
            <Field label="Descrição do serviço"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="ex: Consulta médica especializada" rows={2} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Valor (R$)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" className={inputCls} /></Field>
              <Field label="ISS (%)"><input inputMode="decimal" value={f.iss_rate} onChange={(e) => setF({ ...f, iss_rate: e.target.value })} placeholder="2" className={inputCls} /></Field>
            </div>
            <Field label="Tomador (nome)"><input value={f.taker_name} onChange={(e) => setF({ ...f, taker_name: e.target.value })} placeholder="Nome do cliente" className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="CPF/CNPJ"><input value={f.taker_document} onChange={(e) => setF({ ...f, taker_document: e.target.value })} placeholder="000.000.000-00" className={inputCls} /></Field>
              <Field label="E-mail"><input type="email" value={f.taker_email} onChange={(e) => setF({ ...f, taker_email: e.target.value })} placeholder="cliente@email.com" className={inputCls} /></Field>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-background/50 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Valor bruto</span><span className="tabular-nums">{brl(issuePreview.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ISS retido</span><span className="text-destructive tabular-nums">- {brl(issuePreview.iss)}</span></div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-border"><span>Líquido a receber</span><span className="tabular-nums">{brl(issuePreview.liquid)}</span></div>
            </div>

            <button onClick={() => issue.mutate()} disabled={!f.description || !f.amount || issue.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {issue.isPending ? "Emitindo..." : "Emitir nota"}
            </button>
          </div>
        </section>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} placeholder="Buscar RPS, descrição ou tomador..." className={inputCls + " pl-9"} />
            </div>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className={inputCls + " w-auto"}>
              <option value="all">Todos status</option>
              <option value="issued">Emitidas</option>
              <option value="pending">Pendentes</option>
              <option value="canceled">Canceladas</option>
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} nota(s)</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhuma nota</p>
              <p className="text-xs text-muted-foreground mt-1">Emita sua primeira NFS-e no formulário ao lado.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5">RPS</th>
                    <th className="text-left px-4 py-2.5">Descrição / Tomador</th>
                    <th className="text-right px-4 py-2.5">Valor</th>
                    <th className="text-right px-4 py-2.5">ISS</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => (
                    <tr key={n.id} className="border-t border-border hover:bg-background/40">
                      <td className="px-4 py-3 font-mono text-xs">{n.rps_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">{n.description}</p>
                        <p className="text-xs text-muted-foreground">{n.taker_name || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{brl(Number(n.amount))}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{brl(Number(n.iss_amount))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                          n.status === "issued" ? "bg-success/15 text-success" :
                          n.status === "pending" ? "bg-amber-500/15 text-amber-700" :
                          "bg-muted text-muted-foreground"
                        }`}>{n.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setPreview(n)} className="text-xs text-primary hover:underline">Visualizar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreview(null)}>
          <div className="bg-surface-elevated rounded-2xl border border-border p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Nota fiscal de serviço</p>
                <p className="font-mono font-semibold mt-0.5">{preview.rps_number}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                preview.status === "issued" ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-700"
              }`}>{preview.status}</span>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Serviço">{preview.description}</Row>
              <Row label="Tomador">{preview.taker_name || "—"}</Row>
              <Row label="Documento">{preview.taker_document || "—"}</Row>
              <Row label="E-mail">{preview.taker_email || "—"}</Row>
              <div className="rounded-lg bg-background p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Valor bruto</span><span className="tabular-nums">{brl(Number(preview.amount))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Alíquota ISS</span><span>{Number(preview.iss_rate)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ISS retido</span><span className="text-destructive tabular-nums">- {brl(Number(preview.iss_amount))}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>Líquido</span><span className="tabular-nums">{brl(Number(preview.amount) - Number(preview.iss_amount))}</span></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Emitida em {preview.issued_at ? new Date(preview.issued_at).toLocaleString("pt-BR") : "—"}</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setPreview(null)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm">Fechar</button>
              <button
                onClick={() => toast.info("Download de PDF/XML será habilitado com integração da prefeitura")}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground inline-flex items-center justify-center gap-2"
              ><Download className="h-3.5 w-3.5" /> Baixar PDF</button>
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
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right">{children}</span></div>;
}
function Kpi({ icon: Icon, label, value, hint, tone }: { icon: typeof FileText; label: string; value: string; hint?: string; tone?: "success" | "warn" }) {
  const cls = tone === "success" ? "text-success" : tone === "warn" ? "text-amber-600" : "";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${cls}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
