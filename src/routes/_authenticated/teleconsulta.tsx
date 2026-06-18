import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listTeleSessions, createTeleSession, listPatients } from "@/lib/wave6.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/teleconsulta")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listTeleSessions);
  const createFn = useServerFn(createTeleSession);
  const fetchPatients = useServerFn(listPatients);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["tele"], queryFn: () => fetchAll() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => fetchPatients() });
  const [patientId, setPatientId] = useState("");

  const create = useMutation({
    mutationFn: () => createFn({ data: { patient_id: patientId || undefined } }),
    onSuccess: () => { toast.success("Sala criada"); qc.invalidateQueries({ queryKey: ["tele"] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Atendimento</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Teleconsulta</h1>
          <p className="mt-1.5 text-muted-foreground">Salas de vídeo seguras com link único, sem instalação.</p>
        </header>
        <div className="mb-6 flex gap-2">
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Sem paciente vinculado</option>
            {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <button onClick={() => create.mutate()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Nova sala</button>
        </div>
        <div className="space-y-3">
          {data.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-5">
              <div>
                <div className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" /><p className="font-medium">{s.patients?.full_name ?? "Sem paciente"}</p>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase">{s.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(s.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <a href={s.room_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">Entrar <ExternalLink className="h-3 w-3" /></a>
            </div>
          ))}
          {data.length === 0 && <p className="text-sm text-muted-foreground">Crie sua primeira sala de atendimento online.</p>}
        </div>
      </div>
    </AppShell>
  );
}
