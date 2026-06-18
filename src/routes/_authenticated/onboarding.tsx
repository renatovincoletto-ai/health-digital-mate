import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { createTenant, getMyTenant } from "@/lib/tenant.functions";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const fetchTenant = useServerFn(getMyTenant);
  const create = useServerFn(createTenant);
  const { data: existing, isLoading: checking } = useQuery({
    queryKey: ["my-tenant"],
    queryFn: () => fetchTenant(),
  });

  if (!checking && existing) {
    navigate({ to: "/dashboard" });
  }

  const [type, setType] = useState<"medico" | "dentista" | "clinica">("medico");
  const [displayName, setDisplayName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [councilType, setCouncilType] = useState("CRM");
  const [councilNumber, setCouncilNumber] = useState("");
  const [councilState, setCouncilState] = useState("");
  const [city, setCity] = useState("");
  const [stateUF, setStateUF] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await create({
        data: {
          type,
          display_name: displayName,
          specialty: specialty || undefined,
          council_type: councilType || undefined,
          council_number: councilNumber || undefined,
          council_state: councilState || undefined,
          city: city || undefined,
          state: stateUF || undefined,
          phone: phone || undefined,
          whatsapp: whatsapp || undefined,
        },
      });
      toast.success("Tudo certo. Vamos criar seu site!");
      navigate({ to: "/site" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container-page py-6">
        <BrandMark />
      </div>
      <div className="container-page max-w-2xl pb-16">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Passo 1 de 2
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Configure seu consultório
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-border bg-surface-elevated p-8 shadow-soft"
        >
          <div>
            <p className="mb-2.5 text-sm font-medium">Você é</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["medico", "Médico(a)"],
                ["dentista", "Dentista"],
                ["clinica", "Clínica"],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setType(val);
                    if (val === "dentista") setCouncilType("CRO");
                    else setCouncilType("CRM");
                  }}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    type === val
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-accent/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Nome do consultório ou profissional" value={displayName} onChange={setDisplayName} required placeholder="Dr. Ana Souza" />
          <Field label="Especialidade" value={specialty} onChange={setSpecialty} placeholder="Cardiologia, Ortodontia, Pediatria..." />

          <div className="grid grid-cols-3 gap-3">
            <Field label="Conselho" value={councilType} onChange={setCouncilType} placeholder="CRM" />
            <Field label="Número" value={councilNumber} onChange={setCouncilNumber} placeholder="123456" />
            <Field label="UF" value={councilState} onChange={setCouncilState} placeholder="SP" maxLength={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Cidade" value={city} onChange={setCity} placeholder="São Paulo" />
            </div>
            <Field label="UF" value={stateUF} onChange={setStateUF} placeholder="SP" maxLength={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone" value={phone} onChange={setPhone} placeholder="(11) 0000-0000" />
            <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="(11) 90000-0000" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Continuar para o site
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}
