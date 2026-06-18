import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listMessages, sendMessage } from "@/lib/wave6.functions";

export const Route = createFileRoute("/_authenticated/chat")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMessages);
  const sendFn = useServerFn(sendMessage);
  const [channel, setChannel] = useState("general");
  const [text, setText] = useState("");
  const { data = [] } = useQuery({ queryKey: ["msgs", channel], queryFn: () => listFn({ data: { channel } }), refetchInterval: 5000 });
  const m = useMutation({
    mutationFn: () => sendFn({ data: { channel, content: text } }),
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["msgs", channel] }); },
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operação</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Chat interno</h1>
          <p className="mt-1.5 text-muted-foreground">Conversa em tempo real entre profissionais e secretárias.</p>
        </header>
        <div className="mb-4 flex gap-2">
          {["general", "secretaria", "clinico"].map(c => (
            <button key={c} onClick={() => setChannel(c)} className={`rounded-lg px-3 py-1.5 text-sm capitalize ${channel === c ? "bg-primary text-primary-foreground" : "border border-border"}`}>#{c}</button>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-surface-elevated">
          <div className="h-[480px] overflow-y-auto p-4 space-y-2">
            {data.map((msg: any) => (
              <div key={msg.id} className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">{msg.sender_id.slice(0, 8)} · {new Date(msg.created_at).toLocaleTimeString("pt-BR")}</p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-muted-foreground">Sem mensagens neste canal.</p>}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && text && m.mutate()} placeholder="Mensagem..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => m.mutate()} disabled={!text} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
