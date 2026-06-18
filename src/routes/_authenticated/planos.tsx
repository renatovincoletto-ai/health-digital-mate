import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listTreatmentPlans, createTreatmentPlan, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/planos")({ component: Page });

type Item = { procedure_name: string; tooth?: string; unit_value: number; quantity: number };

function Page() {
  const fetchAll = useServerFn(listTreatmentPlans);
  const createFn = useServerFn(createTreatmentPlan);
  const fetchPatients = useServerFn(listPatients);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["plans"], queryFn: () => fetchAll() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => fetchPatients() });
  const [form, setForm] = useState({ patient_id: "", title: "", description: "" });
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<Item>({ procedure_name: "", tooth: "", unit_value: 0, quantity: 1 });

  const create = useMutation({
    mutationFn: () => createFn({ data: { ...form, items } }),
    onSuccess: () => { toast.success("Plano criado"); setForm({ patient_id: "", title: "", description: "" }); setItems([]); qc.invalidateQueries({ queryKey: ["plans"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = items.reduce((s, i) => s + i.unit_value * i.quantity, 0);

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Atendimento</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Planos de tratamento</h1>
          <p className="mt-1.5 text-muted-foreground">Etapas com valores, status e ligação com financeiro. Inclui odontograma para odonto.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Novo plano</h2>
            <div className="mt-4 space-y-3">
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Selecione paciente</option>
                {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Adicionar etapa</p>
                <input value={newItem.procedure_name} onChange={(e) => setNewItem({ ...newItem, procedure_name: e.target.value })} placeholder="Procedimento" className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <input value={newItem.tooth} onChange={(e) => setNewItem({ ...newItem, tooth: e.target.value })} placeholder="Dente" className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
                  <input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
                  <input type="number" step="0.01" value={newItem.unit_value} onChange={(e) => setNewItem({ ...newItem, unit_value: Number(e.target.value) })} placeholder="R$" className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
                </div>
                <button onClick={() => { if (newItem.procedure_name) { setItems([...items, newItem]); setNewItem({ procedure_name: "", tooth: "", unit_value: 0, quantity: 1 }); } }} className="w-full rounded-md border border-dashed border-border py-1.5 text-xs">+ Adicionar etapa</button>
              </div>
              {items.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {items.map((i, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded bg-background px-2 py-1">
                      <span>{i.tooth && `[${i.tooth}] `}{i.procedure_name} ×{i.quantity}</span>
                      <span>R$ {(i.unit_value * i.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between border-t border-border pt-1 font-medium">Total <span>R$ {total.toFixed(2)}</span></li>
                </ul>
              )}
              <button onClick={() => create.mutate()} disabled={!form.patient_id || !form.title || create.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Criar plano</button>
            </div>
          </section>
          <div className="space-y-3">
            {data.map((p: any) => (
              <div key={p.id} className="rounded-xl border border-border bg-surface-elevated p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /><p className="font-medium">{p.title}</p>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase">{p.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.patients?.full_name} · {p.treatment_plan_items?.length ?? 0} etapas</p>
                  </div>
                  <p className="text-lg font-semibold">R$ {Number(p.total_value ?? 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum plano criado.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
