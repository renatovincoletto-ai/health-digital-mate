import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Globe, Calendar, Sparkles, Megaphone, Star, ClipboardList, Stethoscope, Mail, Building2,
  ArrowRight, ExternalLink, Loader2, CheckCircle2,
  Users, Video, FileText, ClipboardCheck, Wallet, Link2, FileSignature,
  Package, MessageSquare, Phone, Bell, Gift, Smile, TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getMyTenant } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useQuery({ queryKey: ["my-tenant"], queryFn: () => fetchTenant() });

  useEffect(() => { if (!isLoading && !tenant) navigate({ to: "/onboarding" }); }, [isLoading, tenant, navigate]);

  if (isLoading || !tenant) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const groups: { label: string; modules: { to: string; icon: any; title: string; body: string }[] }[] = [
    { label: "Atendimento clínico", modules: [
      { to: "/agenda", icon: Calendar, title: "Agenda", body: "Múltiplas agendas, serviços, agendamento público." },
      { to: "/pacientes", icon: Users, title: "Pacientes (CRM)", body: "Cadastro, tags, segmentação e LTV." },
      { to: "/prontuario", icon: Stethoscope, title: "Prontuário SOAP", body: "Ditado por voz estruturado pela IA." },
      { to: "/anamnese", icon: ClipboardList, title: "Anamnese digital", body: "Paciente preenche antes da consulta." },
      { to: "/teleconsulta", icon: Video, title: "Teleconsulta", body: "Sala de vídeo segura com link único." },
      { to: "/prescricoes", icon: FileText, title: "Prescrição digital", body: "Receita, atestado e exame com QR." },
      { to: "/planos", icon: ClipboardCheck, title: "Planos & odontograma", body: "Etapas, valores e status do tratamento." },
    ]},
    { label: "Financeiro", modules: [
      { to: "/financeiro", icon: Wallet, title: "Fluxo de caixa", body: "Contas, lançamentos e repasse a profissionais." },
      { to: "/pagamentos", icon: Link2, title: "Pagamentos online", body: "Pix, cartão e boleto com link único." },
      { to: "/orcamentos", icon: FileSignature, title: "Orçamentos & contratos", body: "Envio e aceite digital." },
    ]},
    { label: "Operação", modules: [
      { to: "/estoque", icon: Package, title: "Estoque", body: "Materiais, alerta de mínimo e validade." },
      { to: "/chat", icon: MessageSquare, title: "Chat interno", body: "Mensagens entre profissionais e secretária." },
      { to: "/callcenter", icon: Phone, title: "Call center", body: "Fila e registro de chamadas." },
      { to: "/unidades", icon: Building2, title: "Multi-unidade", body: "Várias clínicas em um só painel." },
    ]},
    { label: "Crescimento & relacionamento", modules: [
      { to: "/site", icon: Globe, title: "Site profissional", body: "Editor com IA e SEO." },
      { to: "/conteudo", icon: Sparkles, title: "Conteúdo & redes", body: "Brand kit + posts com IA." },
      { to: "/anuncios", icon: Megaphone, title: "Anúncios", body: "Google e Meta Ads assistidos." },
      { to: "/email", icon: Mail, title: "E-mail marketing", body: "Campanhas e contatos." },
      { to: "/lembretes", icon: Bell, title: "Lembretes", body: "WhatsApp/SMS/e-mail com confirmação." },
      { to: "/indicacoes", icon: Gift, title: "Programa de indicação", body: "Paciente indica, ganha desconto." },
      { to: "/reputacao", icon: Star, title: "Reputação Google", body: "Avaliações e respostas com IA." },
      { to: "/nps", icon: Smile, title: "NPS pós-consulta", body: "Mede satisfação e alimenta Reputação." },
    ]},
    { label: "Inteligência", modules: [
      { to: "/bi", icon: TrendingUp, title: "BI avançado", body: "Benchmark por especialidade e cidade." },
    ]},
  ];

  return (
    <AppShell>
      <div className="container-page py-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Painel</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Olá, {tenant.display_name.split(" ").slice(0, 2).join(" ")}</h1>
            <p className="mt-1.5 text-muted-foreground">{tenant.specialty ? `${tenant.specialty} · ` : ""}{tenant.city ? `${tenant.city}${tenant.state ? `/${tenant.state}` : ""}` : "Brasil"}</p>
          </div>
          <a href={`/s/${tenant.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium hover:bg-accent/10">
            Ver site público <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <Stat title="Status" value={tenant.onboarding_status === "completed" ? "Publicado" : "Rascunho"} success={tenant.onboarding_status === "completed"} />
          <Stat title="Subdomínio" value={`/s/${tenant.slug}`} />
          <Stat title="Conselho" value={tenant.council_type && tenant.council_number ? `${tenant.council_type} ${tenant.council_number}${tenant.council_state ? `/${tenant.council_state}` : ""}` : "Não informado"} />
        </section>

        {groups.map((g) => (
          <div key={g.label} className="mb-10">
            <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">{g.label}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {g.modules.map((m) => (
                <a key={m.to} href={m.to} className="group flex h-full flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition hover:border-primary/40 hover:shadow-lift">
                  <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><m.icon className="h-5 w-5" /></span>
                  <h3 className="font-display text-lg font-semibold">{m.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                  <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Abrir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ title, value, success }: { title: string; value: string; success?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className={`mt-2 flex items-center gap-2 font-display text-2xl font-semibold ${success ? "text-success" : "text-foreground"}`}>
        {success && <CheckCircle2 className="h-5 w-5" />}{value}
      </p>
    </div>
  );
}
