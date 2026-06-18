import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, Plus, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listInventory, saveInventoryItem, moveInventory } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/estoque")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listInventory);
  const saveFn = useServerFn(saveInventoryItem);
  const moveFn = useServerFn(moveInventory);
  const { data = [] } = useQuery({ queryKey: ["inv"], queryFn: () => listFn() });
  const [form, setForm] = useState({ name: "", sku: "", category: "", unit: "un", quantity: 0, min_quantity: 0, unit_cost: 0, expires_at: "" });

  const m = useMutation({
    mutationFn: () => saveFn({ data: { ...form, expires_at: form.expires_at || undefined } }),
    onSuccess: () => { toast.success("Item salvo"); setForm({ name: "", sku: "", category: "", unit: "un", quantity: 0, min_quantity: 0, unit_cost: 0, expires_at: "" }); qc.invalidateQueries({ queryKey: ["inv"] }); },
  });
  const mv = useMutation({
    mutationFn: (v: { item_id: string; type: "in" | "out"; qty: number }) => moveFn({ data: { item_id: v.item_id, movement_type: v.type, quantity: v.qty } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inv"] }),
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operação</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Estoque</h1>
          <p className="mt-1.5 text-muted-foreground">Materiais e medicamentos com alerta de mínimo e validade.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Novo item</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoria" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} placeholder="Qtd" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })} placeholder="Mín" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} placeholder="Custo" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => m.mutate()} disabled={!form.name} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Adicionar</button>
          </section>
          <div className="space-y-2">
            {data.map((i: any) => {
              const low = Number(i.quantity) <= Number(i.min_quantity);
              return (
                <div key={i.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.category ?? "—"} · {i.quantity} {i.unit} {i.expires_at && `· val ${i.expires_at}`}</p>
                    </div>
                    {low && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700"><AlertTriangle className="h-3 w-3" /> baixo</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => mv.mutate({ item_id: i.id, type: "in", qty: 1 })} className="rounded p-1.5 border border-border"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => mv.mutate({ item_id: i.id, type: "out", qty: 1 })} className="rounded p-1.5 border border-border"><ArrowDown className="h-3 w-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
