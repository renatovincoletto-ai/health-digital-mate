import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getPublicAgendaData,
  getBookedSlots,
  createPublicAppointment,
} from "@/lib/agenda-public.functions";

export const Route = createFileRoute("/s/$slug/agendar")({
  loader: async ({ params }) => {
    const data = await getPublicAgendaData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Agendar consulta · ${loaderData?.tenant.display_name ?? ""}` },
      { name: "description", content: `Agende sua consulta online com ${loaderData?.tenant.display_name ?? ""}.` },
    ],
  }),
  component: BookingPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Página de agendamento não encontrada.</p>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Erro ao carregar agendamento.</p>
    </div>
  ),
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function BookingPage() {
  const data = Route.useLoaderData();
  const { tenant, professionals, services, rules, blocks } = data;
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [proId, setProId] = useState<string>(professionals[0]?.id ?? "");
  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [slot, setSlot] = useState<Date | null>(null);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", patient_email: "", patient_notes: "" });
  const [done, setDone] = useState(false);

  const service = services.find((s: any) => s.id === serviceId);
  const duration = service?.duration_minutes ?? 30;

  const bookedFn = useServerFn(getBookedSlots);
  const createFn = useServerFn(createPublicAppointment);

  const weekStart = useMemo(() => {
    const x = new Date(day); x.setDate(day.getDate() - day.getDay()); return startOfDay(x);
  }, [day]);

  const { data: booked = [], isFetching: loadingBooked } = useQuery({
    queryKey: ["booked", tenant.id, proId, weekStart.toISOString()],
    enabled: !!proId,
    queryFn: () => bookedFn({
      data: {
        tenant_id: tenant.id,
        professional_id: proId,
        from: weekStart.toISOString(),
        to: addDays(weekStart, 7).toISOString(),
      },
    }),
  });

  const slots = useMemo(() => buildSlots({
    day, duration, rules, blocks, booked, proId,
  }), [day, duration, rules, blocks, booked, proId]);

  const create = useMutation({
    mutationFn: () => createFn({
      data: {
        tenant_id: tenant.id,
        professional_id: proId,
        service_id: serviceId,
        starts_at: slot!.toISOString(),
        ends_at: new Date(slot!.getTime() + duration * 60_000).toISOString(),
        ...form,
      },
    }),
    onSuccess: () => setDone(true),
    onError: (e: any) => toast.error(e.message ?? "Erro ao agendar"),
  });

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-page max-w-xl py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="font-display text-3xl font-semibold">Agendamento solicitado!</h1>
          <p className="mt-3 text-muted-foreground">
            Você receberá uma confirmação em breve. Em caso de dúvida, entre em contato pelo WhatsApp.
          </p>
          <Link to="/s/$slug" params={{ slug: tenant.slug }} className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container-page flex items-center justify-between py-4">
          <Link to="/s/$slug" params={{ slug: tenant.slug }} className="text-sm text-muted-foreground hover:text-foreground">
            ← {tenant.display_name}
          </Link>
        </div>
      </header>

      <div className="container-page max-w-3xl py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agendamento online</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Agende sua consulta</h1>
        <p className="mt-1.5 text-muted-foreground">Escolha o serviço, profissional e horário.</p>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">1. Serviço</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    serviceId === s.id ? "border-primary bg-primary/5" : "border-border bg-surface-elevated hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.duration_minutes} min{s.price_cents != null && ` · R$ ${(s.price_cents / 100).toFixed(2)}`}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">2. Profissional</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {professionals.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setProId(p.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                    proId === p.id ? "border-primary bg-primary/5" : "border-border bg-surface-elevated hover:border-primary/50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    {p.specialty && <p className="text-xs text-muted-foreground">{p.specialty}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">3. Horário</h2>
            <div className="mb-3 flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center text-sm font-medium">
                {day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </div>
              <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {loadingBooked ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem horários disponíveis nesta data.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((s) => {
                  const sel = slot?.getTime() === s.getTime();
                  return (
                    <button
                      key={s.toISOString()}
                      onClick={() => setSlot(s)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-elevated hover:border-primary/50"
                      }`}
                    >
                      {s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {slot && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">4. Seus dados</h2>
              <div className="space-y-3">
                <div>
                  <Label>Nome completo *</Label>
                  <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>WhatsApp *</Label>
                    <Input value={form.patient_phone} placeholder="(11) 99999-9999" onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.patient_email} onChange={(e) => setForm({ ...form, patient_email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={3} value={form.patient_notes} onChange={(e) => setForm({ ...form, patient_notes: e.target.value })} />
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={create.isPending || !form.patient_name || !form.patient_phone}
                  onClick={() => create.mutate()}
                >
                  {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar agendamento
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function buildSlots(params: {
  day: Date;
  duration: number;
  rules: { professional_id: string; weekday: number; start_minute: number; end_minute: number }[];
  blocks: { professional_id: string; starts_at: string; ends_at: string }[];
  booked: { starts_at: string; ends_at: string }[];
  proId: string;
}): Date[] {
  const { day, duration, rules, blocks, booked, proId } = params;
  if (!proId) return [];
  const wd = day.getDay();
  const ruleList = rules.filter((r) => r.professional_id === proId && r.weekday === wd);
  if (ruleList.length === 0) return [];

  const dayStart = startOfDay(day);
  const now = new Date();
  const proBlocks = blocks
    .filter((b) => b.professional_id === proId)
    .map((b) => ({ s: new Date(b.starts_at), e: new Date(b.ends_at) }));
  const proBooked = booked.map((b) => ({ s: new Date(b.starts_at), e: new Date(b.ends_at) }));

  const out: Date[] = [];
  for (const rule of ruleList) {
    for (let m = rule.start_minute; m + duration <= rule.end_minute; m += 30) {
      const start = new Date(dayStart.getTime() + m * 60_000);
      const end = new Date(start.getTime() + duration * 60_000);
      if (start <= now) continue;
      const overlaps = [...proBlocks, ...proBooked].some(
        ({ s, e }) => start < e && end > s,
      );
      if (!overlaps) out.push(start);
    }
  }
  return out;
}
