import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Globe, Calendar, Megaphone, Star, CreditCard, CheckCircle2, ArrowRight,
  Stethoscope, ShieldCheck, MessageSquare, ClipboardList, Mail, Building2,
  Image as ImageIcon, Users, Video, FileText, ClipboardCheck, Wallet, Link2,
  FileSignature, Package, Phone, Bell, Gift, Smile, TrendingUp,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SaúdeOS — Sua clínica no piloto automático" },
      {
        name: "description",
        content:
          "Site, agenda, redes sociais e anúncios. Tudo automatizado por IA, sem agência. Feito para médicos, dentistas e clínicas no Brasil.",
      },
      { property: "og:title", content: "SaúdeOS — Sua clínica no piloto automático" },
      {
        property: "og:description",
        content:
          "A primeira agência digital autônoma vertical para saúde. IA cuida do site, conteúdo e anúncios. Você cuida dos pacientes.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <BrandMark />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#funcionalidades" className="transition hover:text-foreground">Funcionalidades</a>
            <a href="#como-funciona" className="transition hover:text-foreground">Como funciona</a>
            <Link to="/precos" className="transition hover:text-foreground">Preços</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Começar grátis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-hero-gradient">
        <div className="container-page py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-elevated px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Agência digital autônoma para o setor da saúde
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-7xl">
              A sua clínica no <span className="text-primary">piloto automático</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Site profissional, agenda integrada com Google e Outlook, posts em redes sociais e
              campanhas de anúncios — tudo criado e gerenciado por IA. Sem agência. Sem perder
              tempo. Sem perder paciente.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
              >
                Criar minha presença digital <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-6 py-3 text-base font-medium text-foreground hover:bg-accent/10"
              >
                Ver o que faz
              </a>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              14 dias grátis · Sem cartão · Compliance CFM/CFO/LGPD integrado
            </p>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="border-t border-border/60 py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Funcionalidades
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Uma plataforma. Toda a presença digital.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada módulo conversa com os outros. Um paciente que clicou no anúncio chega ao seu
              site, agenda direto na sua agenda e recebe lembrete no WhatsApp.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/70 bg-surface-elevated p-7 transition hover:border-primary/30 hover:shadow-lift"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-surface py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Como funciona
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Em 10 minutos você está online.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="mb-4 font-display text-6xl font-semibold text-primary/15">
                  0{i + 1}
                </div>
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 py-24">
        <div className="container-page">
          <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Compliance no DNA
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                Construído com as regras do CFM, CFO e LGPD em cada linha de código.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A IA bloqueia automaticamente promessa de resultado, antes/depois, sensacionalismo e
                outros conteúdos vetados pelos conselhos. Você publica tranquilo.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Guardrails de publicidade médica/odontológica embutidos",
                  "Dados de pacientes em conformidade com LGPD",
                  "Registro do conselho exibido em todas as peças",
                  "Logs de auditoria de todo conteúdo publicado",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-cta-gradient p-10 text-primary-foreground shadow-lift">
              <ShieldCheck className="h-10 w-10 text-accent" />
              <p className="mt-6 font-display text-2xl leading-snug">
                "Pela primeira vez vejo um sistema que entende as regras do CFO antes de mim. Posso
                pedir o que quiser que ele já sabe o que não pode."
              </p>
              <p className="mt-4 text-sm opacity-80">— Posicionamento típico de cliente-alvo</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-hero-gradient py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface-elevated p-10 text-center shadow-lift md:p-14">
            <Stethoscope className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Comece hoje. Cancele quando quiser.
            </h2>
            <p className="mt-3 text-muted-foreground">
              14 dias grátis para colocar seu consultório no piloto automático.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              Criar conta gratuita <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <BrandMark />
          <p>© {new Date().getFullYear()} SaúdeOS. Feito no Brasil.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Globe,
    title: "Site profissional gerado por IA",
    body: "Converse com a IA como aqui no Lovable. Em minutos seu site está no ar, otimizado para SEO local e em conformidade.",
  },
  {
    icon: Calendar,
    title: "Agenda automatizada",
    body: "Sincronização bidirecional com Google Agenda e Outlook. Paciente agenda online, confirmação por WhatsApp.",
  },
  {
    icon: ImageIcon,
    title: "Peças automáticas para redes",
    body: "Upload da sua marca → IA gera posts, stories e carrosséis com seu visual e seu tom de voz.",
  },
  {
    icon: MessageSquare,
    title: "Agente de conteúdo",
    body: "Calendário editorial mensal criado e agendado automaticamente no Instagram, Facebook e LinkedIn.",
  },
  {
    icon: Megaphone,
    title: "Google Ads + Meta Ads",
    body: "Campanhas criadas, otimizadas e relatadas. Dashboard único com leads, consultas e ROI por canal.",
  },
  {
    icon: Star,
    title: "Reputação no Google",
    body: "Pedido automático de avaliação após consulta. Respostas com IA. Score do consultório sempre em alta.",
  },
  {
    icon: ClipboardList,
    title: "Anamnese digital",
    body: "Paciente preenche antes da consulta com consentimento LGPD. Modelos gerados por IA para cada especialidade.",
  },
  {
    icon: Stethoscope,
    title: "Prontuário com IA (SOAP)",
    body: "Dite a consulta no navegador. A IA transcreve e estrutura em S/O/A/P. Você só revisa.",
  },
  {
    icon: Mail,
    title: "E-mail marketing",
    body: "Campanhas criadas por IA, base de contatos própria e relatórios — tudo dentro do compliance.",
  },
  {
    icon: CreditCard,
    title: "Pix e sinal de consulta",
    body: "Reduza no-show com cobrança de sinal por Pix. Recorrência para tratamentos longos.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance CFM/CFO/LGPD",
    body: "Guardrails que bloqueiam conteúdo vetado. Anamnese digital com consentimento. Dados protegidos.",
  },
  { icon: Building2, title: "Multi-unidade", body: "Clínicas com vários profissionais, salas e endereços. Dashboard consolidado." },
  { icon: Users, title: "CRM de pacientes", body: "Cadastro completo, segmentação por tags, histórico e LTV." },
  { icon: Video, title: "Teleconsulta integrada", body: "Sala de vídeo com link único, sem instalação, dentro do prontuário." },
  { icon: FileText, title: "Prescrição digital", body: "Receita, atestado e exame com QR de validação e assinatura ICP-Brasil." },
  { icon: ClipboardCheck, title: "Planos & odontograma", body: "Etapas com valores, status e ligação direta com financeiro." },
  { icon: Wallet, title: "Financeiro completo", body: "Fluxo de caixa, contas a pagar/receber, repasse automático a profissionais." },
  { icon: Link2, title: "Pagamentos online", body: "Pix, cartão e boleto. Link único de cobrança enviado por WhatsApp." },
  { icon: FileSignature, title: "Orçamentos & contratos", body: "Geração, envio e aceite digital." },
  { icon: Package, title: "Controle de estoque", body: "Materiais e medicamentos com alerta de mínimo e validade." },
  { icon: MessageSquare, title: "Chat interno", body: "Conversa em tempo real entre profissionais e secretária." },
  { icon: Phone, title: "Call center", body: "Fila, registro de chamadas e múltiplas agendas em paralelo." },
  { icon: Bell, title: "Lembretes inteligentes", body: "WhatsApp, SMS e e-mail com confirmação de presença automática." },
  { icon: Gift, title: "Programa de indicação", body: "Paciente indica, ganha desconto. Código único gerado pela plataforma." },
  { icon: Smile, title: "NPS automatizado", body: "Pesquisa pós-consulta que alimenta diretamente a sua reputação." },
  { icon: TrendingUp, title: "BI avançado", body: "Benchmarks por especialidade e cidade. Você sabe onde está e para onde ir." },
];

const steps = [
  {
    title: "Cadastre sua especialidade",
    body: "Diga seu nome, CRM ou CRO, especialidade e cidade. Leva 2 minutos.",
  },
  {
    title: "Converse com a IA",
    body: "Como aqui no Lovable: peça mudanças, adicione seções, escolha o tom. A IA respeita as regras do conselho.",
  },
  {
    title: "Publique e conecte",
    body: "Site no ar. Conecte sua agenda, redes sociais e contas de anúncios. Pronto.",
  },
];
