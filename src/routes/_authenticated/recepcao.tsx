import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Clock, CheckCircle2, XCircle, UserCheck, Stethoscope, Users, Plus, Trash2,
  Phone, AlertTriangle, Calendar, Loader2, ArrowRight, Zap, MessageCircle, Send,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listTodayAppointments, setAppointmentReceptionStatus,
  listWaitlist, saveWaitlist, deleteWaitlist,
  createRecurringAppointments,
} from "@/lib/wave2.functions";
import { listProfessionals, listServices } from "@/lib/agenda.functions";

export const Route = createFileRoute("/_authenticated/recepcao")({
  component: RecepcaoPage,
});

const STATUS_COLS = [
  { key: "confirmed", label: "Confirmados", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
  { key: "waiting_room", label: "Sala de espera", icon: Clock, color: "text-amber-600 bg-amber-500/10" },
  { key: "in_service", label: "Em atendimento", icon: Stethoscope, color: "text-blue-600 bg-blue-500/10" },
  { key: "completed", label: "Concluídos", icon: UserCheck, color: "text-violet-600 bg-violet-500/10" },
] as const;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function RecepcaoPage() {
  return (
    <AppShell>
      <div className="container-page py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recepção</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Sala de espera & lista de espera
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Controle o fluxo dos pacientes do dia e mantenha a lista de espera ativa.
          </p>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="today"><Clock className="mr-2 h-4 w-4" />Hoje</TabsTrigger>
            <TabsTrigger value="waitlist"><Users className="mr-2 h-4 w-4" />Lista de espera</TabsTrigger>
            <TabsTrigger value="recurring"><Calendar className="mr-2 h-4 w-4" />Recorrente</TabsTrigger>
          </TabsList>

          <TabsContent value="today"><TodayBoard /></TabsContent>
          <TabsContent value="waitlist"><WaitlistTab /></TabsContent>
          <TabsContent value="recurring"><RecurringTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ============ HOJE — KANBAN ============
function TodayBoard() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTodayAppointments);
  const statusFn = useServerFn(setAppointmentReceptionStatus);
  const { data = [], isLoading } = useQuery({ queryKey: ["today-appts"], queryFn: () => listFn() });

  const change = useMutation({
    mutationFn: (v: { id: string; status: any }) => statusFn({ data: v }),
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["today-appts"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const byStatus = useMemo(() => {
    const m: Record<string, any[]> = {};
    STATUS_COLS.forEach(c => m[c.key] = []);
    m["pending"] = [];
    for (const a of data) (m[a.status] ??= []).push(a);
    return m;
  }, [data]);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const total = data.length;
  const noShow = data.filter((a: any) => a.status === "no_show").length;
  const completed = data.filter((a: any) => a.status === "completed").length;

  return (
    <div>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Kpi label="Agendamentos hoje" value={String(total)} />
        <Kpi label="Sala de espera" value={String(byStatus["waiting_room"].length)} tone="warning" />
        <Kpi label="Em atendimento" value={String(byStatus["in_service"].length)} tone="info" />
        <Kpi label="Concluídos / faltas" value={`${completed} / ${noShow}`} tone="success" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_COLS.map((col) => {
          const items = byStatus[col.key];
          return (
            <div key={col.key} className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 place-items-center rounded-md ${col.color}`}>
                    <col.icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-semibold">{col.label}</h3>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                {items.map((a: any) => (
                  <ApptCard key={a.id} appt={a} onChange={(s) => change.mutate({ id: a.id, status: s })} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApptCard({ appt, onChange }: { appt: any; onChange: (s: string) => void }) {
  const next: Record<string, { label: string; status: string }[]> = {
    pending: [{ label: "Confirmar", status: "confirmed" }, { label: "Cancelar", status: "cancelled" }],
    confirmed: [{ label: "Chegou", status: "waiting_room" }, { label: "Faltou", status: "no_show" }],
    waiting_room: [{ label: "Iniciar", status: "in_service" }],
    in_service: [{ label: "Concluir", status: "completed" }],
    completed: [],
  };
  const actions = next[appt.status] ?? [];

  return (
    <div className="rounded-lg border border-border/70 bg-background p-3 text-sm" style={{ borderLeftColor: appt.professionals?.color ?? "#3B82F6", borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between">
        <span className="font-medium tabular-nums">{fmtTime(appt.starts_at)}</span>
        <span className="text-xs text-muted-foreground">{appt.services?.duration_minutes ?? 30} min</span>
      </div>
      <p className="mt-1 font-medium truncate">{appt.patient_name}</p>
      <p className="text-xs text-muted-foreground truncate">
        {appt.services?.name ?? "Consulta"} · {appt.professionals?.full_name}
      </p>
      {appt.patient_phone && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{appt.patient_phone}</p>
      )}
      {actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {actions.map((a) => (
            <Button key={a.status} size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChange(a.status)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "info" }) {
  const color = tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : tone === "info" ? "text-blue-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

// ============ LISTA DE ESPERA ============
function WaitlistTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listWaitlist);
  const saveFn = useServerFn(saveWaitlist);
  const delFn = useServerFn(deleteWaitlist);
  const prosFn = useServerFn(listProfessionals);
  const svcsFn = useServerFn(listServices);

  const { data = [], isLoading } = useQuery({ queryKey: ["waitlist"], queryFn: () => listFn() });
  const { data: pros = [] } = useQuery({ queryKey: ["pros"], queryFn: () => prosFn() });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => svcsFn() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const save = useMutation({
    mutationFn: (d: any) => saveFn({ data: d }),
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["waitlist"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["waitlist"] }); },
  });

  const priorityBadge = (p: string) => {
    const map: any = { urgent: "bg-red-500/15 text-red-600", high: "bg-orange-500/15 text-orange-600", normal: "bg-muted text-muted-foreground", low: "bg-muted/50 text-muted-foreground" };
    return <Badge className={map[p] ?? ""}>{p}</Badge>;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Pacientes aguardando vaga</h2>
          <p className="text-sm text-muted-foreground">Encaixe quando uma janela abrir na agenda.</p>
        </div>
        <Button onClick={() => { setForm({ priority: "normal", status: "waiting" }); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhum paciente na lista</p>
          <p className="mt-1 text-sm text-muted-foreground">Adicione quem está aguardando vaga para preencher buracos da agenda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Paciente</th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-left">Profissional / Serviço</th>
                <th className="px-4 py-3 text-left">Prioridade</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((w: any) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{w.patient_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.patient_phone || w.patient_email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {w.professionals?.full_name ?? "Qualquer"} · {w.services?.name ?? "Consulta"}
                  </td>
                  <td className="px-4 py-3">{priorityBadge(w.priority)}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{w.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setForm(w); setOpen(true); }}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(w.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar" : "Novo"} item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Paciente *</Label>
              <Input value={form.patient_name ?? ""} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.patient_phone ?? ""} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.patient_email ?? ""} onChange={(e) => setForm({ ...form, patient_email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Profissional</Label>
                <Select value={form.professional_id ?? ""} onValueChange={(v) => setForm({ ...form, professional_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    {pros.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select value={form.service_id ?? ""} onValueChange={(v) => setForm({ ...form, service_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority ?? "normal"} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status ?? "waiting"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Aguardando</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="dropped">Desistiu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ RECORRENTE ============
function RecurringTab() {
  const recFn = useServerFn(createRecurringAppointments);
  const prosFn = useServerFn(listProfessionals);
  const svcsFn = useServerFn(listServices);
  const qc = useQueryClient();
  const { data: pros = [] } = useQuery({ queryKey: ["pros"], queryFn: () => prosFn() });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => svcsFn() });
  const [form, setForm] = useState<any>({
    frequency: "weekly", occurrences: 4, duration_minutes: 30,
    starts_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });

  const create = useMutation({
    mutationFn: (d: any) => recFn({ data: d }),
    onSuccess: (r: any) => {
      toast.success(`${r.count} agendamentos criados`);
      qc.invalidateQueries({ queryKey: ["appts"] });
      qc.invalidateQueries({ queryKey: ["today-appts"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  function submit() {
    if (!form.professional_id) return toast.error("Escolha um profissional");
    if (!form.patient_name) return toast.error("Informe o paciente");
    create.mutate({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      occurrences: Number(form.occurrences),
      starts_at: new Date(form.starts_at).toISOString(),
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Sessões recorrentes</h2>
            <p className="text-sm text-muted-foreground">Crie um bloco de retornos automaticamente (ex.: 8 sessões de fisioterapia, semanal).</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Profissional *</Label>
            <Select value={form.professional_id ?? ""} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{pros.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Serviço</Label>
            <Select value={form.service_id ?? ""} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger><SelectValue placeholder="Consulta" /></SelectTrigger>
              <SelectContent>{services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Paciente *</Label>
            <Input value={form.patient_name ?? ""} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.patient_phone ?? ""} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.patient_email ?? ""} onChange={(e) => setForm({ ...form, patient_email: e.target.value })} />
          </div>
          <div>
            <Label>Primeira sessão *</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div>
            <Label>Duração (min)</Label>
            <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
          </div>
          <div>
            <Label>Frequência</Label>
            <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantas sessões</Label>
            <Input type="number" min={2} max={52} value={form.occurrences} onChange={(e) => setForm({ ...form, occurrences: e.target.value })} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-amber-500/10 p-3 text-sm">
          <span className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4" /> Conflitos de agenda não são checados automaticamente.</span>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar {form.occurrences} sessões <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
