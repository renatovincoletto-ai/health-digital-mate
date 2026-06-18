import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Check, Sparkles, Wallet, Megaphone, Calendar, Workflow,
  Calculator, Users, Building2, User, ShieldCheck, Loader2,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PATIENT_PACKS, type PatientPackKey, fmtBRL } from "@/lib/pricing";

type PkgId = "presenca" | "clinic" | "pay" | "flow" | "contabil";

const PACKAGES: { id: PkgId; title: string; tagline: string; price: number; icon: typeof Calendar }[] = [
  { id: "presenca", title: "Presença Digital", tagline: "Site + Marketing IA", price: 197, icon: Megaphone },
  { id: "clinic",   title: "Clinic",            tagline: "Agenda + Prontuário",  price: 297, icon: Calendar },
  { id: "pay",      title: "Pay",               tagline: "Pagamentos + Maquininha", price: 247, icon: Wallet },
  { id: "flow",     title: "Flow",              tagline: "WhatsApp + Automação", price: 197, icon: Workflow },
  { id: "contabil", title: "Contábil",          tagline: "Fiscal + Folha + DRE", price: 349, icon: Calculator },
];

export const Route = createFileRoute("/assinar")({
  validateSearch: (s: Record<string, unknown>) => ({
    pkgs: typeof s.pkgs === "string" ? s.pkgs : "presenca,clinic,pay,flow,contabil",
  }),
  head: () => ({
    meta: [
      { title: "Assinar — Minha Clínica" },
      { name: "description", content: "Monte seu plano: escolha pacotes, profissionais, unidades e finalize o pagamento." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: AssinarPage,
});

function AssinarPage() {
  const { pkgs } = Route.useSearch();
  const initial = useMemo(() => {
    const set = new Set(pkgs.split(",").filter(Boolean) as PkgId[]);
    const out = {} as Record<PkgId, boolean>;
    PACKAGES.forEach((p) => { out[p.id] = set.size === 0 ? true : set.has(p.id); });
    return out;
  }, [pkgs]);

  const [selected, setSelected] = useState<Record<PkgId, boolean>>(initial);
  const [mode, setMode] = useState<"solo" | "equipe">("solo");
  const [professionals, setProfessionals] = useState(1);
  const [units, setUnits] = useState(1);
  const [pack, setPack] = useState<PatientPackKey>("starter");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const selectedIds = PACKAGES.filter((p) => selected[p.id]).map((p) => p.id);
  const count = selectedIds.length;
  const allSelected = count === PACKAGES.length;
  const subtotal = PACKAGES.reduce((s, p) => selected[p.id] ? s + p.price : s, 0);
  const bundleDiscount = Math.min(count * 0.05, 0.25);
  const baseAfterBundle = subtotal * (1 - bundleDiscount);

  const profs = mode === "solo" ? 1 : Math.max(1, professionals);
  const uns = mode === "solo" ? 1 : Math.max(1, units);
  const profMul = 1 + (profs - 1) * 0.05;
  const unitMul = 1 + (uns - 1) * 0.5;
  const adjusted = baseAfterBundle * profMul * unitMul;
  const patientPrice = PATIENT_PACKS[pack].price;
  const total = Math.round(adjusted + patientPrice);
  const savings = Math.round(subtotal - baseAfterBundle);

  function handleCheckout() {
    setLoading(true);
    // Salva escolha no localStorage para retomar pós-cadastro
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mc:checkout", JSON.stringify({
        packages: selectedIds, mode, professionals: profs, units: uns,
        patient_pack: pack, total_monthly: total, ts: Date.now(),
      }));
    }
    // Redireciona para cadastro; após autenticar volta para finalizar pagamento
    window.location.href = `/auth?mode=signup&next=/assinar/pagamento`;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container-page flex items-center justify-between py-4">
          <BrandMark to="/" />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <div className="container-page max-w-5xl py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Assinar Minha Clínica</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Monte seu plano em 2 passos</h1>
          <ol className="mt-4 flex items-center gap-3 text-sm">
            <Step n={1} label="Pacotes e equipe" active={step === 1} done={step === 2} onClick={() => setStep(1)} />
            <span className="h-px flex-1 bg-border" />
            <Step n={2} label="Pagamento" active={step === 2} done={false} onClick={() => count > 0 && setStep(2)} />
          </ol>
        </div>

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <Card title="1. Quais pacotes você quer?" desc="Combine os que precisar. Desconto progressivo de até 25%.">
                <div className="grid gap-2.5">
                  {PACKAGES.map((p) => {
                    const isOn = selected[p.id];
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected((s) => ({ ...s, [p.id]: !s[p.id] }))}
                        aria-pressed={isOn}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          isOn ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/70 hover:border-primary/40"
                        }`}
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{p.tagline}</p>
                          <p className="font-display text-base font-semibold">{p.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-sm font-semibold">{fmtBRL(p.price)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                        </div>
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${isOn ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                          {isOn && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {count > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {count} pacote{count > 1 ? "s" : ""} selecionado{count > 1 ? "s" : ""} · economia de {Math.round(bundleDiscount * 100)}% ({fmtBRL(savings)}/mês)
                  </p>
                )}
              </Card>

              <Card title="2. Você é..." desc="Isso define como dimensionamos o sistema.">
                <div className="grid grid-cols-2 gap-2.5">
                  <ModeCard
                    icon={User} label="Apenas eu" desc="1 profissional · 1 unidade"
                    active={mode === "solo"} onClick={() => setMode("solo")}
                  />
                  <ModeCard
                    icon={Users} label="Tenho equipe" desc="Vários profissionais ou unidades"
                    active={mode === "equipe"} onClick={() => setMode("equipe")}
                  />
                </div>

                {mode === "equipe" && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <NumberField
                      icon={Users} label="Profissionais" value={professionals}
                      onChange={setProfessionals} hint="1 incluso · +5% por adicional"
                    />
                    <NumberField
                      icon={Building2} label="Unidades" value={units}
                      onChange={setUnits} hint="1 inclusa · +50% por adicional"
                    />
                  </div>
                )}
              </Card>

              <Card title="3. Quantos pacientes ativos?">
                <div className="grid gap-2">
                  {(Object.entries(PATIENT_PACKS) as [PatientPackKey, typeof PATIENT_PACKS["starter"]][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPack(k)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition ${
                        pack === k ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.limit}</p>
                      </div>
                      <p className="font-display text-sm font-semibold">
                        {v.price === 0 ? "Incluso" : `+${fmtBRL(v.price)}/mês`}
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Summary
                count={count} allSelected={allSelected} subtotal={subtotal}
                bundleDiscount={bundleDiscount} total={total} savings={savings}
                profs={profs} units={uns} pack={pack}
              />
              <button
                disabled={count === 0}
                onClick={() => setStep(2)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                Ir para pagamento <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-border bg-surface-elevated p-7">
              <h2 className="font-display text-2xl font-semibold">Finalizar pagamento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Para liberar o acesso ao sistema, crie sua conta e conclua o pagamento. Você pode cancelar a qualquer momento.
              </p>

              <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Garantia de 7 dias</p>
                    <p className="text-muted-foreground">Se não gostar, devolvemos 100% do valor.</p>
                  </div>
                </div>
              </div>

              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Acesso imediato após o pagamento",
                  "Importação assistida da sua base atual",
                  "Treinamento ao vivo com a equipe",
                  "Suporte humano via WhatsApp",
                ].map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {it}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Criar conta e pagar {fmtBRL(total)}/mês
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Pagamento seguro via cartão ou Pix. Renovação mensal automática.
              </p>

              <button
                onClick={() => setStep(1)}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar e editar plano
              </button>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Summary
                count={count} allSelected={allSelected} subtotal={subtotal}
                bundleDiscount={bundleDiscount} total={total} savings={savings}
                profs={profs} units={uns} pack={pack}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Step({ n, label, active, done, onClick }: { n: number; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
        active ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      }`}>{done ? <Check className="h-3.5 w-3.5" /> : n}</span>
      <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
    </button>
  );
}

function ModeCard({ icon: Icon, label, desc, active, onClick }: {
  icon: typeof User; label: string; desc: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick} type="button"
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
        active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/70 hover:border-primary/40"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function NumberField({ icon: Icon, label, value, onChange, hint }: {
  icon: typeof Users; label: string; value: number; onChange: (n: number) => void; hint: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <div className="mt-1.5 flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(1, value - 1))}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:bg-accent/10">−</button>
        <input
          type="number" min={1} value={value}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-sm"
        />
        <button type="button" onClick={() => onChange(value + 1)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:bg-accent/10">+</button>
      </div>
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}

function Summary({ count, allSelected, subtotal, bundleDiscount, total, savings, profs, units, pack }: {
  count: number; allSelected: boolean; subtotal: number; bundleDiscount: number;
  total: number; savings: number; profs: number; units: number; pack: PatientPackKey;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resumo do plano</p>
      <p className="mt-2 font-display text-lg font-semibold">
        {count === 0 ? "Nenhum pacote" : allSelected ? "Minha Clínica Total" : `${count} pacote${count > 1 ? "s" : ""}`}
      </p>
      <ul className="mt-4 space-y-1.5 text-sm">
        <Line label="Pacotes (subtotal)" value={subtotal} />
        {bundleDiscount > 0 && <Line label={`Desconto combo (${Math.round(bundleDiscount * 100)}%)`} value={-savings} />}
        <Line label={`Profissionais (${profs})`} hint={profs > 1 ? `+${(profs - 1) * 5}%` : "incluso"} />
        <Line label={`Unidades (${units})`} hint={units > 1 ? `+${(units - 1) * 50}%` : "inclusa"} />
        <Line label={`Pacientes: ${PATIENT_PACKS[pack].name}`} value={PATIENT_PACKS[pack].price} />
      </ul>
      <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total/mês</span>
        <span className="font-display text-3xl font-semibold">{fmtBRL(total)}</span>
      </div>
    </div>
  );
}

function Line({ label, value, hint }: { label: string; value?: number; hint?: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {value !== undefined ? (
        <span className="tabular-nums">{value < 0 ? `− ${fmtBRL(-value)}` : fmtBRL(value)}</span>
      ) : (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </li>
  );
}
