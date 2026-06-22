import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, CheckCircle2, ArrowRight, Stethoscope, ShieldCheck,
  Wallet, Layers, Check, Megaphone, Calculator, Calendar,
  FileText, MessageSquare, BarChart3, Users, Bot, Workflow,
  Smartphone, CreditCard, Quote, Star,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minha Clínica — Sistema completo para clínicas e consultórios" },
      {
        name: "description",
        content:
          "Agenda, prontuário, financeiro, marketing e IA em um só lugar. O sistema brasileiro para clínicas que querem reduzir faltas, aumentar receita e atender com excelência.",
      },
      { property: "og:title", content: "Minha Clínica — Sistema completo para clínicas e consultórios" },
      {
        property: "og:description",
        content:
          "Agenda, prontuário, financeiro, marketing e IA em um só lugar. Feito no Brasil para médicos, dentistas e clínicas.",
      },
      { property: "og:url", content: "https://minhaclinica.ia.br" },
    ],
    links: [{ rel: "canonical", href: "https://minhaclinica.ia.br" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Minha Clínica",
        applicationCategory: "MedicalApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "197", priceCurrency: "BRL" },
        url: "https://minhaclinica.ia.br",
        description: "Sistema completo para clínicas: agenda, prontuário, financeiro, marketing e IA.",
      }),
    }],
  }),
  component: LandingPage,
});

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <StatStrip />
      <ModulesSection />
      <PersonaSection />
      <AISection />
      <section id="pacotes" className="border-t border-border/60 py-20 md:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pacotes</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Você escolhe por onde começar.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cinco pacotes especializados — combine os que precisar. Painel, BI e suporte estão sempre inclusos.
            </p>
          </div>
          <PackageSelector />
        </div>
      </section>
      <ComplianceSection />
      <TestimonialsSection />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <BrandMark />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#modulos" className="transition hover:text-foreground">Funcionalidades</a>
          <a href="#personas" className="transition hover:text-foreground">Para quem</a>
          <a href="#pacotes" className="transition hover:text-foreground">Pacotes</a>
          <Link to="/precos" className="transition hover:text-foreground">Preços</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">
            Entrar
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Testar grátis <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="container-page grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:py-28">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-elevated px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Novo · IA assistente clínica embutida
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
            O sistema completo da sua <span className="text-primary">clínica</span>, sem mil ferramentas.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Agenda, prontuário, financeiro, marketing e IA em um só lugar. Reduza faltas,
            aumente a receita e tenha mais tempo para o que importa: cuidar de pacientes.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              Começar 14 dias grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modulos"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-medium text-foreground hover:bg-accent/10"
            >
              Ver funcionalidades
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartão de crédito · Migração gratuita · LGPD, CFM e CFO no DNA
          </p>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  // SVG product mockup — agenda do dia
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-3xl" aria-hidden />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-background px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-[11px] font-medium text-muted-foreground">app.minhaclinica.ia.br/agenda</span>
        </div>
        <div className="grid grid-cols-[180px_1fr] gap-0">
          <aside className="border-r border-border/60 bg-surface p-4 text-xs">
            <p className="font-semibold text-ink">Hoje</p>
            <p className="mt-1 text-muted-foreground">14 consultas</p>
            <div className="mt-4 space-y-1.5">
              {["Dashboard", "Agenda", "Pacientes", "Prontuário", "Financeiro", "Marketing"].map((i, idx) => (
                <div key={i} className={`rounded-md px-2 py-1.5 ${idx === 1 ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground"}`}>{i}</div>
              ))}
            </div>
          </aside>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Agenda do dia</p>
              <span className="rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">93% confirmados</span>
            </div>
            <div className="space-y-1.5">
              {[
                { h: "08:00", n: "Marina Costa", s: "Consulta clínica", c: "bg-primary/10 border-l-primary" },
                { h: "09:30", n: "Pedro Almeida", s: "Retorno", c: "bg-accent/10 border-l-accent" },
                { h: "10:30", n: "Ana Beatriz", s: "Avaliação inicial", c: "bg-success/10 border-l-success" },
                { h: "11:30", n: "—", s: "Horário livre", c: "bg-muted/40 border-l-border text-muted-foreground" },
                { h: "14:00", n: "Carlos Mendes", s: "Teleconsulta", c: "bg-primary/10 border-l-primary" },
                { h: "15:00", n: "Júlia Ramos", s: "Procedimento", c: "bg-accent/10 border-l-accent" },
              ].map((r) => (
                <div key={r.h} className={`flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-xs ${r.c}`}>
                  <span className="w-12 font-mono font-semibold">{r.h}</span>
                  <span className="flex-1 font-medium text-ink">{r.n}</span>
                  <span className="text-muted-foreground">{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatStrip() {
  const stats = [
    { v: "−42%", l: "de faltas com lembretes automáticos" },
    { v: "+28%", l: "de receita com agendamento online" },
    { v: "5 min", l: "para o setup inicial da clínica" },
    { v: "100%", l: "conforme LGPD, CFM e CFO" },
  ];
  return (
    <section className="border-y border-border/60 bg-surface py-10">
      <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <p className="font-display text-3xl font-semibold text-primary md:text-4xl">{s.v}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const MODULES = [
  {
    icon: Calendar,
    title: "Agenda online",
    body: "Agendamento multi-profissional com confirmação automática por WhatsApp, lista de espera e encaixe inteligente. Integra com Google e Outlook.",
  },
  {
    icon: FileText,
    title: "Prontuário eletrônico",
    body: "Anamnese, prescrição digital com QR Memed, modelos de documentos, anexos e linha do tempo do paciente — com alerta de alergias automático.",
  },
  {
    icon: Wallet,
    title: "Financeiro & repasse",
    body: "Caixa, contas a receber, repasse para profissionais, maquininha TEF, Pix/boleto/cartão e conciliação automática via Open Finance.",
  },
  {
    icon: Megaphone,
    title: "Marketing com IA",
    body: "Site profissional gerado pela IA, conteúdo para redes sociais com guardrails do CFM/CFO, campanhas Google/Meta e gestão de reputação.",
  },
  {
    icon: Workflow,
    title: "Jornadas & lembretes",
    body: "Mensagens automáticas em WhatsApp, SMS e e-mail. Reativação de inativos, pós-consulta, NPS e programa de indicação — tudo no piloto automático.",
  },
  {
    icon: BarChart3,
    title: "BI & relatórios",
    body: "Performance por profissional, funil de captação, cohort de retenção, DRE simplificado e exportação em PDF/CSV sob demanda.",
  },
  {
    icon: Smartphone,
    title: "Portal do paciente",
    body: "App PWA com histórico, receitas, notas fiscais e agendamento. Login simples por CPF + data de nascimento, sem app na loja.",
  },
  {
    icon: CreditCard,
    title: "Fiscal & convênios",
    body: "Emissão de NFS-e com ISS automático, calendário tributário, guias TISS, glosas e painel para o contador.",
  },
];

function ModulesSection() {
  return (
    <section id="modulos" className="py-20 md:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tudo em um só sistema</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            8 módulos que conversam entre si.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sem planilhas, sem 5 logins, sem dados duplicados. Cada módulo é poderoso sozinho e ainda melhor combinado.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <article key={m.title} className="group rounded-2xl border border-border/70 bg-surface-elevated p-5 transition hover:border-primary/40 hover:shadow-soft">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const PERSONAS = [
  {
    icon: Stethoscope,
    title: "Para o profissional",
    points: [
      "Prontuário ágil com modelos por especialidade",
      "Prescrição digital assinada em 2 cliques",
      "Teleconsulta sem instalar nada",
      "IA que resume a consulta enquanto você atende",
    ],
  },
  {
    icon: Users,
    title: "Para a recepção",
    points: [
      "Painel de recepção em tempo real (sala de espera, em atendimento, faltou)",
      "Confirmação automática de presença",
      "Lista de espera com encaixe em 1 clique",
      "Cobrança e link de pagamento na hora",
    ],
  },
  {
    icon: BarChart3,
    title: "Para o gestor",
    points: [
      "DRE, fluxo de caixa e repasse automatizados",
      "BI com performance por profissional",
      "Multi-unidade com permissões granulares (RBAC)",
      "Log de auditoria de tudo que importa",
    ],
  },
];

function PersonaSection() {
  return (
    <section id="personas" className="border-t border-border/60 bg-surface py-20 md:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Para cada papel na clínica</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Cada pessoa vê o que precisa, sem ruído.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border/70 bg-background p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{p.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section className="border-t border-border/60 py-20 md:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-lift">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="h-4 w-4 text-primary" />
              <span>Assistente Minha Clínica</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Você</p>
                <p className="mt-1">Reescreva esta orientação pós-consulta de forma mais clara para a paciente.</p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">IA</p>
                <p className="mt-1 leading-relaxed">
                  Marina, evite atividades físicas intensas por 48 horas. Tome o medicamento prescrito a cada 8 horas
                  junto com alimentos. Procure-nos se houver febre acima de 38°C ou sangramento. Retorno em 7 dias.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-success" />
                Conformidade CFM verificada · sem promessa de resultado
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">IA com conformidade</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            IA treinada para clínicas brasileiras.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Resumo de consulta, reescrita de orientações, geração de conteúdo para redes,
            classificação de pacientes — tudo com guardrails do CFM, CFO e LGPD. A IA bloqueia
            promessa de resultado, antes/depois e sensacionalismo antes de você publicar.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
            {[
              "Resumo automático da consulta",
              "Reescrita de orientações ao paciente",
              "Posts de redes sem violar conselho",
              "Triagem inicial via WhatsApp",
              "Sugestão de CID e procedimento",
              "Análise de risco de no-show",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ComplianceSection() {
  return (
    <section className="border-y border-border/60 py-20 md:py-24">
      <div className="container-page mx-auto max-w-5xl">
        <div className="rounded-3xl bg-cta-gradient p-8 text-primary-foreground shadow-lift md:p-14">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-accent" />
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Compliance que respira no produto, não em um PDF.
              </h2>
              <p className="mt-3 text-base opacity-90">
                Guardrails de publicidade médica e odontológica embutidos em cada formulário.
                Dados de pacientes criptografados em repouso e em trânsito. Auditoria completa
                de quem fez o quê e quando.
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              {["CFM 2.336/23", "CFO 196/19", "LGPD", "ISO 27001"].map((i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span className="font-medium">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "Migramos de 3 sistemas para um só. A recepção economiza 2 horas por dia e o faturamento finalmente bate.",
    name: "Dra. Carolina M.",
    role: "Clínica de Dermatologia, Belo Horizonte",
  },
  {
    quote: "A IA escreve as orientações pós-consulta com a minha voz. Os pacientes entendem melhor e voltam mais.",
    name: "Dr. Rafael S.",
    role: "Endocrinologista, São Paulo",
  },
  {
    quote: "Em 6 meses cortamos as faltas pela metade. O lembrete automático faz sozinho o que minha secretária não dava conta.",
    name: "Dra. Luiza P.",
    role: "Odontologia Estética, Curitiba",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Quem usa, recomenda</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Profissionais que voltaram a respirar.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-border/70 bg-surface-elevated p-6">
              <Quote className="h-6 w-6 text-primary/40" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-hero-gradient py-20 md:py-24">
      <div className="container-page mx-auto max-w-3xl">
        <div className="rounded-3xl border border-border bg-surface-elevated p-10 text-center shadow-lift md:p-14">
          <Stethoscope className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Sua clínica organizada em uma tarde.
          </h2>
          <p className="mt-3 text-muted-foreground">
            14 dias grátis. Sem cartão. Migração da agenda e da base de pacientes por nossa conta.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              Começar grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://wa.me/5511999999999?text=Quero%20uma%20demonstra%C3%A7%C3%A3o%20do%20Minha%20Cl%C3%ADnica"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-base font-medium text-foreground hover:bg-accent/10"
            >
              <MessageSquare className="h-4 w-4" /> Falar com um especialista
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const cols = [
    { title: "Produto", links: [
      { label: "Funcionalidades", href: "#modulos" },
      { label: "Para quem", href: "#personas" },
      { label: "Pacotes", href: "#pacotes" },
      { label: "Preços", href: "/precos" },
    ]},
    { title: "Empresa", links: [
      { label: "Privacidade & LGPD", href: "/privacidade" },
      { label: "Portal do paciente", href: "/portal" },
    ]},
    { title: "Acesso", links: [
      { label: "Entrar", href: "/auth" },
      { label: "Criar conta", href: "/auth?mode=signup" },
    ]},
  ];
  return (
    <footer className="border-t border-border/60 bg-surface py-14">
      <div className="container-page grid gap-10 md:grid-cols-[2fr_3fr]">
        <div className="max-w-sm">
          <BrandMark />
          <p className="mt-4 text-sm text-muted-foreground">
            Sistema completo de gestão clínica feito no Brasil, com IA e compliance no DNA.
            Para médicos, dentistas e clínicas que querem crescer sem complicar.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">minhaclinica.ia.br</p>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">{c.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.label}><a href={l.href} className="hover:text-foreground">{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Minha Clínica · Todos os direitos reservados · Feito no Brasil
      </div>
    </footer>
  );
}

// =========== PACKAGE SELECTOR ===========
type Pkg = {
  id: "presenca" | "clinic" | "pay" | "flow" | "contabil";
  icon: typeof Stethoscope;
  title: string;
  tagline: string;
  tone: string;
  price: number;
  body: string;
  items: string[];
};

const BASE_PRICES: Record<Pkg["id"], number> = {
  presenca: 197,
  clinic: 297,
  flow: 197,
  pay: 247,
  contabil: 349,
};

const packages: Pkg[] = [
  {
    id: "clinic",
    icon: Stethoscope,
    title: "Clinic",
    tagline: "Operar a clínica",
    tone: "bg-primary/10 text-primary",
    price: BASE_PRICES.clinic,
    body: "A espinha dorsal do dia a dia: agenda inteligente, prontuário com IA, prescrição digital, teleconsulta e tudo que a recepção, o consultório e a gestão precisam — em uma única tela, multi-unidade e multi-profissional.",
    items: [
      "Agenda multi-profissional + Google/Outlook",
      "Recepção, check-in, lista de espera e encaixe",
      "Prontuário eletrônico com resumos por IA",
      "Anamnese digital com modelos por especialidade",
      "Prescrição digital com QR/assinatura (Memed)",
      "Teleconsulta integrada (vídeo e chat)",
      "Cadastro de pacientes com histórico completo",
      "Estoque, materiais e controle por lote",
      "Multi-unidade e gestão de equipe/permissões",
      "Modelos clínicos, tarefas e chat interno",
    ],
  },
  {
    id: "pay",
    icon: Wallet,
    title: "Pay",
    tagline: "Receber, repassar, faturar",
    tone: "bg-success/15 text-success",
    price: BASE_PRICES.pay,
    body: "Do orçamento ao recebimento e do recebimento ao repasse: financeiro completo, maquininha TEF, planos, convênios com TISS e DRE em tempo real — sem planilhas paralelas.",
    items: [
      "Caixa, contas a pagar e a receber",
      "Pix, link de pagamento e maquininha TEF",
      "Orçamentos digitais com aprovação online",
      "Planos de tratamento e parcelamento",
      "Repasse automático a profissionais",
      "Convênios + Guias TISS (SADT, consulta, internação)",
      "Faturamento e glosas",
      "Open Finance e conciliação bancária (Pluggy)",
      "DRE, fluxo de caixa e indicadores",
      "Régua de cobrança e renegociação",
    ],
  },
  {
    id: "flow",
    icon: Workflow,
    title: "Flow",
    tagline: "Engajar o paciente",
    tone: "bg-secondary/40 text-primary",
    price: BASE_PRICES.flow,
    body: "Transforma cada paciente em recorrência: jornadas automáticas com IA, lembretes multicanal, reativação de inativos, indicações premiadas, NPS e portal do paciente em PWA.",
    items: [
      "Jornadas automáticas (pré, durante e pós consulta)",
      "Lembretes por WhatsApp, SMS e e-mail",
      "Agente de WhatsApp com IA (24/7)",
      "Reativação de pacientes inativos por IA",
      "Programa de indicação com link único e prêmios",
      "NPS automático e pesquisas de satisfação",
      "Call center / fila de retorno",
      "Portal do paciente (PWA) com histórico",
      "Automações por gatilho (no-show, aniversário, retorno)",
      "Confirmação automática de consulta",
    ],
  },
  {
    id: "presenca",
    icon: Megaphone,
    title: "Presença",
    tagline: "Atrair mais pacientes",
    tone: "bg-accent/15 text-accent",
    price: BASE_PRICES.presenca,
    body: "Seu marketing inteiro no piloto automático: site profissional gerado por IA, conteúdo e SEO local, anúncios Google/Meta, e-mail marketing e gestão de reputação — tudo com guardrails CFM/CFO.",
    items: [
      "Site profissional gerado e otimizado por IA",
      "Páginas por unidade, profissional e serviço",
      "Agendamento online direto do site",
      "Conteúdo e blog com SEO local",
      "Anúncios Google Ads e Meta Ads",
      "E-mail marketing segmentado",
      "Reputação Google, Doctoralia e redes sociais",
      "Respostas automáticas a avaliações",
      "Guardrails CFM/CFO automáticos",
      "Landing pages e formulários de captação",
    ],
  },
  {
    id: "contabil",
    icon: Calculator,
    title: "Contábil",
    tagline: "Ficar em dia com o fisco",
    tone: "bg-warning/15 text-warning-foreground",
    price: BASE_PRICES.contabil,
    body: "Toda a parte fiscal e contábil integrada ao financeiro: emissão de notas, apuração de impostos, folha simplificada, painel para o contador e suporte humano quando precisar.",
    items: [
      "Emissão automática de NFS-e (ISS por município)",
      "Apuração de DAS, IRPJ, INSS, ISS e PIS/COFINS",
      "Folha de pagamento simplificada",
      "Pró-labore e recibos de profissionais",
      "Painel exclusivo para o contador",
      "Exportação SPED, contábil e XML",
      "Conciliação fiscal x financeiro",
      "Alertas de vencimento de tributos",
      "Suporte fiscal humano por chat",
      "Histórico fiscal completo e auditável",
    ],
  },
];

function PackageSelector() {
  const [selected, setSelected] = useState<Record<Pkg["id"], boolean>>({
    presenca: true, clinic: true, flow: true, pay: true, contabil: true,
  });

  const toggle = (id: Pkg["id"]) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const selectedIds = useMemo(
    () => packages.filter((p) => selected[p.id]).map((p) => p.id),
    [selected],
  );
  const count = selectedIds.length;
  const allSelected = count === packages.length;

  const subtotal = useMemo(
    () => packages.reduce((sum, p) => (selected[p.id] ? sum + BASE_PRICES[p.id] : sum), 0),
    [selected],
  );

  const discountRate = Math.min(count * 0.05, 0.25);
  const discountPct = Math.round(discountRate * 100);
  const total = Math.round(subtotal * (1 - discountRate));
  const savings = subtotal - total;

  const selectAll = () =>
    setSelected({ presenca: true, clinic: true, flow: true, pay: true, contabil: true });

  const ctaLabel =
    count === 0
      ? "Selecione ao menos um pacote"
      : allSelected
        ? "Assinar Minha Clínica Total"
        : `Assinar ${count} pacote${count > 1 ? "s" : ""}`;

  return (
    <>
      <div className="mt-12 grid gap-3 md:grid-cols-2">
        {packages.map((p) => {
          const isOn = selected[p.id];
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => toggle(p.id)}
              aria-pressed={isOn}
              className={`group relative text-left rounded-2xl border bg-surface-elevated p-5 transition hover:shadow-soft ${
                isOn ? "border-primary ring-2 ring-primary/30" : "border-border/70 hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${p.tone}`}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {p.tagline}
                      </p>
                      <h3 className="font-display text-xl font-semibold leading-tight">{p.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-lg font-semibold text-ink">{formatBRL(p.price)}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">/mês</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  <ul className="mt-3 grid grid-cols-1 gap-y-1 text-xs sm:grid-cols-2">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <span
                  className={`absolute right-4 top-4 inline-flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    isOn ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                  }`}
                  aria-hidden
                >
                  {isOn && <Check className="h-3.5 w-3.5" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-cta-gradient p-7 text-primary-foreground shadow-lift md:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
              <Layers className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Seu plano</p>
              <p className="font-display text-2xl font-semibold">
                {count === 0 && "Nenhum pacote selecionado"}
                {count > 0 && !allSelected && `${count} pacote${count > 1 ? "s" : ""} · economia de ${discountPct}%`}
                {allSelected && "Minha Clínica Total · economia máxima"}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {count > 0 && allSelected && "Tudo incluso. O melhor custo-benefício."}
                {count > 0 && !allSelected && `${formatBRL(savings)} de desconto por mês`}
                {count === 0 && "Selecione os pacotes acima para ver o preço."}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              {count > 0 && (
                <p className="text-xs uppercase tracking-wider opacity-70 line-through">{formatBRL(subtotal)}</p>
              )}
              <p className="font-display text-4xl font-semibold">{formatBRL(total)}<span className="text-base font-normal opacity-80">/mês</span></p>
            </div>
            <div className="flex gap-2">
              {!allSelected && count > 0 && (
                <button
                  onClick={selectAll}
                  className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium hover:bg-white/20"
                >
                  Selecionar tudo
                </button>
              )}
              <Link
                to="/assinar"
                search={{ pkgs: selectedIds.join(",") }}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  count === 0
                    ? "pointer-events-none bg-white/10 text-white/40"
                    : "bg-white text-primary hover:opacity-90"
                }`}
              >
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
