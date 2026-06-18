import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listCalls, logCall, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/callcenter")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCalls);
  const logFn = useServerFn(logCall);
  const patFn = useServerFn(listPatients);
  const { data = [] } = useQuery({ queryKey: ["calls"], queryFn: () => listFn() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => patFn() });
  const [form, setForm] = useState({ patient_id: "", direction: "in" as "in" | "out", from_number: "", to_number: "", duration_seconds: 0, outcome: "", notes: "" });

  const m = useMutation({
    mutationFn: () => logFn({ data: { ...form, patient_id: form.patient_id || undefined } }),
    onSuccess: () => { toast.success("Ligação registrada"); setForm({ patient_id: "", direction: "in", from_number: "", to_number: "", duration_seconds: 0, outcome: "", notes: "" }); qc.invalidateQueries({ queryKey: ["calls"] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operação</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Call center</h1>
          <p className="mt-1.5 text-muted-foreground">Registro de chamadas, fila e múltiplas agendas em paralelo.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Registrar chamada</h2>
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="in">Recebida</option><option value="out">Realizada</option>
            </select>
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Sem paciente</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <input value={form.from_number} onChange={(e) => setForm({ ...form, from_number: e.target.value })} placeholder="De" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={form.to_number} onChange={(e) => setForm({ ...form, to_number: e.target.value })} placeholder="Para" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })} placeholder="Duração (s)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="Desfecho (agendou, retornar...)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => m.mutate()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Registrar</button>
          </section>
          <div className="space-y-2">
            {data.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
                <div className="flex items-center gap-3">
                  {c.direction === "in" ? <PhoneIncoming className="h-4 w-4 text-emerald-500" /> : <PhoneOutgoing className="h-4 w-4 text-primary" />}
                  <div>
                    <p className="font-medium text-sm">{c.patients?.full_name ?? c.from_number ?? c.to_number}</p>
                    <p className="text-xs text-muted-foreground">{Math.floor(c.duration_seconds / 60)}m{c.duration_seconds % 60}s · {c.outcome ?? "—"}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(c.started_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Sem registros.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
