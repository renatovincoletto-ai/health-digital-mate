import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Stethoscope, Wallet, Sparkles, Calculator, Megaphone, Layers } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PricingCalculator } from "@/components/pricing-calculator";


export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Pacotes & Preços — Minha Clínica" },
      { name: "description", content: "Clinic, Pay, Flow, Contábil, Presença. Monte seu Minha Clínica — ou leve tudo no pacote One." },
      { property: "og:title", content: "Pacotes & Preços — Minha Clínica" },
      { property: "og:description", content: "5 pacotes especializados + bundle One. Comece grátis." },
    ],
  }),
  component: PricingPage,
});

const packages = [
  {
    key: "presenca",
    icon: Megaphone,
    color: "from-pink-500 to-fuchsia-500",
    name: "Presença",
    price: "R$ 197",
    tagline: "Atraia mais pacientes",
    features: ["Site profissional com IA", "Conteúdo e SEO local", "Anúncios Google/Meta", "E-mail marketing", "Reputação Google/Doctoralia"],
  },
  {
    key: "clinic",
    icon: Stethoscope,
    color: "from-blue-500 to-cyan-500",
    name: "Clinic",
    price: "R$ 297",
    tagline: "Opere a clínica",
    features: ["Agenda multi-profissional", "Prontuário + Anamnese", "Prescrição digital + QR", "Teleconsulta integrada", "Estoque e multi-unidade"],
  },
  {
    key: "pay",
    icon: Wallet,
    color: "from-emerald-500 to-teal-500",
    name: "Pay",
    price: "R$ 247",
    tagline: "Receba e repasse",
    features: ["Caixa e fluxo financeiro", "Pix, link, maquininha (TEF)", "Repasse a profissionais", "Orçamentos digitais", "Convênios + Guias TISS"],
  },
  {
    key: "flow",
    icon: Sparkles,
    color: "from-violet-500 to-purple-500",
    name: "Flow",
    price: "R$ 197",
    tagline: "Engaje o paciente",
    features: ["Jornadas automáticas com IA", "Lembretes WhatsApp/SMS/e-mail", "Programa de indicação", "NPS pós-consulta", "Portal do paciente (PWA)"],
  },
  {
    key: "contabil",
    icon: Calculator,
    color: "from-amber-500 to-orange-500",
    name: "Contábil",
    price: "R$ 349",
    tagline: "Fique em dia",
    features: ["Emissão de NFS-e (ISS auto)", "DAS, IRPJ, INSS, ISS", "Painel para o contador", "Suporte fiscal humano"],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container-page flex h-16 items-center justify-between">
          <BrandMark />
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Entrar</Link>
        </div>
      </header>

      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pacotes</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">Monte seu Minha Clínica.</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Cinco pacotes especializados que funcionam sozinhos ou juntos. Comece com o que você precisa hoje, ative o resto quando crescer.
          </p>
        </div>

        {/* Bundle One */}
        <div className="mt-14 rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/10 via-surface-elevated to-accent/10 p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span className="rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Mais popular</span>
              </div>
              <h2 className="mt-3 font-display text-4xl font-semibold">Minha Clínica Total</h2>
              <p className="mt-2 text-muted-foreground">Os 5 pacotes integrados + BI executivo + onboarding assistido + suporte prioritário.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground line-through">R$ 1.287/mês</p>
              <p className="font-display text-5xl font-semibold">R$ 897<span className="text-lg text-muted-foreground">/mês</span></p>
              <p className="text-xs text-muted-foreground">economia de 30%</p>
              <Link to="/auth" search={{ mode: "signup" }} className="mt-4 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Começar grátis</Link>
            </div>
          </div>
        </div>

        {/* 5 packages */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <div key={p.key} className="flex flex-col rounded-2xl border border-border bg-surface-elevated p-6">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white`}>
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-5">
                <span className="font-display text-3xl font-semibold">{p.price}</span>
                <span className="text-muted-foreground">/mês</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/10">
                Ativar {p.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <PricingCalculator defaultPackage="one" />
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Todos os pacotes incluem 14 dias grátis · sem cartão · LGPD e compliance CFM/CFO incluídos.
        </p>
      </section>
    </div>
  );
}
