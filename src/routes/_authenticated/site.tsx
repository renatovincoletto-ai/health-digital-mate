import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Loader2,
  Send,
  Globe,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { getMySite, sendAssistantMessage, togglePublish } from "@/lib/site.functions";

export const Route = createFileRoute("/_authenticated/site")({
  component: SiteBuilder,
});

function SiteBuilder() {
  const fetchSite = useServerFn(getMySite);
  const send = useServerFn(sendAssistantMessage);
  const publish = useServerFn(togglePublish);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["my-site"],
    queryFn: () => fetchSite(),
  });

  useEffect(() => {
    if (!isLoading && !data) navigate({ to: "/onboarding" });
  }, [isLoading, data, navigate]);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];

  const sendMutation = useMutation({
    mutationFn: async (message: string) => send({ data: { message } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-site"] });
      setInput("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const publishMutation = useMutation({
    mutationFn: async (published: boolean) => publish({ data: { published } }),
    onSuccess: (_, published) => {
      queryClient.invalidateQueries({ queryKey: ["my-site"] });
      queryClient.invalidateQueries({ queryKey: ["my-tenant"] });
      toast.success(published ? "Site publicado!" : "Site despublicado");
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sendMutation.isPending]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(input.trim());
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { tenant, site } = data;
  const content = site?.content as Record<string, unknown> | undefined;
  const hero = content?.hero as { headline?: string; subheadline?: string } | undefined;
  const services = (content?.services ?? []) as { title: string; description: string }[];

  return (
    <AppShell>
      <div className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface-elevated px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Site</p>
                <h1 className="font-display text-lg font-semibold leading-tight">
                  {tenant.display_name}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/s/$slug"
              params={{ slug: tenant.slug }}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent/10"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Visualizar
            </Link>
            <button
              onClick={() => publishMutation.mutate(!site?.published)}
              disabled={publishMutation.isPending}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${
                site?.published
                  ? "border border-border bg-background hover:bg-accent/10"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {site?.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {site?.published ? "Despublicar" : "Publicar"}
            </button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[420px_1fr]">
          {/* Chat */}
          <aside className="flex flex-col border-r border-border bg-sidebar">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-5">
                  <Sparkles className="mb-2 h-5 w-5 text-accent" />
                  <p className="text-sm font-medium">
                    Olá! Sou o assistente do seu site.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Me conte sobre seu consultório, o que oferece, seu diferencial. Eu vou
                    montando o site enquanto a gente conversa.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sugestoes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setInput(s)}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-surface-elevated text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando e atualizando o site...
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="border-t border-border p-4">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as FormEvent);
                    }
                  }}
                  rows={2}
                  placeholder="Peça uma mudança ou adicione uma seção..."
                  className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sendMutation.isPending}
                  className="self-end rounded-lg bg-primary px-3.5 py-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </aside>

          {/* Preview */}
          <section className="overflow-y-auto bg-muted/30 p-6">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-lift">
              <div className="border-b border-border bg-surface-elevated px-4 py-2 text-xs text-muted-foreground">
                Pré-visualização · /s/{tenant.slug}
              </div>
              <div className="p-10">
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
                  {hero?.headline || "Headline"}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">{hero?.subheadline}</p>

                {services.length > 0 && (
                  <div className="mt-10">
                    <h3 className="mb-4 font-display text-xl font-semibold">Serviços</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {services.map((s, i) => (
                        <div key={i} className="rounded-xl border border-border p-4">
                          <p className="font-medium">{s.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-10 text-xs text-muted-foreground">
                  Pré-visualização simplificada. Clique em "Visualizar" para ver o site completo.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

const sugestoes = [
  "Deixa o tom mais acolhedor",
  "Adiciona uma seção de FAQ",
  "Foca em pacientes pediátricos",
  "Reforça meu diferencial em ortodontia",
];
