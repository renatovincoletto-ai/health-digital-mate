export type PackageKey = "presenca" | "clinic" | "pay" | "flow" | "contabil" | "one";

export const PACKAGE_PRICES: Record<PackageKey, { name: string; price: number }> = {
  presenca: { name: "Presença", price: 197 },
  clinic: { name: "Clinic", price: 297 },
  pay: { name: "Pay", price: 247 },
  flow: { name: "Flow", price: 197 },
  contabil: { name: "Contábil", price: 349 },
  one: { name: "SaúdeOS One", price: 897 },
};

export type PatientPackKey = "starter" | "pro" | "scale" | "ilimitado";

export const PATIENT_PACKS: Record<PatientPackKey, { name: string; limit: string; price: number }> = {
  starter: { name: "Starter", limit: "até 200 pacientes ativos", price: 0 },
  pro: { name: "Pro", limit: "até 1.000 pacientes ativos", price: 79 },
  scale: { name: "Scale", limit: "até 5.000 pacientes ativos", price: 199 },
  ilimitado: { name: "Ilimitado", limit: "pacientes ilimitados", price: 399 },
};

export function computeQuote(opts: {
  package_key: PackageKey;
  professionals: number;
  units: number;
  patient_pack: PatientPackKey;
}) {
  const pkg = PACKAGE_PRICES[opts.package_key];
  const base = pkg.price;
  const profs = Math.max(1, opts.professionals);
  const units = Math.max(1, opts.units);
  const profMultiplier = 1 + (profs - 1) * 0.05; // +5% por profissional adicional
  const unitMultiplier = 1 + (units - 1) * 0.5; // +50% por unidade adicional
  const adjustedBase = base * profMultiplier * unitMultiplier;
  const professionals_surcharge = base * profMultiplier - base;
  const units_surcharge = adjustedBase - base * profMultiplier;
  const patient_pack_price = PATIENT_PACKS[opts.patient_pack].price;
  const total_monthly = adjustedBase + patient_pack_price;
  return {
    base_price: round(base),
    professionals_surcharge: round(professionals_surcharge),
    units_surcharge: round(units_surcharge),
    patient_pack_price: round(patient_pack_price),
    total_monthly: round(total_monthly),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
