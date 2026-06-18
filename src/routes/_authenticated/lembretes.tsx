import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listReminders, scheduleReminder, confirmReminder, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/lembretes")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReminders);
  const schedFn = useServerFn(scheduleReminder);
  const confFn = useServerFn(confirmReminder);
  const patFn = useServerFn(listPatients);
  const { data = [] } = useQuery({ queryKey: ["rems"], queryFn: () => listFn() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => patFn() });
  const [form, setForm] = useState({ patient_id: "", channel: "whatsapp" as "whatsapp" | "sms" | "email", scheduled_for: "", message: "" });

  const m = useMutation({
    mutationFn: () => schedFn({ data: { ...form, patient_id: form.patient_id || undefined, scheduled_for: new Date(form.scheduled_for).toISOString() } }),
    onSuccess: () => { toast.success("Lembrete agendado"); setForm({ patient_id: "", channel: "whatsapp", scheduled_for: "", message: "" }); qc.invalidateQueries({ queryKey: ["rems"] }); },
  });
  const conf = useMutation({
    mutationFn: (v: { id: string; c: "yes" | "no" }) => confFn({ data: { id: v.id, confirmation: v.c } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rems"] }),
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aquisição</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Lembretes inteligentes</h1>
          <p className="mt-1.5 text-muted-foreground">WhatsApp, SMS e e-mail com confirmação de presença.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Novo lembrete</h2>
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Selecione paciente</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">E-mail</option>
            </select>
            <input type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Mensagem" rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => m.mutate()} disabled={!form.scheduled_for || !form.message} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Agendar</button>
          </section>
          <div className="space-y-2">
            {data.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{r.patients?.full_name ?? "—"} · {r.channel}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.scheduled_for).toLocaleString("pt-BR")} · {r.status} {r.confirmation && `· ${r.confirmation}`}</p>
                    <p className="text-xs mt-1 line-clamp-1">{r.message}</p>
                  </div>
                </div>
                {!r.confirmation && (
                  <div className="flex gap-1">
                    <button onClick={() => conf.mutate({ id: r.id, c: "yes" })} className="rounded p-1.5 border border-border text-emerald-600"><Check className="h-3 w-3" /></button>
                    <button onClick={() => conf.mutate({ id: r.id, c: "no" })} className="rounded p-1.5 border border-border text-rose-600"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
