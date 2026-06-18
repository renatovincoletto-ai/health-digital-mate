import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Users, Tag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listPatients, savePatient, deletePatient } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/pacientes")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listPatients);
  const saveFn = useServerFn(savePatient);
  const delFn = useServerFn(deletePatient);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["patients"], queryFn: () => fetchAll() });
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", cpf: "", tags: "" });

  const save = useMutation({
    mutationFn: () => saveFn({ data: { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) } }),
    onSuccess: () => { toast.success("Paciente salvo"); setForm({ full_name: "", phone: "", email: "", cpf: "", tags: "" }); qc.invalidateQueries({ queryKey: ["patients"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }) });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">CRM</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Pacientes</h1>
          <p className="mt-1.5 text-muted-foreground">Cadastro completo, segmentação por tags e histórico unificado.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Novo paciente</h2>
            <div className="mt-4 space-y-3">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome completo" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone / WhatsApp" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="CPF" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (separadas por vírgula)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => save.mutate()} disabled={!form.full_name || save.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Adicionar</button>
            </div>
          </section>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users className="h-3 w-3" /> {data.length} pacientes</p>
            {data.map((p: any) => (
              <div key={p.id} className="flex items-start justify-between rounded-xl border border-border bg-surface-elevated p-4">
                <div>
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone} {p.email && `· ${p.email}`}</p>
                  {p.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.map((t: string) => <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium"><Tag className="h-2.5 w-2.5" />{t}</span>)}
                    </div>
                  )}
                </div>
                <button onClick={() => del.mutate(p.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
