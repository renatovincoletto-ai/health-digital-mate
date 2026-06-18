import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Workflow, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listJourneys, saveJourney, addJourneyStep, toggleJourney } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/jornadas")({ component: Page });

const triggerLabels: Record<string, string> = {
  appointment_completed: "Após consulta",
  no_show: "Falta na consulta",
  first_visit: "Primeira visita",
  birthday: "Aniversário",
  treatment_finished: "Fim do tratamento",
  manual: "Manual",
};

function Page() {
  const fetchAll = useServerFn(listJourneys);
  const save = useServerFn(saveJourney);
  const addStep = useServerFn(addJourneyStep);
  const toggle = useServerFn(toggleJourney);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["journeys"], queryFn: () => fetchAll() });
  const [f, setF] = useState({ name: "", description: "", trigger_event: "appointment_completed" as const });
  const [stepForm, setStepForm] = useState<Record<string, { delay_hours: string; channel: "whatsapp" | "sms" | "email" | "task"; template: string }>>({});

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...f, active: false } }),
    onSuccess: () => { toast.success("Jornada criada"); setF({ name: "", description: "", trigger_event: "appointment_completed" }); qc.invalidateQueries({ queryKey: ["journeys"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const stepM = useMutation({
    mutationFn: (data: any) => addStep({ data }),
    onSuccess: () => { toast.success("Passo adicionado"); qc.invalidateQueries({ queryKey: ["journeys"] }); },
  });
  const togM = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggle({ data: { id, active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journeys"] }),
  });

  return (
    <SimplePage title="Jornadas do paciente" description="Automatize sequências de mensagens com IA: lembretes, recall, pós-atendimento, aniversário e mais.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><Workflow className="h-4 w-4" /> Nova jornada</h2>
          <div className="mt-4 space-y-3">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nome (ex: Recall 6 meses)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descrição" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={f.trigger_event} onChange={(e) => setF({ ...f, trigger_event: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {Object.entries(triggerLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={() => saveM.mutate()} disabled={!f.name || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Criar</button>
          </div>
        </section>
        <div className="space-y-4">
          {data.map((j: any) => (
            <div key={j.id} className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{j.name}</p>
                  <p className="text-xs text-muted-foreground">Gatilho: {triggerLabels[j.trigger_event]} · {j.journey_steps?.length || 0} passos</p>
                </div>
                <button onClick={() => togM.mutate({ id: j.id, active: !j.active })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${j.active ? "bg-success/15 text-success" : "border border-border"}`}>
                  <Power className="h-3 w-3" /> {j.active ? "Ativa" : "Pausada"}
                </button>
              </div>
              <div className="mt-3 space-y-1.5">
                {(j.journey_steps || []).sort((a: any, b: any) => a.step_order - b.step_order).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs rounded-lg bg-background px-3 py-2">
                    <span className="font-mono text-muted-foreground">+{s.delay_hours}h</span>
                    <span className="uppercase text-[10px] rounded bg-accent/20 px-1.5 py-0.5">{s.channel}</span>
                    <span className="flex-1 truncate">{s.template}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <input
                  placeholder="Horas"
                  value={stepForm[j.id]?.delay_hours || ""}
                  onChange={(e) => setStepForm({ ...stepForm, [j.id]: { ...stepForm[j.id], delay_hours: e.target.value, channel: stepForm[j.id]?.channel || "whatsapp", template: stepForm[j.id]?.template || "" } })}
                  className="w-16 rounded border border-border bg-background px-2 py-1"
                />
                <select
                  value={stepForm[j.id]?.channel || "whatsapp"}
                  onChange={(e) => setStepForm({ ...stepForm, [j.id]: { ...stepForm[j.id], channel: e.target.value as any, delay_hours: stepForm[j.id]?.delay_hours || "0", template: stepForm[j.id]?.template || "" } })}
                  className="rounded border border-border bg-background px-2 py-1"
                >
                  <option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">E-mail</option><option value="task">Tarefa</option>
                </select>
                <input
                  placeholder="Mensagem / template"
                  value={stepForm[j.id]?.template || ""}
                  onChange={(e) => setStepForm({ ...stepForm, [j.id]: { ...stepForm[j.id], template: e.target.value, delay_hours: stepForm[j.id]?.delay_hours || "0", channel: stepForm[j.id]?.channel || "whatsapp" } })}
                  className="flex-1 rounded border border-border bg-background px-2 py-1"
                />
                <button
                  onClick={() => {
                    const s = stepForm[j.id];
                    if (!s?.template) return;
                    stepM.mutate({ journey_id: j.id, step_order: (j.journey_steps?.length || 0), delay_hours: parseInt(s.delay_hours) || 0, channel: s.channel, template: s.template });
                    setStepForm({ ...stepForm, [j.id]: { delay_hours: "", channel: "whatsapp", template: "" } });
                  }}
                  className="rounded bg-primary px-2 py-1 text-primary-foreground"
                ><Plus className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}
