import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles, CheckCircle2, ArrowRight, Stethoscope, ShieldCheck,
  Heart, Wallet, Receipt, Layers, Check, Megaphone, Calculator,
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

const BUNDLE_PRICE = 897;
const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

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
              Pacotes
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Escolha por dor. Combine quando crescer.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cinco pacotes especializados — ou tudo junto no SaúdeOS One. Painel e BI estão
              inclusos em qualquer combinação.
            </p>
          </div>

          <PackageSelector />
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

const packages: Pkg[] = [
  {
    id: "presenca",
    icon: Megaphone,
    title: "Presença",
    tagline: "Atraia mais pacientes",
    tone: "bg-accent/15 text-accent",
    price: 197,
    body: "Site profissional com IA, conteúdo, SEO local, anúncios Google/Meta e gestão de reputação.",
    items: [
      "Site profissional com IA",
      "Conteúdo e SEO local",
      "Anúncios Google e Meta",
      "E-mail marketing",
      "Reputação Google/Doctoralia",
    ],
  },
  {
    id: "clinic",
    icon: Stethoscope,
    title: "Clinic",
    tagline: "Operar a clínica",
    tone: "bg-primary/10 text-primary",
    price: 297,
    body: "Tudo que sua equipe usa do agendamento ao atendimento — com prontuário inteligente e teleconsulta.",
    items: [
      "Agenda multi-profissional",
      "Prontuário + Anamnese",
      "Prescrição digital + QR",
      "Teleconsulta integrada",
      "Estoque e multi-unidade",
    ],
  },
  {
    id: "pay",
    icon: Wallet,
    title: "Pay",
    tagline: "Receber, repassar, faturar",
    tone: "bg-success/15 text-success",
    price: 247,
    body: "Do orçamento ao repasse do profissional — incluindo maquininha TEF e faturamento de convênios.",
    items: [
      "Caixa e fluxo financeiro",
      "Pix, link, maquininha (TEF)",
      "Repasse a profissionais",
      "Orçamentos digitais",
      "Convênios + Guias TISS",
    ],
  },
  {
    id: "flow",
    icon: Sparkles,
    title: "Flow",
    tagline: "Engaje o paciente",
    tone: "bg-primary/10 text-primary",
    price: 197,
    body: "Jornadas automáticas com IA, lembretes multicanal, programa de indicação e portal do paciente.",
    items: [
      "Jornadas automáticas com IA",
      "Lembretes WhatsApp/SMS/e-mail",
      "Programa de indicação",
      "NPS pós-consulta",
      "Portal do paciente (PWA)",
    ],
  },
  {
    id: "contabil",
    icon: Calculator,
    title: "Contábil",
    tagline: "Fique em dia",
    tone: "bg-warning/15 text-warning",
    price: 349,
    body: "Emissão de notas, impostos, painel do contador e suporte fiscal humano integrado ao financeiro.",
    items: [
      "Emissão de NFS-e (ISS auto)",
      "DAS, IRPJ, INSS, ISS",
      "Abertura/regularização CNPJ",
      "Painel para o contador",
      "Suporte fiscal humano",
    ],
  },
];

function PackageSelector() {
  const [selected, setSelected] = useState<Record<Pkg["id"], boolean>>({
    presenca: true, clinic: true, pay: false, flow: false, contabil: false,
  });

  const toggle = (id: Pkg["id"]) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const selectedIds = useMemo(
    () => packages.filter((p) => selected[p.id]).map((p) => p.id),
    [selected],
  );
  const allSelected = selectedIds.length === packages.length;
  const subtotal = useMemo(
    () => packages.reduce((sum, p) => (selected[p.id] ? sum + p.price : sum), 0),
    [selected],
  );
  const total = allSelected ? BUNDLE_PRICE : subtotal;
  const savings = allSelected ? subtotal - BUNDLE_PRICE : 0;

  const selectAll = () =>
    setSelected({ presenca: true, clinic: true, pay: true, flow: true, contabil: true });

  const ctaLabel =
    selectedIds.length === 0
      ? "Selecione ao menos um pacote"
      : allSelected
        ? "Assinar SaúdeOS One (todos os pacotes)"
        : `Assinar ${selectedIds.length} pacote${selectedIds.length > 1 ? "s" : ""}`;

  return (
    <>
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {packages.map((p) => {
          const isOn = selected[p.id];
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => toggle(p.id)}
              aria-pressed={isOn}
              className={`group relative text-left rounded-2xl border bg-surface-elevated p-7 transition hover:shadow-lift ${
                isOn ? "border-primary ring-2 ring-primary/30" : "border-border/70 hover:border-primary/30"
              }`}
            >
              <span
                className={`absolute right-5 top-5 inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
                  isOn
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
                aria-hidden
              >
                {isOn && <Check className="h-4 w-4" />}
              </span>
              <div className="flex items-center gap-3 pr-10">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${p.tone}`}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {p.tagline}
                  </p>
                  <h3 className="font-display text-2xl font-semibold leading-tight">{p.title}</h3>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-display text-xl font-semibold text-ink">{formatBRL(p.price)}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">/mês</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-cta-gradient p-7 text-primary-foreground shadow-lift md:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Layers className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                Sua seleção
              </p>
              <h3 className="font-display text-2xl font-semibold">
                {allSelected ? "SaúdeOS One — tudo incluso" : "Monte seu plano"}
              </h3>
              <p className="mt-1 text-sm opacity-90">
                {selectedIds.length === 0
                  ? "Marque os pacotes acima para combinar o que faz sentido para sua clínica."
                    : allSelected
                    ? `Presença + Clinic + Pay + Flow + Contábil com onboarding guiado e suporte prioritário.`
                    : `Você selecionou: ${selectedIds.map((id) => packages.find((p) => p.id === id)!.title).join(" + ")}.`}
              </p>
              {!allSelected && selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
                >
                  Quero todos por {formatBRL(BUNDLE_PRICE)}/mês
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 md:items-end">
            <div className="text-right">
              {allSelected && savings > 0 && (
                <p className="text-xs line-through opacity-70">{formatBRL(subtotal)}/mês</p>
              )}
              <p className="font-display text-3xl font-semibold leading-none">
                {formatBRL(total)}
                <span className="ml-1 text-sm font-normal opacity-80">/mês</span>
              </p>
              {allSelected && savings > 0 && (
                <p className="mt-1 text-xs font-medium text-accent">
                  Economia de {formatBRL(savings)}/mês
                </p>
              )}
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              aria-disabled={selectedIds.length === 0}
              onClick={(e) => {
                if (selectedIds.length === 0) e.preventDefault();
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-soft transition ${
                selectedIds.length === 0 ? "cursor-not-allowed opacity-60" : "hover:opacity-90"
              }`}
            >
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

const steps = [
  {
    title: "Cadastre sua especialidade",
    body: "Diga seu nome, CRM ou CRO, especialidade e cidade. Leva 2 minutos.",
  },
  {
    title: "Escolha seu pacote",
    body: "Comece pelo que mais dói — Presença, Clinic, Pay, Flow ou Contábil. Adicione os outros quando quiser, ou vá direto no One.",
  },
  {
    title: "Publique e conecte",
    body: "Site no ar, agenda sincronizada, cobranças e notas funcionando. Pronto.",
  },
];
