import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bug, HelpCircle, Lightbulb, MessageSquare, ChevronUp, Plus } from "lucide-react";
import {
  listTickets, createTicket, updateTicket, deleteTicket, voteTicket,
  listComments, addComment,
} from "@/lib/tickets.functions";

export const Route = createFileRoute("/_authenticated/tasks")({ component: TasksPage });

const KIND_META: Record<string, { label: string; icon: any; color: string }> = {
  bug: { label: "Problema", icon: Bug, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
  duvida: { label: "Dúvida", icon: HelpCircle, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  melhoria: { label: "Melhoria", icon: Lightbulb, color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  outro: { label: "Outro", icon: MessageSquare, color: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  em_progresso: "Em progresso",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

const PRIORITY_LABEL: Record<string, string> = {
  baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica",
};

function TasksPage() {
  const qc = useQueryClient();
  const list = useServerFn(listTickets);
  const [status, setStatus] = useState<string>("todos");
  const [kind, setKind] = useState<string>("todos");
  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", status, kind],
    queryFn: () => list({ data: { status: status as any, kind: kind as any } }),
  });
  const [open, setOpen] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks & Feedback</h1>
            <p className="text-sm text-muted-foreground">Reporte problemas, tire dúvidas e sugira melhorias do sistema.</p>
          </div>
          <NewTicketDialog onCreated={() => qc.invalidateQueries({ queryKey: ["tickets"] })} />
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(KIND_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="outline">{tickets.length} chamados</Badge>
        </div>

        <div className="grid gap-3">
          {tickets.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum chamado encontrado.</CardContent></Card>
          )}
          {tickets.map((t: any) => {
            const meta = KIND_META[t.kind] ?? KIND_META.outro;
            const Icon = meta.icon;
            return (
              <Card key={t.id} className="hover:border-primary/40">
                <CardContent className="flex gap-4 p-4">
                  <VoteButton ticket={t} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${meta.color}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                      <Badge variant="outline">{STATUS_LABEL[t.status]}</Badge>
                      <Badge variant="secondary">{PRIORITY_LABEL[t.priority]}</Badge>
                      {t.module && <Badge variant="outline">{t.module}</Badge>}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <button
                      onClick={() => setOpen(t.id)}
                      className="mt-1 block text-left text-base font-medium hover:underline"
                    >
                      {t.title}
                    </button>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {open && <TicketDialog id={open} onClose={() => setOpen(null)} />}
      </div>
    </AppShell>
  );
}

function VoteButton({ ticket }: { ticket: any }) {
  const qc = useQueryClient();
  const vote = useServerFn(voteTicket);
  const mut = useMutation({
    mutationFn: (delta: number) => vote({ data: { id: ticket.id, delta } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
  return (
    <button
      onClick={() => mut.mutate(1)}
      className="flex h-14 w-12 flex-col items-center justify-center rounded-md border bg-card hover:bg-accent"
    >
      <ChevronUp className="h-4 w-4" />
      <span className="text-sm font-semibold">{ticket.votes ?? 0}</span>
    </button>
  );
}

function NewTicketDialog({ onCreated }: { onCreated: () => void }) {
  const [openD, setOpenD] = useState(false);
  const create = useServerFn(createTicket);
  const [form, setForm] = useState<any>({ kind: "bug", priority: "media", title: "", description: "", module: "" });
  const mut = useMutation({
    mutationFn: () => create({ data: { ...form, module: form.module || undefined } }),
    onSuccess: () => {
      toast.success("Chamado registrado");
      setForm({ kind: "bug", priority: "media", title: "", description: "", module: "" });
      setOpenD(false);
      onCreated();
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={openD} onOpenChange={setOpenD}>
      <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Novo chamado</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Abrir novo chamado</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KIND_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resumo curto" />
          </div>
          <div>
            <Label>Módulo (opcional)</Label>
            <Input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} placeholder="agenda, financeiro, prontuário…" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o problema, dúvida ou ideia com o máximo de detalhes."
            />
          </div>
          <Button
            className="w-full"
            disabled={!form.title.trim() || form.description.trim().length < 5 || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Enviando…" : "Registrar chamado"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const list = useServerFn(listComments);
  const add = useServerFn(addComment);
  const upd = useServerFn(updateTicket);
  const del = useServerFn(deleteTicket);

  const { data: comments = [] } = useQuery({ queryKey: ["ticket-comments", id], queryFn: () => list({ data: { ticket_id: id } }) });
  const ticket = (qc.getQueriesData({ queryKey: ["tickets"] }).flatMap(([_, v]) => (v as any[]) ?? []) as any[]).find((t) => t.id === id);
  const [body, setBody] = useState("");

  const addMut = useMutation({
    mutationFn: () => add({ data: { ticket_id: id, body } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["ticket-comments", id] }); },
  });
  const statusMut = useMutation({
    mutationFn: (status: string) => upd({ data: { id, status: status as any } }),
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["tickets"] }); },
  });
  const delMut = useMutation({
    mutationFn: () => del({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["tickets"] }); onClose(); },
  });

  if (!ticket) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{ticket.title}</DialogTitle></DialogHeader>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{STATUS_LABEL[ticket.status]}</Badge>
              <Badge variant="secondary">{PRIORITY_LABEL[ticket.priority]}</Badge>
              {ticket.module && <Badge variant="outline">{ticket.module}</Badge>}
            </div>
            <CardDescription>Aberto em {new Date(ticket.created_at).toLocaleString("pt-BR")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <Label className="mr-1">Mudar status:</Label>
          <Select value={ticket.status} onValueChange={(v) => statusMut.mutate(v)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => delMut.mutate()}>
            Excluir
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Comentários ({comments.length})</h4>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {comments.map((c: any) => (
              <div key={c.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="whitespace-pre-wrap">{c.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>}
          </div>
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Adicionar comentário…" />
          <Button disabled={!body.trim() || addMut.isPending} onClick={() => addMut.mutate()}>Comentar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
