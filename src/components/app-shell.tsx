import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, Globe, Calendar, Sparkles, Megaphone, Star,
  ClipboardList, Stethoscope, Mail, Building2, LogOut,
  Users, Video, FileText, ClipboardCheck, Wallet, Link2, FileSignature,
  Package, MessageSquare, Phone, Bell, Gift, Smile, TrendingUp,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Visão", items: [
    { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { to: "/bi", label: "BI", icon: TrendingUp },
  ]},
  { label: "Atendimento", items: [
    { to: "/agenda", label: "Agenda", icon: Calendar },
    { to: "/pacientes", label: "Pacientes", icon: Users },
    { to: "/prontuario", label: "Prontuário", icon: Stethoscope },
    { to: "/anamnese", label: "Anamnese", icon: ClipboardList },
    { to: "/teleconsulta", label: "Teleconsulta", icon: Video },
    { to: "/prescricoes", label: "Prescrições", icon: FileText },
    { to: "/planos", label: "Planos", icon: ClipboardCheck },
  ]},
  { label: "Financeiro", items: [
    { to: "/financeiro", label: "Caixa", icon: Wallet },
    { to: "/pagamentos", label: "Pagamentos", icon: Link2 },
    { to: "/orcamentos", label: "Orçamentos", icon: FileSignature },
  ]},
  { label: "Operação", items: [
    { to: "/estoque", label: "Estoque", icon: Package },
    { to: "/chat", label: "Chat interno", icon: MessageSquare },
    { to: "/callcenter", label: "Call center", icon: Phone },
    { to: "/unidades", label: "Unidades", icon: Building2 },
  ]},
  { label: "Crescimento", items: [
    { to: "/site", label: "Site", icon: Globe },
    { to: "/conteudo", label: "Conteúdo", icon: Sparkles },
    { to: "/anuncios", label: "Anúncios", icon: Megaphone },
    { to: "/email", label: "E-mail mkt", icon: Mail },
    { to: "/lembretes", label: "Lembretes", icon: Bell },
    { to: "/indicacoes", label: "Indicações", icon: Gift },
    { to: "/reputacao", label: "Reputação", icon: Star },
    { to: "/nps", label: "NPS", icon: Smile },
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
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-sidebar p-3 lg:flex overflow-y-auto">
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
                      {item.label}
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
