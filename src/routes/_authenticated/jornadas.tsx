import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Workflow, Plus, Power, MessageSquare, Mail, Smartphone, ListTodo, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listJourneys, saveJourney, addJourneyStep, toggleJourney } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/jornadas")({ component: Page });

type Step = { id: string; step_order: number; delay_hours: number; channel: "whatsapp" | "sms" | "email" | "task"; template: string };
type Journey = {
  id: string;
  name: string;
  description: string | null;
  trigger_event: "appointment_completed" | "no_show" | "first_visit" | "birthday" | "treatment_finished" | "manual";
  active: boolean;
  journey_steps?: Step[];
};

const triggerLabels: Record<Journey["trigger_event"], string> = {
  appointment_completed: "Após consulta",
  no_show: "Falta na consulta",
  first_visit: "Primeira visita",
  birthday: "Aniversário",
  treatment_finished: "Fim do tratamento",
  manual: "Manual",
};

const channelIcon = {
  whatsapp: MessageSquare,
  sms: Smartphone,
  email: Mail,
  task: ListTodo,
};

const templates: { name: string; description: string; trigger: Journey["trigger_event"]; steps: { delay_hours: number; channel: Step["channel"]; template: string }[] }[] = [
  {
    name: "Boas-vindas + 1ª consulta",
    description: "Acolhimento do paciente novo",
    trigger: "first_visit",
    steps: [
      { delay_hours: 0, channel: "whatsapp", template: "Olá {{nome}}! Que bom ter você na nossa clínica. Qualquer dúvida estamos por aqui." },
      { delay_hours: 24, channel: "email", template: "Obrigado pela visita. Como foi sua experiência? Responda em 1 minuto." },
    ],
  },
  {
    name: "Aniversário do paciente",
    description: "Mensagem carinhosa no dia",
    trigger: "birthday",
    steps: [{ delay_hours: 0, channel: "whatsapp", template: "Feliz aniversário, {{nome}}! Desejamos um ano de muita saúde. 🎂" }],
  },
  {
    name: "Recall 6 meses",
    description: "Lembrete de retorno após consulta",
    trigger: "appointment_completed",
    steps: [
      { delay_hours: 4320, channel: "whatsapp", template: "Olá {{nome}}! Já se passaram 6 meses da sua última visita. Que tal agendar seu retorno?" },
      { delay_hours: 4488, channel: "sms", template: "Lembrete: agende seu retorno em {{slug_link}}." },
    ],
  },
  {
    name: "Recuperação de falta",
    description: "Reagenda paciente que faltou",
    trigger: "no_show",
    steps: [
      { delay_hours: 2, channel: "whatsapp", template: "Olá {{nome}}, sentimos sua falta hoje. Quer remarcar para outro dia?" },
      { delay_hours: 48, channel: "task", template: "Ligar para {{nome}} e oferecer encaixe na agenda" },
    ],
  },
];

function Page() {
  const fetchAll = useServerFn(listJourneys);
  const save = useServerFn(saveJourney);
  const addStep = useServerFn(addJourneyStep);
  const toggle = useServerFn(toggleJourney);
  const qc = useQueryClient();
  const { data = [] } = useQuery<Journey[]>({ queryKey: ["journeys"], queryFn: () => fetchAll() as Promise<Journey[]> });
  const [f, setF] = useState<{ name: string; description: string; trigger_event: Journey["trigger_event"] }>({
    name: "", description: "", trigger_event: "appointment_completed",
  });
  const [stepForm, setStepForm] = useState<Record<string, { delay_hours: string; channel: Step["channel"]; template: string }>>({});

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...f, active: false } }),
    onSuccess: () => {
      toast.success("Jornada criada");
      setF({ name: "", description: "", trigger_event: "appointment_completed" });
      qc.invalidateQueries({ queryKey: ["journeys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stepM = useMutation({
    mutationFn: (data: { journey_id: string; step_order: number; delay_hours: number; channel: Step["channel"]; template: string }) => addStep({ data }),
    onSuccess: () => { toast.success("Passo adicionado"); qc.invalidateQueries({ queryKey: ["journeys"] }); },
  });

  const togM = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggle({ data: { id, active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journeys"] }),
  });

  async function useTemplate(tpl: typeof templates[number]) {
    const created = await save({ data: { name: tpl.name, description: tpl.description, trigger_event: tpl.trigger, active: false } });
    for (let i = 0; i < tpl.steps.length; i++) {
      const s = tpl.steps[i];
      await addStep({ data: { journey_id: created.id, step_order: i, delay_hours: s.delay_hours, channel: s.channel, template: s.template } });
    }
    toast.success("Jornada criada a partir do template");
    qc.invalidateQueries({ queryKey: ["journeys"] });
  }

  function formatDelay(h: number) {
    if (h === 0) return "imediato";
    if (h < 24) return `${h}h`;
    if (h < 168) return `${Math.round(h / 24)}d`;
    if (h < 720) return `${Math.round(h / 168)}sem`;
    return `${Math.round(h / 720)}m`;
  }

  const totalActive = data.filter((j) => j.active).length;
  const totalSteps = data.reduce((s, j) => s + (j.journey_steps?.length ?? 0), 0);

  return (
    <SimplePage onboardingSection="jornadas" title="Jornadas do paciente" description="Automatize sequências de mensagens: lembretes, recall, pós-atendimento, aniversário e mais.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={Workflow} label="Jornadas criadas" value={String(data.length)} />
        <Kpi icon={Power} label="Ativas" value={String(totalActive)} tone="success" />
        <Kpi icon={Activity} label="Passos configurados" value={String(totalSteps)} />
        <Kpi icon={Sparkles} label="Templates prontos" value={String(templates.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="space-y-4 self-start">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-semibold flex items-center gap-2"><Workflow className="h-4 w-4" /> Nova jornada</h2>
            <div className="mt-4 space-y-3">
              <Field label="Nome"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ex: Recall 6 meses" className={inputCls} /></Field>
              <Field label="Descrição"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="O que essa jornada faz?" rows={2} className={inputCls} /></Field>
              <Field label="Gatilho"><select value={f.trigger_event} onChange={(e) => setF({ ...f, trigger_event: e.target.value as Journey["trigger_event"] })} className={inputCls}>
                {Object.entries(triggerLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></Field>
              <button onClick={() => saveM.mutate()} disabled={!f.name || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {saveM.isPending ? "Salvando..." : "Criar jornada vazia"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="font-semibold flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-primary" /> Templates prontos</h3>
            <p className="mt-1 text-xs text-muted-foreground">Comece em 1 clique com fluxos testados.</p>
            <div className="mt-3 space-y-2">
              {templates.map((t) => (
                <button
                  key={t.name}
                  onClick={() => useTemplate(t)}
                  className="w-full text-left rounded-lg border border-border bg-background p-3 hover:border-primary/40 hover:bg-accent/10 transition"
                >
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description} · {t.steps.length} passo(s)</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Journeys list */}
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-10 text-center">
              <Workflow className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhuma jornada criada</p>
              <p className="text-xs text-muted-foreground mt-1">Use um template ou crie uma jornada vazia no painel ao lado.</p>
            </div>
          ) : (
            data.map((j) => {
              const steps = (j.journey_steps ?? []).slice().sort((a, b) => a.step_order - b.step_order);
              return (
                <div key={j.id} className="rounded-2xl border border-border bg-surface-elevated p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{j.name}</p>
                      {j.description && <p className="text-xs text-muted-foreground mt-0.5">{j.description}</p>}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] uppercase font-semibold">{triggerLabels[j.trigger_event]}</span>
                        <span>{steps.length} passo(s)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => togM.mutate({ id: j.id, active: !j.active })}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${j.active ? "bg-success/15 text-success" : "border border-border"}`}
                    ><Power className="h-3 w-3" /> {j.active ? "Ativa" : "Pausada"}</button>
                  </div>

                  {/* Timeline */}
                  {steps.length > 0 && (
                    <div className="mt-4 relative pl-6 border-l-2 border-dashed border-border space-y-3">
                      {steps.map((s) => {
                        const Icon = channelIcon[s.channel];
                        return (
                          <div key={s.id} className="relative">
                            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                              <Icon className="h-3 w-3 text-primary" />
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3">
                              <div className="flex items-center gap-2 text-xs mb-1">
                                <span className="font-mono text-muted-foreground">{formatDelay(s.delay_hours)}</span>
                                <span className="text-[10px] uppercase font-semibold rounded bg-accent/20 px-1.5 py-0.5">{s.channel}</span>
                              </div>
                              <p className="text-sm">{s.template}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add step inline */}
                  <div className="mt-4 rounded-lg border border-dashed border-border p-3 grid gap-2 md:grid-cols-[80px_120px_1fr_auto]">
                    <input
                      placeholder="Horas"
                      value={stepForm[j.id]?.delay_hours || ""}
                      onChange={(e) => setStepForm({ ...stepForm, [j.id]: { delay_hours: e.target.value, channel: stepForm[j.id]?.channel || "whatsapp", template: stepForm[j.id]?.template || "" } })}
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <select
                      value={stepForm[j.id]?.channel || "whatsapp"}
                      onChange={(e) => setStepForm({ ...stepForm, [j.id]: { delay_hours: stepForm[j.id]?.delay_hours || "0", channel: e.target.value as Step["channel"], template: stepForm[j.id]?.template || "" } })}
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">E-mail</option><option value="task">Tarefa</option>
                    </select>
                    <input
                      placeholder="Mensagem ou tarefa..."
                      value={stepForm[j.id]?.template || ""}
                      onChange={(e) => setStepForm({ ...stepForm, [j.id]: { delay_hours: stepForm[j.id]?.delay_hours || "0", channel: stepForm[j.id]?.channel || "whatsapp", template: e.target.value } })}
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => {
                        const s = stepForm[j.id];
                        if (!s?.template) return;
                        stepM.mutate({ journey_id: j.id, step_order: steps.length, delay_hours: parseInt(s.delay_hours) || 0, channel: s.channel, template: s.template });
                        setStepForm({ ...stepForm, [j.id]: { delay_hours: "", channel: "whatsapp", template: "" } });
                      }}
                      className="rounded bg-primary px-3 py-1.5 text-primary-foreground inline-flex items-center gap-1 text-sm"
                    ><Plus className="h-3 w-3" /> Add</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </SimplePage>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Workflow; label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${tone === "success" ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}
