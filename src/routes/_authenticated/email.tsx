import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Sparkles, Save, Loader2, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listEmailData, saveCampaign, generateCampaignContent, addContact } from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/email")({
  component: EmailPage,
});

function EmailPage() {
  const fetchAll = useServerFn(listEmailData);
  const saveFn = useServerFn(saveCampaign);
  const genFn = useServerFn(generateCampaignContent);
  const addFn = useServerFn(addContact);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["email"], queryFn: () => fetchAll() });

  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [pre, setPre] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");

  const genMut = useMutation({
    mutationFn: () => genFn({ data: { topic } }),
    onSuccess: (r) => { setSubject(r.subject); setPre(r.preheader); setBody(r.body_html); setName(topic); toast.success("Conteúdo gerado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { name, subject, preheader: pre, body_html: body, audience: "all" } }),
    onSuccess: () => { toast.success("Campanha salva como rascunho"); qc.invalidateQueries({ queryKey: ["email"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addContactMut = useMutation({
    mutationFn: () => addFn({ data: { email: contactEmail, name: contactName, tags: [] } }),
    onSuccess: () => { toast.success("Contato adicionado"); setContactEmail(""); setContactName(""); qc.invalidateQueries({ queryKey: ["email"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">E-mail marketing</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Campanhas e base de contatos</h1>
          <p className="mt-1.5 text-muted-foreground">Crie campanhas com IA, dentro das normas dos conselhos e da LGPD.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-display text-lg font-semibold">Nova campanha</h2>
            <div className="mt-4 flex gap-2">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema (ex: 'campanha de prevenção bucal')" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => genMut.mutate()} disabled={genMut.isPending || !topic} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome interno" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={pre} onChange={(e) => setPre(e.target.value)} placeholder="Preheader" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Corpo HTML" rows={10} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-xs" />
              {body && <div className="rounded-lg border border-border bg-background p-4"><div className="text-xs font-semibold mb-2 text-muted-foreground">Pré-visualização</div><div dangerouslySetInnerHTML={{ __html: body }} /></div>}
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !name || !subject} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar rascunho
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h3 className="font-display font-semibold flex items-center gap-2"><Mail className="h-4 w-4" /> Campanhas ({data?.campaigns.length ?? 0})</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data?.campaigns.map((c) => (
                  <li key={c.id} className="rounded-lg bg-background px-3 py-2">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.status} · {c.recipients_count} destinatários</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h3 className="font-display font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Contatos ({data?.contacts.length ?? 0})</h3>
              <div className="mt-3 space-y-2">
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-mail" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <button onClick={() => addContactMut.mutate()} disabled={!contactEmail || addContactMut.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" /> Adicionar contato
                </button>
              </div>
              <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto text-xs">
                {data?.contacts.map((c) => (
                  <li key={c.id} className="rounded bg-background px-2 py-1.5">
                    <p className="font-medium">{c.name ?? c.email}</p>
                    <p className="text-muted-foreground">{c.email}</p>
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
