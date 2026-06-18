import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listNfse, issueNfse } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/fiscal")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listNfse);
  const issueFn = useServerFn(issueNfse);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["nfse"], queryFn: () => fetchAll() });
  const [f, setF] = useState({ description: "", amount: "", iss_rate: "2", taker_name: "", taker_document: "", taker_email: "" });

  const issue = useMutation({
    mutationFn: () => issueFn({ data: { ...f, amount: parseFloat(f.amount) || 0, iss_rate: parseFloat(f.iss_rate) || 0 } }),
    onSuccess: () => { toast.success("NFS-e emitida"); setF({ description: "", amount: "", iss_rate: "2", taker_name: "", taker_document: "", taker_email: "" }); qc.invalidateQueries({ queryKey: ["nfse"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SimplePage title="Notas fiscais (NFS-e)" description="Emita notas de serviço com cálculo automático de ISS e armazene PDF/XML.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Nova NFS-e</h2>
          <div className="mt-4 space-y-3">
            <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descrição do serviço" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Valor (R$)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={f.iss_rate} onChange={(e) => setF({ ...f, iss_rate: e.target.value })} placeholder="ISS %" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <input value={f.taker_name} onChange={(e) => setF({ ...f, taker_name: e.target.value })} placeholder="Tomador (nome)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.taker_document} onChange={(e) => setF({ ...f, taker_document: e.target.value })} placeholder="CPF/CNPJ" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.taker_email} onChange={(e) => setF({ ...f, taker_email: e.target.value })} placeholder="E-mail" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => issue.mutate()} disabled={!f.description || !f.amount || issue.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Emitir nota</button>
          </div>
        </section>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{data.length} notas</p>
          {data.map((n: any) => (
            <div key={n.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
              <div>
                <p className="font-medium">{n.rps_number} · {n.description}</p>
                <p className="text-xs text-muted-foreground">Tomador: {n.taker_name || "—"} · ISS R$ {Number(n.iss_amount).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {Number(n.amount).toFixed(2)}</p>
                <span className="text-[10px] uppercase rounded-full bg-success/15 text-success px-2 py-0.5">{n.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}
