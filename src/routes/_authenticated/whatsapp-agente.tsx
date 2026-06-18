import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, Send, Bot, User, Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  listWhatsappConversations,
  getWhatsappThread,
  sendPatientMessage,
  setWhatsappStatus,
} from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/_authenticated/whatsapp-agente")({
  component: WhatsappAgentePage,
});

function WhatsappAgentePage() {
  const listFn = useServerFn(listWhatsappConversations);
  const threadFn = useServerFn(getWhatsappThread);
  const sendFn = useServerFn(sendPatientMessage);
  const statusFn = useServerFn(setWhatsappStatus);
  const qc = useQueryClient();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const { data: conversations } = useQuery({
    queryKey: ["wa-conversations"],
    queryFn: () => listFn(),
    refetchInterval: 8000,
  });

  const { data: thread } = useQuery({
    queryKey: ["wa-thread", activeId],
    queryFn: () => activeId ? threadFn({ data: { conversation_id: activeId } }) : null,
    enabled: !!activeId,
    refetchInterval: 4000,
  });

  const sendMut = useMutation({
    mutationFn: () => sendFn({ data: { patient_phone: phone, patient_name: name || undefined, text } }),
    onSuccess: (res) => {
      setText("");
      setActiveId(res.conversation_id);
      qc.invalidateQueries({ queryKey: ["wa-conversations"] });
      qc.invalidateQueries({ queryKey: ["wa-thread", res.conversation_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handoff = useMutation({
    mutationFn: (status: "active" | "handoff" | "closed") =>
      statusFn({ data: { id: activeId!, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wa-conversations"] }),
  });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Grow · WhatsApp</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Agente de marcação por WhatsApp</h1>
          <p className="mt-1.5 text-muted-foreground">A IA conversa com o paciente, consulta sua agenda real e marca consultas. Use o sandbox para testar agora — a entrega real liga depois pelo Twilio.</p>
        </header>

        <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/5 p-4 text-sm">
          <p className="font-medium">Modo sandbox</p>
          <p className="mt-1 text-muted-foreground">As mensagens não saem para o WhatsApp real ainda. Conecte o Twilio para ativar entrega/recebimento. Tudo abaixo já usa seus profissionais, regras de disponibilidade e cria appointments de verdade.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Lista */}
          <aside className="rounded-2xl border border-border bg-surface-elevated p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display font-semibold"><MessageCircle className="h-4 w-4" /> Conversas</h3>
            <div className="space-y-1.5">
              {conversations?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conversa ainda. Simule abaixo.</p>}
              {conversations?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${activeId === c.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-accent/5"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{c.patient_name || c.patient_phone}</span>
                    <span className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 ${c.status === "handoff" ? "bg-warning/15 text-warning" : c.status === "closed" ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"}`}>{c.status}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.patient_phone} · {new Date(c.last_message_at).toLocaleString("pt-BR")}</p>
                </button>
              ))}
            </div>
          </aside>

          {/* Conversa + sandbox */}
          <section className="rounded-2xl border border-border bg-surface-elevated p-4">
            {activeId && thread?.conversation && (
              <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="font-display font-semibold">{thread.conversation.patient_name || thread.conversation.patient_phone}</p>
                  <p className="text-xs text-muted-foreground">{thread.conversation.patient_phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handoff.mutate("handoff")} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs"><PhoneCall className="h-3 w-3" /> Assumir</button>
                  <button onClick={() => handoff.mutate("closed")} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs">Encerrar</button>
                  <button onClick={() => handoff.mutate("active")} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs">Devolver à IA</button>
                </div>
              </div>
            )}

            <div className="max-h-[420px] min-h-[260px] space-y-3 overflow-y-auto rounded-lg bg-background p-4">
              {!activeId && <p className="text-sm text-muted-foreground">Selecione uma conversa, ou simule uma mensagem de paciente abaixo.</p>}
              {thread?.messages?.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === "patient" ? "" : "flex-row-reverse"}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "patient" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                    {m.role === "patient" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "patient" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                    <p className="whitespace-pre-line">{m.content}</p>
                    {m.tool_calls != null && (
                      <details className="mt-1 text-[10px] opacity-70">
                        <summary className="cursor-pointer">tools chamadas</summary>
                        <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(m.tool_calls, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sandbox · enviar como paciente</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone (com DDI/DDD)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (opcional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && phone && text) { e.preventDefault(); sendMut.mutate(); } }}
                  placeholder="Olá, quero marcar uma consulta para quinta de manhã…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => sendMut.mutate()}
                  disabled={sendMut.isPending || !phone || !text}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
