import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Globe,
  Calendar,
  Sparkles,
  Megaphone,
  Star,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getMyTenant } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["my-tenant"],
    queryFn: () => fetchTenant(),
  });

  useEffect(() => {
    if (!isLoading && !tenant) navigate({ to: "/onboarding" });
  }, [isLoading, tenant, navigate]);

  if (isLoading || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="container-page py-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Painel
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Olá, {tenant.display_name.split(" ").slice(0, 2).join(" ")}
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              {tenant.specialty ? `${tenant.specialty} · ` : ""}
              {tenant.city ? `${tenant.city}${tenant.state ? `/${tenant.state}` : ""}` : "Brasil"}
            </p>
          </div>
          <Link
            to="/s/$slug"
            params={{ slug: tenant.slug }}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium transition hover:bg-accent/10"
          >
            Ver site público <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Status"
            value={tenant.onboarding_status === "completed" ? "Publicado" : "Rascunho"}
            tone={tenant.onboarding_status === "completed" ? "success" : "muted"}
          />
          <StatusCard title="Subdomínio" value={`/s/${tenant.slug}`} tone="muted" />
          <StatusCard
            title="Conselho"
            value={
              tenant.council_type && tenant.council_number
                ? `${tenant.council_type} ${tenant.council_number}${tenant.council_state ? `/${tenant.council_state}` : ""}`
                : "Não informado"
            }
            tone="muted"
          />
        </section>

        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">Módulos</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ModuleCard
            to="/site"
            icon={Globe}
            title="Site profissional"
            body="Editar conteúdo com o assistente IA. Publicar e visualizar."
            cta="Abrir construtor"
            ready
          />
          <ModuleCard
            to="/agenda"
            icon={Calendar}
            title="Agenda"
            body="Profissionais, serviços, horários e agendamento público. Google/Outlook em breve."
            cta="Abrir agenda"
            ready
          />
          <ModuleCard
            to="/conteudo"
            icon={Sparkles}
            title="Conteúdo & redes sociais"
            body="Brand kit, gerador de peças com IA e biblioteca de posts agendados."
            cta="Abrir conteúdo"
            ready
          />
          <ModuleCard
            to="/anuncios"
            icon={Megaphone}
            title="Google Ads & Meta Ads"
            body="Criação assistida por IA, dashboard de ROI por canal. Publicação direta em breve."
            cta="Abrir anúncios"
            ready
          />
          <ModuleCard
            to="/reputacao"
            icon={Star}
            title="Reputação no Google"
            body="Pedido automático de avaliação pós-consulta. Respostas com IA."
            cta="Em desenvolvimento"
          />
          <ModuleCard
            to="/dashboard"
            icon={CreditCard}
            title="Pagamentos & Pix"
            body="Sinal de consulta, recorrência para tratamentos longos."
            cta="Em desenvolvimento"
          />
        </div>
      </div>
    </AppShell>
  );
}

function StatusCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "success" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p
        className={`mt-2 flex items-center gap-2 font-display text-2xl font-semibold ${
          tone === "success" ? "text-success" : "text-foreground"
        }`}
      >
        {tone === "success" && <CheckCircle2 className="h-5 w-5" />}
        {value}
      </p>
    </div>
  );
}

function ModuleCard({
  to,
  icon: Icon,
  title,
  body,
  cta,
  ready,
}: {
  to: "/site" | "/agenda" | "/conteudo" | "/anuncios" | "/reputacao" | "/dashboard";
  icon: typeof Globe;
  title: string;
  body: string;
  cta: string;
  ready?: boolean;
}) {
  const content = (
    <div
      className={`group flex h-full flex-col rounded-2xl border bg-surface-elevated p-6 transition ${
        ready
          ? "border-border hover:border-primary/40 hover:shadow-lift"
          : "border-dashed border-border opacity-80"
      }`}
    >
      <div className="mb-5 flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        {!ready && (
          <span className="rounded-full bg-accent/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            em breve
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p
        className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium ${
          ready ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {cta} {ready && <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />}
      </p>
    </div>
  );

  return ready ? <Link to={to}>{content}</Link> : <div>{content}</div>;
}
