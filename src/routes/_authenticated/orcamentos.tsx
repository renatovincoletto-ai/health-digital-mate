import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileSignature, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listQuotes, createQuote, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/orcamentos")({ component: Page });

type Item = { name: string; qty: number; unit: number };

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQuotes);
  const createFn = useServerFn(createQuote);
  const patFn = useServerFn(listPatients);
  const { data = [] } = useQuery({ queryKey: ["quotes"], queryFn: () => listFn() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => patFn() });
  const [form, setForm] = useState({ patient_id: "", title: "", valid_until: "" });
  const [items, setItems] = useState<Item[]>([]);
  const [ni, setNi] = useState<Item>({ name: "", qty: 1, unit: 0 });
  const total = items.reduce((s, i) => s + i.qty * i.unit, 0);

  const m = useMutation({
    mutationFn: () => createFn({ data: { ...form, patient_id: form.patient_id || undefined, items, valid_until: form.valid_until || undefined } }),
    onSuccess: () => { toast.success("Orçamento criado"); setForm({ patient_id: "", title: "", valid_until: "" }); setItems([]); qc.invalidateQueries({ queryKey: ["quotes"] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Financeiro</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Orçamentos & contratos</h1>
          <p className="mt-1.5 text-muted-foreground">Geração, envio e aceite digital.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Novo orçamento</h2>
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Selecione paciente</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="rounded-lg border border-border p-3 space-y-2">
              <input value={ni.name} onChange={(e) => setNi({ ...ni, name: e.target.value })} placeholder="Item" className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={ni.qty} onChange={(e) => setNi({ ...ni, qty: Number(e.target.value) })} placeholder="Qtd" className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
                <input type="number" step="0.01" value={ni.unit} onChange={(e) => setNi({ ...ni, unit: Number(e.target.value) })} placeholder="Unit" className="rounded border border-border bg-background px-2 py-1.5 text-sm" />
              </div>
              <button onClick={() => { if (ni.name) { setItems([...items, ni]); setNi({ name: "", qty: 1, unit: 0 }); } }} className="w-full rounded border border-dashed border-border py-1 text-xs">+ adicionar</button>
            </div>
            {items.length > 0 && <p className="text-sm font-medium">Total: R$ {total.toFixed(2)}</p>}
            <button onClick={() => m.mutate()} disabled={!form.title || m.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Gerar orçamento</button>
          </section>
          <div className="space-y-3">
            {data.map((q: any) => (
              <div key={q.id} className="rounded-xl border border-border bg-surface-elevated p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-primary" /><p className="font-medium">{q.title}</p>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase">{q.status}</span>
                  </div>
                  <p className="font-semibold">R$ {Number(q.total_value).toFixed(2)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{q.patients?.full_name ?? "—"} · válido até {q.valid_until ?? "—"}</p>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum orçamento.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
