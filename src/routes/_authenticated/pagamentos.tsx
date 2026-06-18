import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link2, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listPaymentLinks, createPaymentLink, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/pagamentos")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPaymentLinks);
  const createFn = useServerFn(createPaymentLink);
  const patFn = useServerFn(listPatients);
  const { data = [] } = useQuery({ queryKey: ["plinks"], queryFn: () => listFn() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => patFn() });
  const [form, setForm] = useState({ patient_id: "", amount: 0, description: "", provider: "pix" as "pix" | "card" | "boleto" });

  const m = useMutation({
    mutationFn: () => createFn({ data: { ...form, patient_id: form.patient_id || undefined } }),
    onSuccess: () => { toast.success("Link gerado"); setForm({ patient_id: "", amount: 0, description: "", provider: "pix" }); qc.invalidateQueries({ queryKey: ["plinks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Financeiro</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Pagamentos online</h1>
          <p className="mt-1.5 text-muted-foreground">Pix, cartão e boleto — gere cobranças e envie via WhatsApp.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Novo link de cobrança</h2>
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Sem paciente</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Valor R$" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="pix">Pix</option><option value="card">Cartão</option><option value="boleto">Boleto</option>
            </select>
            <button onClick={() => m.mutate()} disabled={!form.amount || m.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Gerar link</button>
          </section>
          <div className="space-y-3">
            {data.map((l: any) => (
              <div key={l.id} className="rounded-xl border border-border bg-surface-elevated p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /><span className="uppercase text-xs">{l.provider}</span> · <span className="text-sm font-medium">R$ {Number(l.amount).toFixed(2)}</span></div>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase">{l.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{l.patients?.full_name ?? "—"} · {l.description}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(l.url); toast.success("Copiado"); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"><Copy className="h-3 w-3" /> Link</button>
                  {l.qr_code && <button onClick={() => { navigator.clipboard.writeText(l.qr_code); toast.success("Pix copiado"); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"><QrCode className="h-3 w-3" /> Pix copia-e-cola</button>}
                </div>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cobrança gerada.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
