import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, Globe, Calendar, Sparkles, Megaphone, Star,
  ClipboardList, Stethoscope, Mail, Building2, LogOut,
  Users, Video, FileText, ClipboardCheck, Wallet, Link2, FileSignature,
  Package, MessageSquare, Phone, Bell, Gift, Smile, TrendingUp,
  Receipt, Banknote, CreditCard, Building, FileBarChart, Workflow, Calculator,
  ListChecks, PlugZap, ShieldCheck, BarChart3, HandCoins,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Pkg = "clinic" | "pay" | "flow" | "contabil" | "presenca" | "core";
type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; pkg: Pkg };
type NavGroup = { label: string; items: NavItem[] };

const pkgBadge: Record<Pkg, { label: string; color: string }> = {
  core:     { label: "Core",     color: "bg-muted text-muted-foreground" },
  clinic:   { label: "Clinic",   color: "bg-blue-500/15 text-blue-600" },
  pay:      { label: "Pay",      color: "bg-emerald-500/15 text-emerald-600" },
  flow:     { label: "Flow",     color: "bg-violet-500/15 text-violet-600" },
  contabil: { label: "Contábil", color: "bg-amber-500/15 text-amber-700" },
  presenca: { label: "Presença", color: "bg-pink-500/15 text-pink-600" },
};

const groups: NavGroup[] = [
  { label: "Visão", items: [
    { to: "/dashboard", label: "Painel", icon: LayoutDashboard, pkg: "core" },
    { to: "/setup", label: "Central de configuração", icon: ListChecks, pkg: "core" },
    { to: "/integracoes", label: "Integrações", icon: PlugZap, pkg: "core" },
    { to: "/bi", label: "BI", icon: TrendingUp, pkg: "core" },
  ]},
  { label: "Clinic — Atendimento", items: [
    { to: "/agenda", label: "Agenda", icon: Calendar, pkg: "clinic" },
    { to: "/recepcao", label: "Recepção", icon: ClipboardCheck, pkg: "clinic" },
    { to: "/pacientes", label: "Pacientes", icon: Users, pkg: "clinic" },
    { to: "/prontuario", label: "Prontuário", icon: Stethoscope, pkg: "clinic" },
    { to: "/anamnese", label: "Anamnese", icon: ClipboardList, pkg: "clinic" },
    { to: "/teleconsulta", label: "Teleconsulta", icon: Video, pkg: "clinic" },
    { to: "/prescricoes", label: "Prescrições", icon: FileText, pkg: "clinic" },
    { to: "/modelos", label: "Modelos de documentos", icon: FileText, pkg: "clinic" },
    { to: "/planos", label: "Planos de tratamento", icon: ClipboardCheck, pkg: "clinic" },
    { to: "/estoque", label: "Estoque", icon: Package, pkg: "clinic" },
    { to: "/unidades", label: "Unidades", icon: Building2, pkg: "clinic" },
  ]},
  { label: "Pay — Financeiro", items: [
    { to: "/financeiro", label: "Caixa", icon: Wallet, pkg: "pay" },
    { to: "/pagamentos", label: "Pagamentos online", icon: Link2, pkg: "pay" },
    { to: "/maquininhas", label: "Maquininhas (TEF)", icon: CreditCard, pkg: "pay" },
    { to: "/orcamentos", label: "Orçamentos", icon: FileSignature, pkg: "pay" },
    { to: "/repasses", label: "Repasses", icon: Banknote, pkg: "pay" },
    { to: "/convenios", label: "Convênios", icon: Building, pkg: "pay" },
    { to: "/tiss", label: "Guias TISS", icon: FileBarChart, pkg: "pay" },
  ]},
  { label: "Flow — Relacionamento", items: [
    { to: "/whatsapp-agente", label: "Agente WhatsApp", icon: MessageSquare, pkg: "flow" },
    { to: "/automacoes", label: "Automações", icon: Workflow, pkg: "flow" },
    { to: "/jornadas", label: "Jornadas IA", icon: Workflow, pkg: "flow" },
    { to: "/lembretes", label: "Lembretes", icon: Bell, pkg: "flow" },
    { to: "/indicacoes", label: "Indicações", icon: Gift, pkg: "flow" },
    { to: "/nps", label: "NPS", icon: Smile, pkg: "flow" },
    { to: "/chat", label: "Chat interno", icon: MessageSquare, pkg: "flow" },
    { to: "/callcenter", label: "Call center", icon: Phone, pkg: "flow" },
  ]},
  { label: "Presença — Marketing", items: [
    { to: "/site", label: "Site", icon: Globe, pkg: "presenca" },
    { to: "/conteudo", label: "Conteúdo", icon: Sparkles, pkg: "presenca" },
    { to: "/anuncios", label: "Anúncios", icon: Megaphone, pkg: "presenca" },
    { to: "/email", label: "E-mail mkt", icon: Mail, pkg: "presenca" },
    { to: "/reputacao", label: "Reputação", icon: Star, pkg: "presenca" },
  ]},
  { label: "Contábil — Fiscal", items: [
    { to: "/contador", label: "Painel contábil", icon: Calculator, pkg: "contabil" },
    { to: "/fiscal", label: "NFS-e", icon: FileText, pkg: "contabil" },
    { to: "/tributos", label: "Tributos", icon: Receipt, pkg: "contabil" },
    { to: "/dre", label: "DRE", icon: BarChart3, pkg: "contabil" },
    { to: "/folha", label: "Folha de pagamento", icon: HandCoins, pkg: "contabil" },
  ]},
  { label: "Configuração", items: [
    { to: "/equipe", label: "Equipe & permissões", icon: ShieldCheck, pkg: "core" },
  ]},
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar p-3 lg:flex overflow-y-auto">
        <div className="px-2 py-2">
          <BrandMark to="/dashboard" />
        </div>
        <nav className="mt-4 flex flex-1 flex-col gap-4">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{g.label}</p>
              <div className="flex flex-col gap-0.5">
                {g.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  const b = pkgBadge[item.pkg];
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="flex-1">{item.label}</span>
                      {item.pkg !== "core" && active && (
                        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase", b.color)}>{b.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
