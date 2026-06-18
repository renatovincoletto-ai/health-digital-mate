import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPublicAnamnese, submitAnamnese } from "@/lib/wave5.functions";

export const Route = createFileRoute("/s/$slug/anamnese")({
  head: ({ loaderData }) => {
    const d = loaderData as { tenant?: { display_name: string } } | undefined;
    const title = `Anamnese · ${d?.tenant?.display_name ?? "Consultório"}`;
    return { meta: [{ title }, { name: "description", content: "Preencha sua anamnese antes da consulta." }] };
  },
  loader: async ({ params }) => {
    const { getPublicAnamnese } = await import("@/lib/wave5.functions");
    const r = await getPublicAnamnese({ data: { slug: params.slug } });
    if (!r || !r.tenant) throw notFound();
    return r;
  },
  component: AnamnesePublic,
});

type Question = { id: string; label: string; type: string; options?: string[]; required: boolean };

function AnamnesePublic() {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const submitFn = useServerFn(submitAnamnese);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  const template = data.template as { id: string; name: string; description: string | null; questions: Question[] } | null;

  const submitMut = useMutation({
    mutationFn: () => submitFn({ data: {
      slug: params.slug, template_id: template!.id, patient_name: name,
      patient_email: email, patient_phone: phone, answers, lgpd_consent: true,
    } }),
    onSuccess: () => setDone(true),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold">Anamnese indisponível</h1>
          <p className="mt-2 text-muted-foreground">Este consultório ainda não publicou um modelo.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 font-display text-3xl font-semibold">Recebemos sua anamnese</h1>
          <p className="mt-2 text-muted-foreground">Obrigado, {name.split(" ")[0]}. O consultório foi notificado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-10">
      <div className="mx-auto max-w-2xl px-4">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{data.tenant.display_name}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{template.name}</h1>
          {template.description && <p className="mt-1.5 text-muted-foreground">{template.description}</p>}
        </header>

        <form onSubmit={(e) => { e.preventDefault(); if (!consent) { toast.error("É obrigatório aceitar o termo LGPD"); return; } submitMut.mutate(); }} className="space-y-5">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {template.questions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-border bg-surface-elevated p-5">
              <label className="block text-sm font-medium">{q.label} {q.required && <span className="text-destructive">*</span>}</label>
              {q.type === "textarea" && <textarea required={q.required} rows={3} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />}
              {q.type === "text" && <input required={q.required} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />}
              {q.type === "boolean" && (
                <div className="mt-3 flex gap-3">
                  {["Sim", "Não"].map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm"><input type="radio" name={q.id} value={o} onChange={() => setAnswers({ ...answers, [q.id]: o })} required={q.required} /> {o}</label>
                  ))}
                </div>
              )}
              {q.type === "select" && (
                <select required={q.required} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Selecione…</option>
                  {q.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
            </div>
          ))}

          <label className="flex items-start gap-2 rounded-2xl border border-border bg-surface-elevated p-5 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span><ShieldCheck className="mr-1 inline h-4 w-4 text-primary" /> Autorizo o tratamento dos meus dados de saúde nos termos da LGPD, exclusivamente para fins de atendimento por este consultório.</span>
          </label>

          <button type="submit" disabled={submitMut.isPending || !consent} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground disabled:opacity-50">
            {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enviar anamnese
          </button>
        </form>
      </div>
    </div>
  );
}
