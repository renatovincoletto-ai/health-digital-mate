import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Sparkles, Save, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listAnamneseTemplates, saveAnamneseTemplate, generateAnamneseTemplate, listAnamneseResponses } from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/anamnese")({
  component: AnamnesePage,
});

type Question = { id: string; label: string; type: "text" | "textarea" | "boolean" | "select"; options?: string[]; required: boolean };

function AnamnesePage() {
  const fetchTemplates = useServerFn(listAnamneseTemplates);
  const fetchResponses = useServerFn(listAnamneseResponses);
  const saveFn = useServerFn(saveAnamneseTemplate);
  const genFn = useServerFn(generateAnamneseTemplate);
  const qc = useQueryClient();
  const { data: templates } = useQuery({ queryKey: ["anamnese-templates"], queryFn: () => fetchTemplates() });
  const { data: responses } = useQuery({ queryKey: ["anamnese-responses"], queryFn: () => fetchResponses() });

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [specialty, setSpecialty] = useState("");

  const genMut = useMutation({
    mutationFn: () => genFn({ data: { specialty } }),
    onSuccess: (r) => { setName(r.name); setDesc(r.description); setQuestions(r.questions); toast.success("Modelo gerado pela IA"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { name, description: desc, questions, active: true } }),
    onSuccess: () => { toast.success("Modelo salvo"); setName(""); setDesc(""); setQuestions([]); qc.invalidateQueries({ queryKey: ["anamnese-templates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Prontuário</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Anamnese digital</h1>
          <p className="mt-1.5 text-muted-foreground">Pacientes preenchem antes da consulta, com consentimento LGPD. Link público: <code className="rounded bg-surface px-1.5 py-0.5">/s/SEU-SLUG/anamnese</code></p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold">Criar modelo</h2>
            <div className="mt-4 flex gap-2">
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Especialidade (ex: Dermatologia)" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => genMut.mutate()} disabled={genMut.isPending || !specialty} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar com IA
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do modelo" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perguntas ({questions.length})</p>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{i + 1}. {q.label} {q.required && <span className="text-destructive">*</span>}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{q.type}{q.options ? ` · ${q.options.join(", ")}` : ""}</p>
                      </div>
                      <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="text-xs text-muted-foreground hover:text-destructive">remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !name || questions.length === 0} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar modelo
            </button>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h3 className="font-display font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Modelos ({templates?.length ?? 0})</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {templates?.map((t) => (
                  <li key={t.id} className="rounded-lg bg-background px-3 py-2">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{Array.isArray(t.questions) ? t.questions.length : 0} perguntas · {t.active ? "ativo" : "inativo"}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h3 className="font-display font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Últimas respostas</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {responses?.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma resposta ainda.</p>}
                {responses?.map((r) => (
                  <li key={r.id} className="rounded-lg bg-background px-3 py-2">
                    <p className="font-medium">{r.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
