import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Smile, Meh, Frown } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listNps, submitNps, listPatients } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/nps")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listNps);
  const subFn = useServerFn(submitNps);
  const patFn = useServerFn(listPatients);
  const { data = [] } = useQuery({ queryKey: ["nps"], queryFn: () => listFn() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => patFn() });
  const [form, setForm] = useState({ patient_id: "", score: 9, comment: "" });

  const promoters = data.filter((r: any) => r.category === "promoter").length;
  const passives = data.filter((r: any) => r.category === "passive").length;
  const detractors = data.filter((r: any) => r.category === "detractor").length;
  const npsScore = data.length ? Math.round(((promoters - detractors) / data.length) * 100) : 0;

  const m = useMutation({
    mutationFn: () => subFn({ data: { ...form, patient_id: form.patient_id || undefined } }),
    onSuccess: () => { toast.success("Resposta NPS registrada"); qc.invalidateQueries({ queryKey: ["nps"] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aquisição</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">NPS automatizado</h1>
          <p className="mt-1.5 text-muted-foreground">Pesquisa pós-consulta que alimenta a Reputação.</p>
        </header>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-surface-elevated p-5"><p className="text-xs uppercase text-muted-foreground">NPS</p><p className="text-3xl font-semibold">{npsScore}</p></div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-5 flex items-center gap-3"><Smile className="h-6 w-6 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Promotores</p><p className="font-semibold">{promoters}</p></div></div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-5 flex items-center gap-3"><Meh className="h-6 w-6 text-amber-500" /><div><p className="text-xs text-muted-foreground">Neutros</p><p className="font-semibold">{passives}</p></div></div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-5 flex items-center gap-3"><Frown className="h-6 w-6 text-rose-500" /><div><p className="text-xs text-muted-foreground">Detratores</p><p className="font-semibold">{detractors}</p></div></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Registrar resposta</h2>
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Sem paciente</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <div>
              <label className="text-xs text-muted-foreground">Nota: {form.score}</label>
              <input type="range" min={0} max={10} value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} className="w-full" />
            </div>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Comentário" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => m.mutate()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Enviar</button>
          </section>
          <div className="space-y-2">
            {data.map((n: any) => (
              <div key={n.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{n.patients?.full_name ?? "Anônimo"}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${n.category === "promoter" ? "bg-emerald-500/20 text-emerald-700" : n.category === "passive" ? "bg-amber-500/20 text-amber-700" : "bg-rose-500/20 text-rose-700"}`}>{n.score} · {n.category}</span>
                </div>
                {n.comment && <p className="mt-1 text-sm text-muted-foreground">"{n.comment}"</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
