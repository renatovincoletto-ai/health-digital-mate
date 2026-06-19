import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Users,
  Wrench,
  Clock,
  Plug,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  listProfessionals,
  saveProfessional,
  deleteProfessional,
  listServices,
  saveService,
  deleteService,
  listAvailabilityRules,
  replaceAvailabilityRules,
  listAppointments,
  saveAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/lib/agenda.functions";
import { getMyTenant } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function AgendaPage() {
  const tenantFn = useServerFn(getMyTenant);
  const { data: tenant } = useQuery({ queryKey: ["my-tenant"], queryFn: () => tenantFn() });

  return (
    <AppShell>
      <div className="container-page py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agenda</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Gestão da agenda
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Profissionais, serviços, horários e agendamentos do consultório.
          </p>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" />Calendário</TabsTrigger>
            <TabsTrigger value="pros"><Users className="mr-2 h-4 w-4" />Profissionais</TabsTrigger>
            <TabsTrigger value="services"><Wrench className="mr-2 h-4 w-4" />Serviços</TabsTrigger>
            <TabsTrigger value="hours"><Clock className="mr-2 h-4 w-4" />Horários</TabsTrigger>
            <TabsTrigger value="integrations"><Plug className="mr-2 h-4 w-4" />Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar"><CalendarTab tenantSlug={tenant?.slug} /></TabsContent>
          <TabsContent value="pros"><ProfessionalsTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
          <TabsContent value="hours"><HoursTab /></TabsContent>
          <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ============= CALENDAR =============
type ViewMode = "day" | "week" | "month" | "range";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseInputDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function fmtLong(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function CalendarTab({ tenantSlug }: { tenantSlug?: string }) {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [rangeStart, setRangeStart] = useState<Date>(() => startOfDay(new Date()));
  const [rangeEnd, setRangeEnd] = useState<Date>(() => addDays(startOfDay(new Date()), 30));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const listFn = useServerFn(listAppointments);
  const prosFn = useServerFn(listProfessionals);
  const svcsFn = useServerFn(listServices);
  const saveFn = useServerFn(saveAppointment);
  const delFn = useServerFn(deleteAppointment);
  const statusFn = useServerFn(updateAppointmentStatus);

  const { from, to, label } = useMemo(() => {
    if (view === "day") {
      const f = startOfDay(anchor);
      const t = addDays(f, 1);
      return { from: f, to: t, label: fmtLong(f) };
    }
    if (view === "week") {
      const f = startOfWeek(anchor);
      const t = addDays(f, 7);
      return { from: f, to: t, label: `${fmtDate(f)} — ${fmtDate(addDays(f, 6))}` };
    }
    if (view === "month") {
      const f = startOfMonth(anchor);
      const t = endOfMonth(anchor);
      return {
        from: f, to: t,
        label: anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      };
    }
    const f = startOfDay(rangeStart);
    const t = addDays(startOfDay(rangeEnd), 1);
    return { from: f, to: t, label: `${fmtLong(f)} — ${fmtLong(rangeEnd)}` };
  }, [view, anchor, rangeStart, rangeEnd]);

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ["appts", from.toISOString(), to.toISOString()],
    queryFn: () => listFn({ data: { from: from.toISOString(), to: to.toISOString() } }),
  });
  const { data: pros = [] } = useQuery({ queryKey: ["pros"], queryFn: () => prosFn() });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => svcsFn() });

  const save = useMutation({
    mutationFn: (d: any) => saveFn({ data: d }),
    onSuccess: () => {
      toast.success("Agendamento salvo");
      queryClient.invalidateQueries({ queryKey: ["appts"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      queryClient.invalidateQueries({ queryKey: ["appts"] });
      setOpen(false);
      setEditing(null);
    },
  });
  const changeStatus = useMutation({
    mutationFn: (v: { id: string; status: any }) => statusFn({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appts"] }),
  });

  const apptsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of appts) {
      const k = new Date(a.starts_at).toDateString();
      (map[k] ??= []).push(a);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }
    return map;
  }, [appts]);

  function shift(dir: -1 | 1) {
    if (view === "day") setAnchor(addDays(anchor, dir));
    else if (view === "week") setAnchor(addDays(anchor, 7 * dir));
    else if (view === "month") setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
    else {
      const days = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1);
      setRangeStart(addDays(rangeStart, days * dir));
      setRangeEnd(addDays(rangeEnd, days * dir));
    }
  }

  function quickRange(months: number) {
    const start = startOfDay(new Date());
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    setView("range");
    setRangeStart(start);
    setRangeEnd(end);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const today = startOfDay(new Date());
              setAnchor(today);
              if (view === "range") {
                setRangeStart(today);
                setRangeEnd(addDays(today, 30));
              }
            }}
          >
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Próximo">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm capitalize text-muted-foreground">{label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="range">Período</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => quickRange(Number(v))}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Próximos…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Próximo mês</SelectItem>
              <SelectItem value="3">Próximos 3 meses</SelectItem>
              <SelectItem value="6">Próximos 6 meses</SelectItem>
              <SelectItem value="12">Próximos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          {tenantSlug && (
            <a
              href={`/s/${tenantSlug}/agendar`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Página pública ↗
            </a>
          )}
          <Button
            onClick={() => {
              if (pros.length === 0) {
                toast.error("Cadastre um profissional primeiro");
                return;
              }
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo agendamento
          </Button>
        </div>
      </div>

      {view === "range" && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-elevated p-3">
          <div>
            <Label className="text-xs">De</Label>
            <Input
              type="date"
              value={toInputDate(rangeStart)}
              onChange={(e) => setRangeStart(parseInputDate(e.target.value))}
              className="w-44"
            />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input
              type="date"
              value={toInputDate(rangeEnd)}
              min={toInputDate(rangeStart)}
              onChange={(e) => setRangeEnd(parseInputDate(e.target.value))}
              className="w-44"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {appts.length} agendamento{appts.length === 1 ? "" : "s"} no período.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "day" ? (
        <DayView date={from} items={apptsByDay[from.toDateString()] ?? []} onPick={(a) => { setEditing(a); setOpen(true); }} />
      ) : view === "week" ? (
        <DaysGrid start={from} count={7} apptsByDay={apptsByDay} onPick={(a) => { setEditing(a); setOpen(true); }} columns={7} />
      ) : view === "month" ? (
        <MonthView monthAnchor={anchor} apptsByDay={apptsByDay} onPick={(a) => { setEditing(a); setOpen(true); }} />
      ) : (
        <RangeList from={from} to={to} apptsByDay={apptsByDay} onPick={(a) => { setEditing(a); setOpen(true); }} />
      )}

      <AppointmentDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        pros={pros}
        services={services}
        onSave={(d) => save.mutate(d)}
        onDelete={(id) => remove.mutate(id)}
        onChangeStatus={(id, s) => changeStatus.mutate({ id, status: s })}
        saving={save.isPending}
      />
    </div>
  );
}

function ApptCard({ a, onPick }: { a: any; onPick: (a: any) => void }) {
  return (
    <button
      onClick={() => onPick(a)}
      className="block w-full rounded-md border border-border/50 bg-background p-2 text-left text-xs hover:border-primary/50"
      style={{ borderLeftColor: a.professionals?.color ?? "#3B82F6", borderLeftWidth: 3 }}
    >
      <div className="font-medium">{fmtTime(a.starts_at)} · {a.patient_name}</div>
      <div className="truncate text-[10px] text-muted-foreground">
        {a.services?.name ?? "Consulta"} · {a.professionals?.full_name}
      </div>
      <div className="mt-1"><StatusBadge status={a.status} /></div>
    </button>
  );
}

function DaysGrid({
  start, count, apptsByDay, onPick, columns,
}: { start: Date; count: number; apptsByDay: Record<string, any[]>; onPick: (a: any) => void; columns: number }) {
  const cols = `grid-cols-1 md:grid-cols-${columns}`;
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => {
        const d = addDays(start, i);
        const k = d.toDateString();
        const items = apptsByDay[k] ?? [];
        const isToday = k === new Date().toDateString();
        return (
          <div
            key={k}
            className={`rounded-xl border p-3 ${isToday ? "border-primary bg-primary/5" : "border-border bg-surface-elevated"}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {WEEKDAYS[d.getDay()]} {d.getDate()}
              </span>
              {items.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
              )}
            </div>
            <div className="space-y-1.5">
              {items.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
              {items.map((a) => <ApptCard key={a.id} a={a} onPick={onPick} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ date, items, onPick }: { date: Date; items: any[]; onPick: (a: any) => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold capitalize">{fmtLong(date)}</h3>
        <Badge variant="secondary">{items.length} agendamento{items.length === 1 ? "" : "s"}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => <ApptCard key={a.id} a={a} onPick={onPick} />)}
        </div>
      )}
    </div>
  );
}

function MonthView({
  monthAnchor, apptsByDay, onPick,
}: { monthAnchor: Date; apptsByDay: Record<string, any[]>; onPick: (a: any) => void }) {
  const first = startOfMonth(monthAnchor);
  const gridStart = startOfWeek(first);
  const last = endOfMonth(monthAnchor);
  const totalDays = Math.ceil((last.getTime() - gridStart.getTime()) / 86400000);
  const weeks = Math.ceil(totalDays / 7);
  const cells = weeks * 7;
  const today = new Date().toDateString();
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
      <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-[11px] font-semibold uppercase text-muted-foreground">
        {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: cells }).map((_, i) => {
          const d = addDays(gridStart, i);
          const k = d.toDateString();
          const items = apptsByDay[k] ?? [];
          const inMonth = d.getMonth() === monthAnchor.getMonth();
          const isToday = k === today;
          return (
            <div
              key={k}
              className={`min-h-[110px] border-b border-r border-border p-1.5 ${inMonth ? "" : "bg-surface/50 text-muted-foreground"} ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
                <span className={isToday ? "text-primary" : ""}>{d.getDate()}</span>
                {items.length > 0 && <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onPick(a)}
                    className="block w-full truncate rounded bg-background px-1 py-0.5 text-left text-[10px] hover:bg-primary/10"
                    style={{ borderLeftColor: a.professionals?.color ?? "#3B82F6", borderLeftWidth: 2 }}
                  >
                    {fmtTime(a.starts_at)} {a.patient_name}
                  </button>
                ))}
                {items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{items.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RangeList({
  from, to, apptsByDay, onPick,
}: { from: Date; to: Date; apptsByDay: Record<string, any[]>; onPick: (a: any) => void }) {
  const days: Date[] = [];
  for (let d = new Date(from); d < to; d = addDays(d, 1)) {
    if ((apptsByDay[d.toDateString()] ?? []).length > 0) days.push(new Date(d));
  }
  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated p-8 text-center text-sm text-muted-foreground">
        Nenhum agendamento neste período.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <div key={d.toDateString()} className="rounded-xl border border-border bg-surface-elevated p-4">
          <h3 className="mb-2 text-sm font-semibold capitalize">{fmtLong(d)}</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {(apptsByDay[d.toDateString()] ?? []).map((a) => (
              <ApptCard key={a.id} a={a} onPick={onPick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    confirmed: "bg-emerald-500/10 text-emerald-600",
    waiting_room: "bg-amber-500/10 text-amber-600",
    in_service: "bg-blue-500/10 text-blue-600",
    cancelled: "bg-red-500/10 text-red-600",
    no_show: "bg-orange-500/10 text-orange-600",
    completed: "bg-violet-500/10 text-violet-600",
  };
  const labels: Record<string, string> = {
    pending: "pendente",
    confirmed: "confirmado",
    waiting_room: "sala de espera",
    in_service: "em atendimento",
    cancelled: "cancelado",
    no_show: "faltou",
    completed: "concluído",
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: any;
  pros: any[];
  services: any[];
  onSave: (d: any) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, s: string) => void;
  saving: boolean;
}
function AppointmentDialog({
  open, onOpenChange, editing, pros, services, onSave, onDelete, saving,
}: AppointmentDialogProps) {
  const [form, setForm] = useState<any>({});

  // reset when opening/editing changes
  useMemo(() => {
    if (open) {
      if (editing) {
        setForm({
          ...editing,
          starts_at: new Date(editing.starts_at).toISOString().slice(0, 16),
        });
      } else {
        const d = new Date();
        d.setMinutes(0, 0, 0);
        d.setHours(d.getHours() + 1);
        setForm({
          professional_id: pros[0]?.id ?? "",
          service_id: services[0]?.id ?? "",
          patient_name: "",
          patient_phone: "",
          patient_email: "",
          starts_at: d.toISOString().slice(0, 16),
          status: "confirmed",
        });
      }
    }
  }, [open, editing]);

  function submit() {
    const service = services.find((s: any) => s.id === form.service_id);
    const duration = service?.duration_minutes ?? 30;
    const start = new Date(form.starts_at);
    const end = new Date(start.getTime() + duration * 60_000);
    onSave({
      ...form,
      service_id: form.service_id || null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Profissional</Label>
              <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pros.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serviço</Label>
              <Select value={form.service_id ?? ""} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                <SelectTrigger><SelectValue placeholder="Consulta" /></SelectTrigger>
                <SelectContent>
                  {services.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Paciente *</Label>
            <Input value={form.patient_name ?? ""} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>WhatsApp *</Label>
              <Input value={form.patient_phone ?? ""} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.patient_email ?? ""} onChange={(e) => setForm({ ...form, patient_email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início *</Label>
              <Input type="datetime-local" value={form.starts_at ?? ""} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "confirmed"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="no_show">Não compareceu</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notas internas</Label>
            <Textarea rows={3} value={form.internal_notes ?? ""} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {editing ? (
            <Button variant="ghost" size="sm" onClick={() => onDelete(editing.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= PROFESSIONALS =============
function ProfessionalsTab() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listProfessionals);
  const saveFn = useServerFn(saveProfessional);
  const delFn = useServerFn(deleteProfessional);
  const { data = [] } = useQuery({ queryKey: ["pros"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const save = useMutation({
    mutationFn: (d: any) => saveFn({ data: d }),
    onSuccess: () => {
      toast.success("Profissional salvo");
      queryClient.invalidateQueries({ queryKey: ["pros"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      queryClient.invalidateQueries({ queryKey: ["pros"] });
    },
  });

  function openNew() {
    setEditing(null);
    setForm({ full_name: "", color: "#3B82F6", is_active: true });
    setOpen(true);
  }
  function openEdit(p: any) {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo profissional</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado ainda.</p>
        )}
        {data.map((p: any) => (
          <div key={p.id} className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                  <p className="font-medium">{p.full_name}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.specialty} {p.council_type && `· ${p.council_type} ${p.council_number}`}
                </p>
                {!p.is_active && <Badge variant="outline" className="mt-2">Inativo</Badge>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm("Remover este profissional?")) remove.mutate(p.id);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} profissional</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome completo *</Label>
              <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Especialidade</Label>
                <Input value={form.specialty ?? ""} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
              <div>
                <Label>Cor da agenda</Label>
                <Input type="color" value={form.color ?? "#3B82F6"} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Conselho</Label>
                <Input placeholder="CRM" value={form.council_type ?? ""} onChange={(e) => setForm({ ...form, council_type: e.target.value })} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.council_number ?? ""} onChange={(e) => setForm({ ...form, council_number: e.target.value })} />
              </div>
              <div>
                <Label>UF</Label>
                <Input maxLength={2} value={form.council_state ?? ""} onChange={(e) => setForm({ ...form, council_state: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo (aparece na agenda pública)</Label>
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

// ============= SERVICES =============
function ServicesTab() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listServices);
  const saveFn = useServerFn(saveService);
  const delFn = useServerFn(deleteService);
  const { data = [] } = useQuery({ queryKey: ["services"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const save = useMutation({
    mutationFn: (d: any) => saveFn({ data: d }),
    onSuccess: () => {
      toast.success("Serviço salvo");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  function openNew() {
    setEditing(null);
    setForm({ name: "", duration_minutes: 30, color: "#10B981", is_active: true, is_public: true, requires_deposit: false });
    setOpen(true);
  }
  function openEdit(s: any) {
    setEditing(s);
    setForm({ ...s, price_cents: s.price_cents ?? "" });
    setOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo serviço</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
        )}
        {data.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                  <p className="font-medium">{s.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.duration_minutes} min
                  {s.price_cents != null && ` · R$ ${(s.price_cents / 100).toFixed(2)}`}
                </p>
                <div className="mt-2 flex gap-1">
                  {!s.is_public && <Badge variant="outline" className="text-[10px]">Privado</Badge>}
                  {!s.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm("Remover este serviço?")) remove.mutate(s.id);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} serviço</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Duração (min) *</Label>
                <Input type="number" min={5} max={600} value={form.duration_minutes ?? 30} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={form.price_cents !== "" && form.price_cents != null ? (form.price_cents / 100).toString() : ""} onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, price_cents: v === "" ? null : Math.round(Number(v) * 100) });
                }} />
              </div>
              <div>
                <Label>Cor</Label>
                <Input type="color" value={form.color ?? "#10B981"} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_public ?? true} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
              <Label>Visível na página pública</Label>
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

// ============= HOURS =============
function HoursTab() {
  const queryClient = useQueryClient();
  const prosFn = useServerFn(listProfessionals);
  const rulesFn = useServerFn(listAvailabilityRules);
  const saveFn = useServerFn(replaceAvailabilityRules);
  const { data: pros = [] } = useQuery({ queryKey: ["pros"], queryFn: () => prosFn() });
  const { data: rules = [] } = useQuery({ queryKey: ["rules"], queryFn: () => rulesFn() });
  const [selected, setSelected] = useState<string>("");

  const proId = selected || pros[0]?.id;
  const myRules = useMemo(
    () => rules.filter((r: any) => r.professional_id === proId),
    [rules, proId],
  );

  const [draft, setDraft] = useState<Record<number, { start: string; end: string; on: boolean }>>({});

  useMemo(() => {
    const init: Record<number, { start: string; end: string; on: boolean }> = {};
    for (let i = 0; i < 7; i++) {
      const rule = myRules.find((r: any) => r.weekday === i);
      init[i] = rule
        ? { start: minToStr(rule.start_minute), end: minToStr(rule.end_minute), on: true }
        : { start: "09:00", end: "18:00", on: false };
    }
    setDraft(init);
  }, [proId, rules]);

  const save = useMutation({
    mutationFn: () => {
      const ruleList = Object.entries(draft)
        .filter(([, v]) => v.on)
        .map(([wd, v]) => ({
          weekday: Number(wd),
          start_minute: strToMin(v.start),
          end_minute: strToMin(v.end),
        }));
      return saveFn({ data: { professional_id: proId, rules: ruleList } });
    },
    onSuccess: () => {
      toast.success("Horários salvos");
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (pros.length === 0) {
    return <p className="text-sm text-muted-foreground">Cadastre profissionais primeiro.</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <Label>Profissional</Label>
        <Select value={proId} onValueChange={setSelected}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {pros.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 rounded-xl border border-border bg-surface-elevated p-4">
        {WEEKDAYS.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <Switch
              checked={draft[i]?.on ?? false}
              onCheckedChange={(v) => setDraft({ ...draft, [i]: { ...draft[i], on: v } })}
            />
            <span className="w-12 text-sm font-medium">{label}</span>
            <Input
              type="time" className="w-32"
              disabled={!draft[i]?.on}
              value={draft[i]?.start ?? "09:00"}
              onChange={(e) => setDraft({ ...draft, [i]: { ...draft[i], start: e.target.value } })}
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="time" className="w-32"
              disabled={!draft[i]?.on}
              value={draft[i]?.end ?? "18:00"}
              onChange={(e) => setDraft({ ...draft, [i]: { ...draft[i], end: e.target.value } })}
            />
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar horários
      </Button>
    </div>
  );
}

function minToStr(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}
function strToMin(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

// ============= INTEGRATIONS =============
function IntegrationsTab() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="font-display text-lg font-semibold">Google Calendar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sincronização bidirecional por profissional. Cada profissional conecta a própria conta Google.
        </p>
        <Button variant="outline" className="mt-3" disabled>
          <Plug className="mr-2 h-4 w-4" /> Conectar (em breve)
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Para ativar, conecte o OAuth do Google na próxima onda do projeto.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="font-display text-lg font-semibold">Microsoft Outlook</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sincronização com Microsoft 365 / Outlook Calendar.
        </p>
        <Button variant="outline" className="mt-3" disabled>
          <Plug className="mr-2 h-4 w-4" /> Conectar (em breve)
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="font-display text-lg font-semibold">WhatsApp Business</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirmações automáticas 24h e 2h antes, lembrete pós-consulta e respostas com IA.
        </p>
        <Button variant="outline" className="mt-3" disabled>
          <Plug className="mr-2 h-4 w-4" /> Conectar (em breve)
        </Button>
      </div>
    </div>
  );
}
