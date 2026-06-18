import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gift, Copy } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listReferrals, createReferral } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/indicacoes")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReferrals);
  const createFn = useServerFn(createReferral);
  const { data = [] } = useQuery({ queryKey: ["refs"], queryFn: () => listFn() });
  const [form, setForm] = useState({ referrer_email: "", referred_email: "", reward_type: "discount" as "discount" | "credit" | "cashback", reward_value: 50 });

  const m = useMutation({
    mutationFn: () => createFn({ data: { ...form, referrer_email: form.referrer_email || undefined, referred_email: form.referred_email || undefined } }),
    onSuccess: () => { toast.success("Indicação criada"); qc.invalidateQueries({ queryKey: ["refs"] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aquisição</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Programa de indicação</h1>
          <p className="mt-1.5 text-muted-foreground">Paciente indica, ganha desconto — link único gerado automaticamente.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Nova indicação</h2>
            <input value={form.referrer_email} onChange={(e) => setForm({ ...form, referrer_email: e.target.value })} placeholder="E-mail do indicador" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={form.referred_email} onChange={(e) => setForm({ ...form, referred_email: e.target.value })} placeholder="E-mail do indicado (opcional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="discount">Desconto %</option><option value="credit">Crédito R$</option><option value="cashback">Cashback R$</option>
            </select>
            <input type="number" value={form.reward_value} onChange={(e) => setForm({ ...form, reward_value: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => m.mutate()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Gerar código</button>
          </section>
          <div className="space-y-2">
            {data.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
                <div className="flex items-center gap-3">
                  <Gift className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-mono text-sm font-semibold">{r.code}</p>
                    <p className="text-xs text-muted-foreground">{r.referrer_email ?? "—"} → {r.referred_email ?? "—"} · {r.reward_type} {r.reward_value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase">{r.status}</span>
                  <button onClick={() => { navigator.clipboard.writeText(r.code); toast.success("Copiado"); }} className="rounded border border-border p-1.5"><Copy className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Sem indicações ainda.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
