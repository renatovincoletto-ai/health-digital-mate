import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Sparkles, Send, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listReviews, addReview, suggestReviewReply, scheduleReviewRequest } from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/reputacao")({
  component: ReputationPage,
});

function ReputationPage() {
  const fetchAll = useServerFn(listReviews);
  const addFn = useServerFn(addReview);
  const replyFn = useServerFn(suggestReviewReply);
  const requestFn = useServerFn(scheduleReviewRequest);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["reviews"], queryFn: () => fetchAll() });

  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");

  const addMut = useMutation({
    mutationFn: (input: { rating: number; author_name: string; content: string }) =>
      addFn({ data: { rating: input.rating, author_name: input.author_name, content: input.content, source: "direct" } }),
    onSuccess: () => { toast.success("Avaliação registrada"); setAuthor(""); setContent(""); qc.invalidateQueries({ queryKey: ["reviews"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMut = useMutation({
    mutationFn: (id: string) => replyFn({ data: { review_id: id } }),
    onSuccess: () => { toast.success("Resposta sugerida pela IA"); qc.invalidateQueries({ queryKey: ["reviews"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reqMut = useMutation({
    mutationFn: () => requestFn({ data: { patient_name: reqName, patient_phone: reqPhone, channel: "whatsapp" } }),
    onSuccess: () => { toast.success("Solicitação enfileirada"); setReqName(""); setReqPhone(""); qc.invalidateQueries({ queryKey: ["reviews"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const avg = data?.reviews.length ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1) : "—";

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reputação</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Avaliações & respostas com IA</h1>
          <p className="mt-1.5 text-muted-foreground">Solicite avaliações após cada consulta e responda com tom profissional, dentro das normas dos conselhos.</p>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Stat label="Score médio" value={avg} icon={<Star className="h-5 w-5 text-accent" />} />
          <Stat label="Avaliações" value={String(data?.reviews.length ?? 0)} />
          <Stat label="Solicitações enviadas" value={String(data?.requests.length ?? 0)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold">Solicitar avaliação</h2>
            <p className="mt-1 text-sm text-muted-foreground">Envio automático via WhatsApp após a consulta.</p>
            <div className="mt-4 space-y-3">
              <input value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Nome do paciente" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="WhatsApp (DDD + número)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => reqMut.mutate()} disabled={reqMut.isPending || !reqName} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {reqMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Solicitar
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold">Registrar avaliação manualmente</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-accent" : "text-muted-foreground"}><Star className="h-6 w-6" fill={n <= rating ? "currentColor" : "none"} /></button>
                ))}
              </div>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Comentário" rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => addMut.mutate({ rating, author_name: author, content })} disabled={addMut.isPending} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
          </section>
        </div>

        <h2 className="mt-10 mb-4 font-display text-xl font-semibold">Histórico</h2>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
          <div className="space-y-3">
            {data?.reviews.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>}
            {data?.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-surface-elevated p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-accent">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}
                    </div>
                    <p className="mt-1 text-sm font-medium">{r.author_name ?? "Anônimo"} · <span className="text-muted-foreground">{r.source}</span></p>
                  </div>
                  <button onClick={() => replyMut.mutate(r.id)} disabled={replyMut.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> Sugerir resposta
                  </button>
                </div>
                {r.content && <p className="mt-3 text-sm text-foreground">{r.content}</p>}
                {r.reply && <div className="mt-3 rounded-lg bg-primary/5 p-3 text-sm"><span className="font-medium">Resposta:</span> {r.reply}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold">{icon}{value}</p>
    </div>
  );
}
