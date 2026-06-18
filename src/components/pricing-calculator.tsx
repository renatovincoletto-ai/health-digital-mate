import { useMemo, useState } from "react";
import { Calculator, Users, Building2, UserPlus } from "lucide-react";
import {
  PACKAGE_PRICES,
  PATIENT_PACKS,
  computeQuote,
  fmtBRL,
  type PackageKey,
  type PatientPackKey,
} from "@/lib/pricing";

type Props = {
  defaultPackage?: PackageKey;
  onSave?: (state: {
    package_key: PackageKey;
    professionals: number;
    units: number;
    patient_pack: PatientPackKey;
  }) => void;
  saving?: boolean;
};

export function PricingCalculator({ defaultPackage = "one", onSave, saving }: Props) {
  const [pkg, setPkg] = useState<PackageKey>(defaultPackage);
  const [professionals, setProfessionals] = useState(1);
  const [units, setUnits] = useState(1);
  const [pack, setPack] = useState<PatientPackKey>("starter");

  const quote = useMemo(
    () => computeQuote({ package_key: pkg, professionals, units, patient_pack: pack }),
    [pkg, professionals, units, pack],
  );

  return (
    <div className="rounded-3xl border border-border bg-surface-elevated p-6 md:p-8">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-display text-2xl font-semibold">Calculadora do seu plano</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        +5% por profissional adicional · +50% por unidade adicional · escolha o pacote de pacientes.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pacote</span>
          <select
            value={pkg}
            onChange={(e) => setPkg(e.target.value as PackageKey)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          >
            {Object.entries(PACKAGE_PRICES).map(([k, v]) => (
              <option key={k} value={k}>{v.name} — {fmtBRL(v.price)}/mês</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pacote de pacientes</span>
          <select
            value={pack}
            onChange={(e) => setPack(e.target.value as PatientPackKey)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          >
            {Object.entries(PATIENT_PACKS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name} — {v.limit} {v.price > 0 ? `(+${fmtBRL(v.price)}/mês)` : "(incluso)"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Profissionais
          </span>
          <input
            type="number" min={1} value={professionals}
            onChange={(e) => setProfessionals(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <span className="mt-1 block text-xs text-muted-foreground">1 incluso · cada adicional = +5%</span>
        </label>

        <label className="block">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> Unidades
          </span>
          <input
            type="number" min={1} value={units}
            onChange={(e) => setUnits(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <span className="mt-1 block text-xs text-muted-foreground">1 inclusa · cada adicional = +50%</span>
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-background p-5">
        <ul className="space-y-1.5 text-sm">
          <Line label={`Base (${PACKAGE_PRICES[pkg].name}, 1 prof, 1 unid)`} value={quote.base_price} />
          <Line label={`+ Profissionais adicionais (${professionals - 1} × 5%)`} value={quote.professionals_surcharge} />
          <Line label={`+ Unidades adicionais (${units - 1} × 50%)`} value={quote.units_surcharge} />
          <Line label={`+ Pacote pacientes (${PATIENT_PACKS[pack].name})`} value={quote.patient_pack_price} />
        </ul>
        <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total mensal estimado</span>
          <span className="font-display text-4xl font-semibold">{fmtBRL(quote.total_monthly)}</span>
        </div>
      </div>

      {onSave && (
        <button
          onClick={() => onSave({ package_key: pkg, professionals, units, patient_pack: pack })}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {saving ? "Salvando…" : "Salvar simulação"}
        </button>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{fmtBRL(value)}</span>
    </li>
  );
}
