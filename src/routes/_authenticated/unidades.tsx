import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listLocations, saveLocation, deleteLocation } from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/unidades")({
  component: UnidadesPage,
});

function UnidadesPage() {
  const fetchAll = useServerFn(listLocations);
  const saveFn = useServerFn(saveLocation);
  const delFn = useServerFn(deleteLocation);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["locations"], queryFn: () => fetchAll() });

  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", phone: "", is_primary: false });

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { ...form, active: true } }),
    onSuccess: () => { toast.success("Unidade salva"); setForm({ name: "", address: "", city: "", state: "", phone: "", is_primary: false }); qc.invalidateQueries({ queryKey: ["locations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Unidade removida"); qc.invalidateQueries({ queryKey: ["locations"] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Multi-unidade</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Unidades & consultórios</h1>
          <p className="mt-1.5 text-muted-foreground">Cadastre múltiplos endereços. Aparecerão no site público e na agenda.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Nova unidade</h2>
            <div className="mt-4 space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome (ex: Matriz Pinheiros)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereço completo" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="UF" maxLength={2} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} /> Definir como matriz</label>
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
              </button>
            </div>
          </section>

          <div className="space-y-3">
            {data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada.</p>}
            {data?.map((l) => (
              <div key={l.id} className="flex items-start justify-between rounded-xl border border-border bg-surface-elevated p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="font-display font-semibold">{l.name}</p>
                    {l.is_primary && <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground"><Star className="h-3 w-3" /> Matriz</span>}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{l.address}</p>
                  <p className="text-xs text-muted-foreground">{l.city}{l.state && `/${l.state}`} {l.phone && `· ${l.phone}`}</p>
                </div>
                <button onClick={() => delMut.mutate(l.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
