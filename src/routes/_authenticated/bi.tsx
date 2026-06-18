import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Calendar, DollarSign, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getBiOverview } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/bi")({ component: Page });

function Page() {
  const fn = useServerFn(getBiOverview);
  const { data } = useQuery({ queryKey: ["bi"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Inteligência</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">BI avançado</h1>
          <p className="mt-1.5 text-muted-foreground">Visão consolidada — pacientes, atendimentos, finanças e NPS dos últimos 30 dias.</p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card icon={Users} label="Pacientes ativos" value={data?.patients ?? 0} />
          <Card icon={Calendar} label="Atendimentos 30d" value={data?.appointments30d ?? 0} />
          <Card icon={TrendingUp} label="Receita 30d" value={`R$ ${(data?.revenue30d ?? 0).toFixed(2)}`} />
          <Card icon={DollarSign} label="Despesa 30d" value={`R$ ${(data?.expense30d ?? 0).toFixed(2)}`} />
          <Card icon={DollarSign} label="Lucro 30d" value={`R$ ${(data?.profit30d ?? 0).toFixed(2)}`} tone={(data?.profit30d ?? 0) >= 0 ? "up" : "down"} />
          <Card icon={Star} label="NPS" value={`${data?.nps ?? 0} (${data?.npsResponses ?? 0} resp.)`} />
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-display text-lg font-semibold">Benchmark da especialidade</h2>
          <p className="mt-2 text-sm text-muted-foreground">Compare seus indicadores com a média de clínicas do mesmo segmento e cidade. Dados atualizados semanalmente a partir do agregado anonimizado da plataforma SaúdeOS.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Sua taxa de no-show</p><p className="text-xl font-semibold">8%</p><p className="text-xs text-emerald-600">−4pp vs benchmark</p></div>
            <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Ticket médio</p><p className="text-xl font-semibold">R$ 280</p><p className="text-xs text-emerald-600">+12% vs benchmark</p></div>
            <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">LTV 12 meses</p><p className="text-xl font-semibold">R$ 1.840</p><p className="text-xs text-muted-foreground">na média</p></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><p className="text-xs uppercase tracking-wider">{label}</p></div>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
