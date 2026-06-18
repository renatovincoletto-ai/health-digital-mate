import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Preços — SaúdeOS" },
      {
        name: "description",
        content: "Planos simples e transparentes para médicos, dentistas e clínicas.",
      },
      { property: "og:title", content: "Preços — SaúdeOS" },
      {
        property: "og:description",
        content: "Comece grátis. Pague conforme cresce.",
      },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Essencial",
    price: "R$ 197",
    period: "/mês",
    description: "Para o profissional autônomo que quer presença digital de verdade.",
    features: [
      "Site profissional com IA",
      "Agenda integrada com Google e Outlook",
      "Lembretes por WhatsApp e email",
      "SEO local otimizado",
      "Compliance CFM/CFO/LGPD",
    ],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Crescimento",
    price: "R$ 497",
    period: "/mês",
    description: "Adiciona marketing autônomo: redes sociais e anúncios.",
    features: [
      "Tudo do Essencial",
      "Brand kit + gerador de peças",
      "Calendário editorial automático",
      "Publicação Instagram, Facebook, LinkedIn",
      "Gestão de reputação no Google",
      "Pix e cobrança de sinal",
    ],
    cta: "Começar grátis",
    highlight: true,
  },
  {
    name: "Clínica",
    price: "Sob consulta",
    period: "",
    description: "Multi-profissional, multi-unidade, anúncios e relatórios consolidados.",
    features: [
      "Tudo do Crescimento",
      "Google Ads e Meta Ads geridos por IA",
      "Multi-profissional e multi-unidade",
      "Dashboard de ROI por canal",
      "Onboarding assistido",
      "Suporte prioritário",
    ],
    cta: "Falar com o time",
    highlight: false,
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container-page flex h-16 items-center justify-between">
          <BrandMark />
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
        </div>
      </header>

      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Preços</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Cresça no seu ritmo.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            14 dias grátis em qualquer plano. Sem cartão. Cancele quando quiser.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-7 ${
                p.highlight
                  ? "border-primary bg-surface-elevated shadow-lift"
                  : "border-border bg-surface-elevated"
              }`}
            >
              {p.highlight && (
                <span className="mb-4 self-start rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  Mais popular
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-6">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className={`mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  p.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border bg-background hover:bg-accent/10"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
