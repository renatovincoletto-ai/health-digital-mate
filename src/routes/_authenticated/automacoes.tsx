import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Zap, Mail, MessageSquare, Phone, Settings, Play, RefreshCw, X,
  CheckCircle2, AlertTriangle, Clock, Loader2, Plus, Info,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAutomationSettings, saveAutomationSettings,
  listAutomationJobs, getAutomationStats,
  enqueueAutomationJob, retryAutomationJob, cancelAutomationJob, triggerProcessor,
} from "@/lib/wave3.functions";

export const Route = createFileRoute("/_authenticated/automacoes")({
  component: AutomacoesPage,
});

function AutomacoesPage() {
  return (
    <AppShell>
      <div className="container-page py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Automações</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Motor de envios
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Fila unificada para lembretes, jornadas e mensagens — WhatsApp, SMS e e-mail.
          </p>
        </div>

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="queue"><Zap className="mr-2 h-4 w-4" />Fila</TabsTrigger>
            <TabsTrigger value="send"><Plus className="mr-2 h-4 w-4" />Disparo manual</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="queue"><QueueTab /></TabsContent>
          <TabsContent value="send"><SendTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function QueueTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAutomationJobs);
  const statsFn = useServerFn(getAutomationStats);
  const retryFn = useServerFn(retryAutomationJob);
  const cancelFn = useServerFn(cancelAutomationJob);
  const procFn = useServerFn(triggerProcessor);

  const { data = [], isLoading } = useQuery({ queryKey: ["automation-jobs"], queryFn: () => listFn(), refetchInterval: 10000 });
  const { data: stats } = useQuery({ queryKey: ["automation-stats"], queryFn: () => statsFn(), refetchInterval: 10000 });

  const retry = useMutation({
    mutationFn: (id: string) => retryFn({ data: { id } }),
    onSuccess: () => { toast.success("Reenfileirado"); qc.invalidateQueries({ queryKey: ["automation-jobs"] }); },
  });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => { toast.success("Cancelado"); qc.invalidateQueries({ queryKey: ["automation-jobs"] }); },
  });
  const process = useMutation({
    mutationFn: () => procFn(),
    onSuccess: (r: any) => {
      toast.success(`Processados: ${r.processed ?? 0}`);
      qc.invalidateQueries({ queryKey: ["automation-jobs"] });
      qc.invalidateQueries({ queryKey: ["automation-stats"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <div>
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Stat label="Pendentes" value={stats?.pending ?? 0} icon={Clock} tone="warning" />
        <Stat label="Enviados no mês" value={stats?.sentMonth ?? 0} icon={CheckCircle2} tone="success" />
        <Stat label="Falhas" value={stats?.failed ?? 0} icon={AlertTriangle} tone="danger" />
        <Stat label="Total do mês" value={stats?.totalMonth ?? 0} icon={Zap} />
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={() => process.mutate()} disabled={process.isPending}>
          {process.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Processar fila agora
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-10 text-center">
          <Zap className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Fila vazia</p>
          <p className="mt-1 text-sm text-muted-foreground">Quando lembretes, jornadas ou disparos manuais agendarem envios, aparecerão aqui.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Canal</th>
                <th className="px-4 py-3 text-left">Destinatário</th>
                <th className="px-4 py-3 text-left">Assunto / corpo</th>
                <th className="px-4 py-3 text-left">Agendado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((j: any) => (
                <tr key={j.id} className="border-t border-border align-top">
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3"><ChannelBadge channel={j.channel} /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{j.recipient_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{j.recipient}</div>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    {j.subject && <div className="font-medium">{j.subject}</div>}
                    <div className="text-xs text-muted-foreground line-clamp-2">{j.body}</div>
                    {j.last_error && <div className="mt-1 text-xs text-red-600">⚠ {j.last_error}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {new Date(j.scheduled_for).toLocaleString("pt-BR")}
                    {j.attempts > 0 && <div>Tentativas: {j.attempts}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(j.status === "failed" || j.status === "skipped") && (
                      <Button size="sm" variant="ghost" onClick={() => retry.mutate(j.id)}><RefreshCw className="h-4 w-4" /></Button>
                    )}
                    {j.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => cancel.mutate(j.id)}><X className="h-4 w-4" /></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SendTab() {
  const qc = useQueryClient();
  const enqFn = useServerFn(enqueueAutomationJob);
  const [form, setForm] = useState<any>({ channel: "email", kind: "manual", scheduled_for: "" });

  const send = useMutation({
    mutationFn: (d: any) => enqFn({ data: d }),
    onSuccess: () => {
      toast.success("Job adicionado à fila");
      qc.invalidateQueries({ queryKey: ["automation-jobs"] });
      setForm({ channel: "email", kind: "manual", scheduled_for: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  function submit() {
    if (!form.recipient || !form.body) return toast.error("Preencha destinatário e mensagem");
    send.mutate({
      ...form,
      scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : undefined,
    });
  }

  return (
    <div className="max-w-2xl rounded-xl border border-border bg-surface-elevated p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">Disparo manual</h2>
        <p className="text-sm text-muted-foreground">Útil para mensagens pontuais ou para testar a integração.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Canal</Label>
          <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Agendar para (opcional)</Label>
          <Input type="datetime-local" value={form.scheduled_for ?? ""} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} />
        </div>
        <div>
          <Label>Destinatário *</Label>
          <Input placeholder={form.channel === "email" ? "email@exemplo.com" : "+5511999999999"} value={form.recipient ?? ""} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
        </div>
        <div>
          <Label>Nome (opcional)</Label>
          <Input value={form.recipient_name ?? ""} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
        </div>
        {form.channel === "email" && (
          <div className="md:col-span-2">
            <Label>Assunto</Label>
            <Input value={form.subject ?? ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
        )}
        <div className="md:col-span-2">
          <Label>Mensagem *</Label>
          <Textarea rows={5} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={submit} disabled={send.isPending}>
          {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar à fila
        </Button>
      </div>
    </div>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getAutomationSettings);
  const saveFn = useServerFn(saveAutomationSettings);
  const { data, isLoading } = useQuery({ queryKey: ["automation-settings"], queryFn: () => getFn() });
  const [form, setForm] = useState<any>(null);

  if (!isLoading && data && !form) setForm(data);

  const save = useMutation({
    mutationFn: (d: any) => saveFn({ data: d }),
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["automation-settings"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  if (isLoading || !form) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 text-amber-700" />
          <div>
            <p className="font-medium text-amber-800">Modo simulação ativo recomendado</p>
            <p className="mt-1 text-muted-foreground">Em simulação, os jobs marcam como "enviados" sem chamar o provedor. Ideal para testes antes de ligar Resend (e-mail) e Twilio (WhatsApp/SMS).</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-6 space-y-4">
        <Toggle label="Modo simulação (dry-run)" desc="Não envia de verdade — só marca como enviado." checked={form.dry_run} onChange={(v) => setForm({ ...form, dry_run: v })} />
      </div>

      <Section icon={Mail} title="E-mail (Resend)">
        <Toggle label="Habilitado" checked={form.email_enabled} onChange={(v) => setForm({ ...form, email_enabled: v })} />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nome do remetente</Label>
            <Input value={form.email_from_name ?? ""} onChange={(e) => setForm({ ...form, email_from_name: e.target.value })} placeholder="Dr. João Silva" />
          </div>
          <div>
            <Label>E-mail do remetente</Label>
            <Input type="email" value={form.email_from_address ?? ""} onChange={(e) => setForm({ ...form, email_from_address: e.target.value })} placeholder="contato@dominio.com" />
          </div>
        </div>
      </Section>

      <Section icon={MessageSquare} title="WhatsApp (Twilio)">
        <Toggle label="Habilitado" checked={form.whatsapp_enabled} onChange={(v) => setForm({ ...form, whatsapp_enabled: v })} />
        <div>
          <Label>Número WhatsApp 'from' (E.164)</Label>
          <Input value={form.twilio_whatsapp_from ?? ""} onChange={(e) => setForm({ ...form, twilio_whatsapp_from: e.target.value })} placeholder="+14155238886" />
          <p className="mt-1 text-xs text-muted-foreground">Número do Twilio aprovado para WhatsApp Business.</p>
        </div>
      </Section>

      <Section icon={Phone} title="SMS (Twilio)">
        <Toggle label="Habilitado" checked={form.sms_enabled} onChange={(v) => setForm({ ...form, sms_enabled: v })} />
        <div>
          <Label>Número SMS 'from' (E.164)</Label>
          <Input value={form.twilio_from_number ?? ""} onChange={(e) => setForm({ ...form, twilio_from_number: e.target.value })} placeholder="+15017122661" />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar configurações
        </Button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone?: "success" | "warning" | "danger" }) {
  const color = tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : tone === "danger" ? "text-red-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4 flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-display text-xl font-semibold tabular-nums ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: "bg-amber-500/10 text-amber-600",
    processing: "bg-blue-500/10 text-blue-600",
    sent: "bg-emerald-500/10 text-emerald-600",
    failed: "bg-red-500/10 text-red-600",
    skipped: "bg-muted text-muted-foreground",
  };
  return <Badge className={map[status] ?? ""}>{status}</Badge>;
}

function ChannelBadge({ channel }: { channel: string }) {
  const Icon = channel === "email" ? Mail : channel === "whatsapp" ? MessageSquare : Phone;
  return <span className="inline-flex items-center gap-1 text-xs"><Icon className="h-3.5 w-3.5" />{channel}</span>;
}
