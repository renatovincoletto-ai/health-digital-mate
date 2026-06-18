import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Calendar, Users, Wallet, Clock, TrendingUp, AlertTriangle, ArrowRight,
  ExternalLink, Loader2, CheckCircle2, ClipboardCheck, Stethoscope, Bell,
  Smile, Receipt,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getMyTenant } from "@/lib/tenant.functions";
import { getDashboardKpis } from "@/lib/wave2.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function DashboardPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const fetchKpis = useServerFn(getDashboardKpis);
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useQuery({ queryKey: ["my-tenant"], queryFn: () => fetchTenant() });
  const { data: kpis } = useQuery({ queryKey: ["dashboard-kpis"], queryFn: () => fetchKpis(), enabled: !!tenant });

  useEffect(() => { if (!isLoading && !tenant) navigate({ to: "/onboarding" }); }, [isLoading, tenant, navigate]);

  if (isLoading || !tenant) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <AppShell>
      <div className="container-page py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Painel</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Olá, {tenant.display_name.split(" ").slice(0, 2).join(" ")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tenant.specialty ? `${tenant.specialty} · ` : ""}{tenant.city ? `${tenant.city}${tenant.state ? `/${tenant.state}` : ""}` : "Brasil"}
            </p>
          </div>
          <a href={`/s/${tenant.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium hover:bg-accent/10">
            Ver site público <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* KPIs principais */}
        <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Calendar} label="Agendamentos hoje" value={String(kpis?.todayCount ?? "—")} sub={`${kpis?.monthCount ?? 0} no mês`} href="/agenda" tone="primary" />
          <KpiCard icon={Clock} label="Sala de espera agora" value={String(kpis?.waitingNow ?? "—")} sub={`${kpis?.waitlistCount ?? 0} na lista de espera`} href="/recepcao" tone="warning" />
          <KpiCard icon={Wallet} label="Receita do mês" value={kpis ? BRL(kpis.receitaMes) : "—"} sub={kpis ? `Saldo ${BRL(kpis.saldoMes)}` : "—"} href="/financeiro" tone="success" />
          <KpiCard icon={Users} label="Pacientes" value={String(kpis?.patientsCount ?? "—")} sub={`Ocupação ${kpis ? kpis.ocupacao.toFixed(0) : "—"}%`} href="/pacientes" tone="info" />
        </section>

        {/* KPIs secundários */}
        <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MiniKpi label="Receita hoje" value={kpis ? BRL(kpis.receitaHoje) : "—"} icon={Wallet} tone="default" />
          <MiniKpi label="Ticket médio" value={kpis ? BRL(kpis.ticketMedio) : "—"} icon={Receipt} tone="default" />
          <MiniKpi label="A receber no mês" value={kpis ? BRL(kpis.aReceberMes) : "—"} icon={TrendingUp} tone="warning" />
          <MiniKpi label="Taxa de falta" value={kpis ? `${kpis.taxaFalta.toFixed(1)}%` : "—"} icon={AlertTriangle} tone={kpis && kpis.taxaFalta > 15 ? "danger" : "default"} />
          <MiniKpi
            label={kpis?.npsScore == null ? "NPS (sem respostas)" : `NPS (${kpis.npsCount} resp.)`}
            value={kpis?.npsScore == null ? "—" : String(kpis.npsScore)}
            icon={Smile}
            tone={kpis?.npsScore == null ? "default" : kpis.npsScore >= 50 ? "default" : kpis.npsScore < 0 ? "danger" : "warning"}
          />
        </section>

        {/* Sparkline semanal */}
        {kpis && (
          <section className="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Agendamentos — últimos 7 dias</h2>
              <span className="text-xs text-muted-foreground">{kpis.weekly.reduce((s, d) => s + d.count, 0)} total</span>
            </div>
            <Sparkline data={kpis.weekly} />
          </section>
        )}

        {/* Agenda de hoje */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">Agenda de hoje</h2>
                <p className="text-xs text-muted-foreground">Próximos atendimentos</p>
              </div>
              <Link to="/recepcao" className="text-sm font-medium text-primary inline-flex items-center gap-1">
                Abrir recepção <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {!kpis || kpis.todayList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem agendamentos para hoje.</p>
            ) : (
              <ul className="divide-y divide-border">
                {kpis.todayList.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-muted-foreground w-12">{new Date(a.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="font-medium">{a.patient_name}</span>
                    </div>
                    <StatusPill status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Ações rápidas</h2>
            <div className="space-y-2">
              <QuickAction to="/agenda" icon={Calendar} label="Novo agendamento" />
              <QuickAction to="/pacientes" icon={Users} label="Novo paciente" />
              <QuickAction to="/prontuario" icon={Stethoscope} label="Abrir prontuário" />
              <QuickAction to="/recepcao" icon={ClipboardCheck} label="Recepção" />
              <QuickAction to="/lembretes" icon={Bell} label="Enviar lembretes" />
            </div>
          </div>
        </section>

        {/* Status do consultório */}
        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard title="Status" value={tenant.onboarding_status === "completed" ? "Publicado" : "Rascunho"} success={tenant.onboarding_status === "completed"} />
          <InfoCard title="Subdomínio" value={`/s/${tenant.slug}`} />
          <InfoCard title="Conselho" value={tenant.council_type && tenant.council_number ? `${tenant.council_type} ${tenant.council_number}${tenant.council_state ? `/${tenant.council_state}` : ""}` : "Não informado"} />
        </section>
      </div>
    </AppShell>
  );
}

function KpiCard({ icon: Icon, label, value, sub, href, tone }: { icon: any; label: string; value: string; sub?: string; href: string; tone: "primary" | "success" | "warning" | "info" }) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    info: "bg-blue-500/10 text-blue-600",
  };
  return (
    <Link to={href} className="group rounded-2xl border border-border bg-surface-elevated p-5 transition hover:border-primary/40 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneMap[tone]}`}><Icon className="h-5 w-5" /></span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Link>
  );
}

function MiniKpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: "default" | "warning" | "danger" }) {
  const color = tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4 flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-display text-lg font-semibold tabular-nums ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-accent/5">
      <span className="flex items-center gap-2.5"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
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
    pending: "pendente", confirmed: "confirmado", waiting_room: "sala de espera",
    in_service: "em atendimento", cancelled: "cancelado", no_show: "faltou", completed: "concluído",
  };
  return <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-muted"}`}>{labels[status] ?? status}</span>;
}

function InfoCard({ title, value, success }: { title: string; value: string; success?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className={`mt-2 flex items-center gap-2 font-display text-xl font-semibold ${success ? "text-emerald-600" : "text-foreground"}`}>
        {success && <CheckCircle2 className="h-5 w-5" />}{value}
      </p>
    </div>
  );
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.count / max) * 96));
        const label = new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">{d.count}</span>
            <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${h}px` }} title={`${d.date}: ${d.count}`} />
            <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
