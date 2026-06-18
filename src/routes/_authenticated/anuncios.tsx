import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Megaphone, BarChart3, Plus, Loader2, Trash2, Wand2, Play, Pause, Eye, MousePointerClick, Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listCampaigns, saveCampaign, deleteCampaign, suggestCampaignCopy,
} from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/anuncios")({
  component: AdsPage,
});

const PLATFORMS = [
  { v: "google_search", label: "Google Search" },
  { v: "google_pmax", label: "Google Performance Max" },
  { v: "meta_instagram", label: "Instagram Ads" },
  { v: "meta_facebook", label: "Facebook Ads" },
];
const OBJECTIVES = [
  { v: "leads", label: "Captação de leads" },
  { v: "agendamentos", label: "Agendamentos online" },
  { v: "site_visits", label: "Visitas ao site" },
  { v: "reconhecimento", label: "Reconhecimento de marca" },
];

function AdsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampaigns);
  const saveFn = useServerFn(saveCampaign);
  const delFn = useServerFn(deleteCampaign);
  const sugFn = useServerFn(suggestCampaignCopy);
  const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [suggesting, setSuggesting] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({
      name: "", platform: "google_search", objective: "leads",
      status: "draft", daily_budget_cents: 5000,
    });
    setOpen(true);
  }
  function openEdit(c: any) {
    setEditing(c);
    setForm({ ...c });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: (d: any) => saveFn({ data: d }),
    onSuccess: () => {
      toast.success("Campanha salva");
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  async function suggest() {
    if (!form.headline && !form.description) {
      const briefing = prompt("Descreva brevemente o que essa campanha deve oferecer:");
      if (!briefing) return;
      setSuggesting(true);
      try {
        const r = await sugFn({
          data: { platform: form.platform, objective: form.objective, briefing },
        });
        setForm({ ...form, headline: r.headline, description: r.description, audience: r.audience });
        toast.success("Sugestão pronta");
      } catch (e: any) { toast.error(e.message); }
      finally { setSuggesting(false); }
    }
  }

  // ROI rollup
  const totals = campaigns.reduce(
    (acc: any, c: any) => {
      const m = c.metrics ?? {};
      acc.impressions += m.impressions ?? 0;
      acc.clicks += m.clicks ?? 0;
      acc.leads += m.leads ?? 0;
      acc.spend += m.spend_cents ?? 0;
      return acc;
    },
    { impressions: 0, clicks: 0, leads: 0, spend: 0 },
  );
  const activeCount = campaigns.filter((c: any) => c.status === "active").length;

  return (
    <AppShell>
      <div className="container-page py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Anúncios</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Google Ads & Meta Ads</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Crie, programe e acompanhe campanhas de captação de pacientes.
            </p>
          </div>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova campanha</Button>
        </div>

        {/* ROI cards */}
        <div className="mb-8 grid gap-3 md:grid-cols-4">
          <Stat icon={Megaphone} label="Ativas" value={String(activeCount)} />
          <Stat icon={Eye} label="Impressões" value={totals.impressions.toLocaleString("pt-BR")} />
          <Stat icon={MousePointerClick} label="Cliques" value={totals.clicks.toLocaleString("pt-BR")} />
          <Stat icon={Users} label="Leads" value={totals.leads.toLocaleString("pt-BR")} />
        </div>

        <div className="rounded-xl border border-border bg-surface-elevated">
          {campaigns.length === 0 ? (
            <div className="p-10 text-center">
              <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((c: any) => (
                <div key={c.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{c.name}</p>
                      <CampaignStatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {PLATFORMS.find((p) => p.v === c.platform)?.label} ·{" "}
                      {OBJECTIVES.find((o) => o.v === c.objective)?.label}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium">R$ {(c.daily_budget_cents / 100).toFixed(2)}/dia</p>
                    <p className="text-muted-foreground">
                      {c.metrics?.leads ?? 0} leads · R$ {((c.metrics?.spend_cents ?? 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                    <Button variant="ghost" size="icon"
                      onClick={() => confirm("Excluir campanha?") && remove.mutate(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          ⚡ Para publicar diretamente no Google Ads e Meta Ads, conecte suas contas na próxima onda.
          Hoje, as campanhas ficam organizadas aqui com copy assistida por IA.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} campanha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome interno *</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plataforma</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p.v} value={p.v}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objetivo</Label>
                <Select value={form.objective} onValueChange={(v) => setForm({ ...form, objective: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Orçamento diário (R$)</Label>
                <Input type="number" step="0.01"
                  value={(form.daily_budget_cents ?? 0) / 100}
                  onChange={(e) => setForm({ ...form, daily_budget_cents: Math.round(Number(e.target.value) * 100) })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="ended">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Copy do anúncio</Label>
              <Button type="button" size="sm" variant="ghost" onClick={suggest} disabled={suggesting}>
                {suggesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                Sugerir com IA
              </Button>
            </div>
            <div>
              <Label className="text-xs">Headline (30 chars)</Label>
              <Input maxLength={30} value={form.headline ?? ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Descrição (90 chars)</Label>
              <Textarea rows={2} maxLength={90} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Público-alvo</Label>
              <Textarea rows={2} value={form.audience ?? ""} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="ex: mulheres 30-55, Pinheiros, interessadas em estética dental" />
            </div>
            <div>
              <Label className="text-xs">URL de destino</Label>
              <Input type="url" value={form.landing_url ?? ""} onChange={(e) => setForm({ ...form, landing_url: e.target.value })}
                placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <Icon className="mb-2 h-4 w-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-emerald-500/10 text-emerald-600",
    paused: "bg-yellow-500/10 text-yellow-600",
    ended: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = { draft: "rascunho", active: "ativa", paused: "pausada", ended: "encerrada" };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${map[status]}`}>{labels[status]}</span>;
}
