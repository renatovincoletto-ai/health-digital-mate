import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CreditCard, FileText, Stethoscope, Landmark, PlugZap, CheckCircle2, AlertCircle } from "lucide-react";
import {
  listIntegrations, saveIntegration, testIntegration,
  createPaymentLink, listPaymentLinks, simulatePaymentReceived,
  issueNfse, syncOpenFinance,
} from "@/lib/wave4.functions";

export const Route = createFileRoute("/_authenticated/integracoes")({
  component: IntegracoesPage,
});

type Provider = "asaas" | "focus_nfe" | "memed" | "pluggy";

const META: Record<Provider, { name: string; desc: string; icon: any; color: string }> = {
  asaas:     { name: "Asaas",     desc: "Cobrança via Pix, boleto, cartão e split de pagamento", icon: CreditCard, color: "text-emerald-600 bg-emerald-500/10" },
  focus_nfe: { name: "Focus NFe", desc: "Emissão automática de NFS-e por município",             icon: FileText,   color: "text-blue-600 bg-blue-500/10" },
  memed:     { name: "Memed",     desc: "Prescrição digital com validade jurídica e QR CFM",     icon: Stethoscope,color: "text-violet-600 bg-violet-500/10" },
  pluggy:    { name: "Pluggy",    desc: "Open Finance — conciliação automática do extrato",      icon: Landmark,   color: "text-amber-600 bg-amber-500/10" },
};

function IntegracoesPage() {
  const list = useServerFn(listIntegrations);
  const { data: integrations = [] } = useQuery({ queryKey: ["integrations"], queryFn: () => list() });
  const byProvider = (p: Provider) => integrations.find((i: any) => i.provider === p);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Integrações</h1>
            <p className="text-sm text-muted-foreground">
              Conectores fiscais e de pagamento. Todos iniciam em <strong>sandbox</strong> (simulação) — ative o modo real
              quando tiver as credenciais.
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5"><PlugZap className="h-3.5 w-3.5" /> 4 conectores disponíveis</Badge>
        </header>

        <Tabs defaultValue="asaas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="asaas">Pagamentos</TabsTrigger>
            <TabsTrigger value="focus_nfe">NFS-e</TabsTrigger>
            <TabsTrigger value="memed">Prescrição</TabsTrigger>
            <TabsTrigger value="pluggy">Open Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="asaas" className="space-y-4">
            <ProviderConfig provider="asaas" integration={byProvider("asaas")} />
            <AsaasPanel />
          </TabsContent>
          <TabsContent value="focus_nfe" className="space-y-4">
            <ProviderConfig provider="focus_nfe" integration={byProvider("focus_nfe")} />
            <FocusNfePanel />
          </TabsContent>
          <TabsContent value="memed" className="space-y-4">
            <ProviderConfig provider="memed" integration={byProvider("memed")} />
            <MemedPanel />
          </TabsContent>
          <TabsContent value="pluggy" className="space-y-4">
            <ProviderConfig provider="pluggy" integration={byProvider("pluggy")} />
            <PluggyPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function ProviderConfig({ provider, integration }: { provider: Provider; integration: any }) {
  const meta = META[provider];
  const Icon = meta.icon;
  const qc = useQueryClient();
  const save = useServerFn(saveIntegration);
  const test = useServerFn(testIntegration);
  const [status, setStatus] = useState<"sandbox" | "active" | "inactive">(integration?.status ?? "sandbox");
  const [email, setEmail] = useState(integration?.account_email ?? "");
  const [apiKey, setApiKey] = useState(integration?.metadata?.api_key ?? "");

  const saveMut = useMutation({
    mutationFn: () => save({ data: { provider, status, account_email: email || undefined, metadata: { api_key: apiKey } } }),
    onSuccess: () => { toast.success("Conector salvo"); qc.invalidateQueries({ queryKey: ["integrations"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const testMut = useMutation({
    mutationFn: () => test({ data: { provider } }),
    onSuccess: (r: any) => r.ok ? toast.success(r.message) : toast.error(r.message),
  });

  const isLive = status === "active";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{meta.name}</CardTitle>
              <CardDescription>{meta.desc}</CardDescription>
            </div>
          </div>
          {integration ? (
            <Badge variant={isLive ? "default" : "secondary"} className="gap-1">
              {isLive ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {isLive ? "Ativo (real)" : status === "sandbox" ? "Sandbox" : "Inativo"}
            </Badge>
          ) : (
            <Badge variant="outline">Não configurado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Modo</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (simulação)</SelectItem>
                <SelectItem value="active">Ativo (chamadas reais)</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>E-mail da conta</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@clinica.com" />
          </div>
          <div>
            <Label>API key {isLive && <span className="text-destructive">*</span>}</Label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="••••••••" type="password" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Salvando..." : "Salvar configuração"}
          </Button>
          <Button variant="outline" onClick={() => testMut.mutate()} disabled={!integration || testMut.isPending}>
            Testar conexão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AsaasPanel() {
  const qc = useQueryClient();
  const create = useServerFn(createPaymentLink);
  const listLinks = useServerFn(listPaymentLinks);
  const simulate = useServerFn(simulatePaymentReceived);
  const { data: links = [] } = useQuery({ queryKey: ["payment-links"], queryFn: () => listLinks() });
  const [amount, setAmount] = useState("250");
  const [desc, setDesc] = useState("Consulta");

  const createMut = useMutation({
    mutationFn: () => create({ data: { amount: Number(amount), description: desc, method: "any", expires_in_days: 7 } }),
    onSuccess: () => { toast.success("Link de pagamento criado"); qc.invalidateQueries({ queryKey: ["payment-links"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const simMut = useMutation({
    mutationFn: (id: string) => simulate({ data: { id } }),
    onSuccess: () => { toast.success("Pagamento marcado como recebido"); qc.invalidateQueries({ queryKey: ["payment-links"] }); },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Gerar link de cobrança</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div><Label>Valor (R$)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" /></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        </div>
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          {createMut.isPending ? "Gerando..." : "Gerar link"}
        </Button>
        <div className="space-y-2">
          {links.length === 0 && <p className="text-sm text-muted-foreground">Nenhum link gerado ainda.</p>}
          {links.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">R$ {Number(l.amount).toFixed(2)} · {l.description ?? "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {l.url ? <a href={l.url} target="_blank" rel="noreferrer" className="underline">{l.url}</a> : "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={l.status === "paid" ? "default" : "secondary"}>{l.status}</Badge>
                {l.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => simMut.mutate(l.id)}>Simular pago</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FocusNfePanel() {
  const issue = useServerFn(issueNfse);
  const [form, setForm] = useState({ amount: "250", description: "Consulta médica", taker_name: "", taker_document: "", taker_email: "", iss_rate: "0.03" });
  const issueMut = useMutation({
    mutationFn: () => issue({ data: {
      amount: Number(form.amount), description: form.description,
      taker_name: form.taker_name, taker_document: form.taker_document, taker_email: form.taker_email || undefined,
      iss_rate: Number(form.iss_rate), service_code: "17.06",
    } }),
    onSuccess: (r: any) => toast.success(`NFS-e ${r.number ?? "enviada"} (${r.sandbox ? "sandbox" : "real"})`),
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Emitir NFS-e</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><Label>Valor</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} type="number" /></div>
          <div><Label>Alíquota ISS</Label><Input value={form.iss_rate} onChange={(e) => setForm({ ...form, iss_rate: e.target.value })} type="number" step="0.001" /></div>
          <div className="md:col-span-2"><Label>Descrição do serviço</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Nome do tomador</Label><Input value={form.taker_name} onChange={(e) => setForm({ ...form, taker_name: e.target.value })} /></div>
          <div><Label>CPF/CNPJ</Label><Input value={form.taker_document} onChange={(e) => setForm({ ...form, taker_document: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>E-mail (opcional)</Label><Input value={form.taker_email} onChange={(e) => setForm({ ...form, taker_email: e.target.value })} /></div>
        </div>
        <Button onClick={() => issueMut.mutate()} disabled={issueMut.isPending}>
          {issueMut.isPending ? "Emitindo..." : "Emitir NFS-e"}
        </Button>
      </CardContent>
    </Card>
  );
}

function MemedPanel() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Memed — Prescrição digital</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>A criação de prescrições assinadas com Memed acontece dentro do prontuário do paciente. Use a aba <strong>Prescrições</strong> para emitir uma receita com validade jurídica e QR Code CFM.</p>
        <p>Em modo sandbox, o PDF e o QR são simulados localmente para validar o fluxo.</p>
      </CardContent>
    </Card>
  );
}

function PluggyPanel() {
  const qc = useQueryClient();
  const sync = useServerFn(syncOpenFinance);
  const [autoSync, setAutoSync] = useState(true);
  const syncMut = useMutation({
    mutationFn: () => sync({}),
    onSuccess: (r: any) => { toast.success(`${r.imported} transações importadas`); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Conciliação Open Finance</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Sincronização automática diária</div>
            <div className="text-xs text-muted-foreground">Importa o extrato bancário todo dia às 03:00</div>
          </div>
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </div>
        <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
          {syncMut.isPending ? "Sincronizando..." : "Sincronizar agora"}
        </Button>
      </CardContent>
    </Card>
  );
}
