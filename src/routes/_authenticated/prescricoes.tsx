import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, QrCode, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listPrescriptions, createPrescription, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/prescricoes")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listPrescriptions);
  const createFn = useServerFn(createPrescription);
  const fetchPatients = useServerFn(listPatients);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["rx"], queryFn: () => fetchAll() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => fetchPatients() });
  const [form, setForm] = useState({ patient_id: "", doc_type: "receita" as "receita" | "atestado" | "exame", content: "", valid_until: "" });

  const create = useMutation({
    mutationFn: () => createFn({ data: { ...form, valid_until: form.valid_until || undefined } }),
    onSuccess: () => { toast.success("Documento assinado digitalmente"); setForm({ patient_id: "", doc_type: "receita", content: "", valid_until: "" }); qc.invalidateQueries({ queryKey: ["rx"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Atendimento</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Prescrição digital</h1>
          <p className="mt-1.5 text-muted-foreground">Receita, atestado e pedido de exame com QR de validação e assinatura ICP-Brasil.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Novo documento</h2>
            <div className="mt-4 space-y-3">
              <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="receita">Receita</option>
                <option value="atestado">Atestado</option>
                <option value="exame">Pedido de exame</option>
              </select>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Selecione paciente</option>
                {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Conteúdo do documento" rows={6} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => create.mutate()} disabled={!form.patient_id || !form.content || create.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Assinar e gerar QR</button>
            </div>
          </section>
          <div className="space-y-3">
            {data.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-border bg-surface-elevated p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <p className="font-medium uppercase text-xs">{r.doc_type}</p>
                    <span className="text-sm">— {r.patients?.full_name}</span>
                  </div>
                  <a href={r.qr_code} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary"><QrCode className="h-3 w-3" /> Validar</a>
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{r.content}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">Assinado · {new Date(r.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum documento gerado.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
