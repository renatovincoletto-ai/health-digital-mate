import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard, Globe, Calendar, Sparkles, Megaphone, Star,
  ClipboardList, Stethoscope, Mail, Building2, LogOut,
  Users, Video, FileText, ClipboardCheck, Wallet, Link2, FileSignature,
  Package, MessageSquare, Phone, Bell, Gift, Smile, TrendingUp,
  Receipt, Banknote, CreditCard, Building, FileBarChart, Workflow, Calculator,
  ListChecks, PlugZap, ShieldCheck, BarChart3, HandCoins, DatabaseBackup,
  Search, Languages, Menu, ScrollText,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useI18n, type Locale } from "@/lib/i18n";

type Pkg = "clinic" | "pay" | "flow" | "contabil" | "presenca" | "core";
type NavItem = { to: string; labelKey: string; icon: typeof LayoutDashboard; pkg: Pkg };
type NavGroup = { labelKey: string; items: NavItem[] };

const pkgBadge: Record<Pkg, { label: string; color: string }> = {
  core:     { label: "Core",     color: "bg-muted text-muted-foreground" },
  clinic:   { label: "Clinic",   color: "bg-blue-500/15 text-blue-600" },
  pay:      { label: "Pay",      color: "bg-emerald-500/15 text-emerald-600" },
  flow:     { label: "Flow",     color: "bg-violet-500/15 text-violet-600" },
  contabil: { label: "Contábil", color: "bg-amber-500/15 text-amber-700" },
  presenca: { label: "Presença", color: "bg-pink-500/15 text-pink-600" },
};

const groups: NavGroup[] = [
  { labelKey: "group.visao", items: [
    { to: "/dashboard", labelKey: "item.dashboard", icon: LayoutDashboard, pkg: "core" },
    { to: "/setup", labelKey: "item.setup", icon: ListChecks, pkg: "core" },
    { to: "/integracoes", labelKey: "item.integracoes", icon: PlugZap, pkg: "core" },
    { to: "/bi", labelKey: "item.bi", icon: TrendingUp, pkg: "core" },
  ]},
  { labelKey: "group.clinic", items: [
    { to: "/agenda", labelKey: "item.agenda", icon: Calendar, pkg: "clinic" },
    { to: "/recepcao", labelKey: "item.recepcao", icon: ClipboardCheck, pkg: "clinic" },
    { to: "/pacientes", labelKey: "item.pacientes", icon: Users, pkg: "clinic" },
    { to: "/prontuario", labelKey: "item.prontuario", icon: Stethoscope, pkg: "clinic" },
    { to: "/anamnese", labelKey: "item.anamnese", icon: ClipboardList, pkg: "clinic" },
    { to: "/teleconsulta", labelKey: "item.teleconsulta", icon: Video, pkg: "clinic" },
    { to: "/prescricoes", labelKey: "item.prescricoes", icon: FileText, pkg: "clinic" },
    { to: "/modelos", labelKey: "item.modelos", icon: FileText, pkg: "clinic" },
    { to: "/planos", labelKey: "item.planos", icon: ClipboardCheck, pkg: "clinic" },
    { to: "/estoque", labelKey: "item.estoque", icon: Package, pkg: "clinic" },
    { to: "/unidades", labelKey: "item.unidades", icon: Building2, pkg: "clinic" },
  ]},
  { labelKey: "group.pay", items: [
    { to: "/financeiro", labelKey: "item.financeiro", icon: Wallet, pkg: "pay" },
    { to: "/pagamentos", labelKey: "item.pagamentos", icon: Link2, pkg: "pay" },
    { to: "/maquininhas", labelKey: "item.maquininhas", icon: CreditCard, pkg: "pay" },
    { to: "/orcamentos", labelKey: "item.orcamentos", icon: FileSignature, pkg: "pay" },
    { to: "/repasses", labelKey: "item.repasses", icon: Banknote, pkg: "pay" },
    { to: "/convenios", labelKey: "item.convenios", icon: Building, pkg: "pay" },
    { to: "/tiss", labelKey: "item.tiss", icon: FileBarChart, pkg: "pay" },
  ]},
  { labelKey: "group.flow", items: [
    { to: "/whatsapp-agente", labelKey: "item.whatsapp", icon: MessageSquare, pkg: "flow" },
    { to: "/automacoes", labelKey: "item.automacoes", icon: Workflow, pkg: "flow" },
    { to: "/jornadas", labelKey: "item.jornadas", icon: Workflow, pkg: "flow" },
    { to: "/lembretes", labelKey: "item.lembretes", icon: Bell, pkg: "flow" },
    { to: "/indicacoes", labelKey: "item.indicacoes", icon: Gift, pkg: "flow" },
    { to: "/nps", labelKey: "item.nps", icon: Smile, pkg: "flow" },
    { to: "/chat", labelKey: "item.chat", icon: MessageSquare, pkg: "flow" },
    { to: "/callcenter", labelKey: "item.callcenter", icon: Phone, pkg: "flow" },
  ]},
  { labelKey: "group.presenca", items: [
    { to: "/site", labelKey: "item.site", icon: Globe, pkg: "presenca" },
    { to: "/conteudo", labelKey: "item.conteudo", icon: Sparkles, pkg: "presenca" },
    { to: "/anuncios", labelKey: "item.anuncios", icon: Megaphone, pkg: "presenca" },
    { to: "/email", labelKey: "item.email", icon: Mail, pkg: "presenca" },
    { to: "/reputacao", labelKey: "item.reputacao", icon: Star, pkg: "presenca" },
  ]},
  { labelKey: "group.contabil", items: [
    { to: "/contador", labelKey: "item.contador", icon: Calculator, pkg: "contabil" },
    { to: "/fiscal", labelKey: "item.fiscal", icon: FileText, pkg: "contabil" },
    { to: "/tributos", labelKey: "item.tributos", icon: Receipt, pkg: "contabil" },
    { to: "/dre", labelKey: "item.dre", icon: BarChart3, pkg: "contabil" },
    { to: "/folha", labelKey: "item.folha", icon: HandCoins, pkg: "contabil" },
  ]},
  { labelKey: "group.config", items: [
    { to: "/equipe", labelKey: "item.equipe", icon: ShieldCheck, pkg: "core" },
    { to: "/auditoria", labelKey: "item.auditoria", icon: ScrollText, pkg: "core" },
    { to: "/faturamento", labelKey: "item.faturamento", icon: Receipt, pkg: "core" },
    { to: "/dados", labelKey: "item.dados", icon: DatabaseBackup, pkg: "core" },
    { to: "/tasks", labelKey: "item.tasks", icon: MessageSquare, pkg: "core" },
  ]},
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  function go(to: string) {
    setPaletteOpen(false);
    router.navigate({ to });
  }

  function toggleLocale() {
    const next: Locale = locale === "pt-BR" ? "en" : "pt-BR";
    setLocale(next);
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <a href="#main-content" className="skip-to-content">{t("nav.skip")}</a>

      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar p-3 lg:flex overflow-y-auto"
        aria-label={t("nav.main")}
      >
        <div className="px-2 py-2">
          <BrandMark to="/dashboard" />
        </div>
        <button
          onClick={() => setPaletteOpen(true)}
          className="mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent/60"
          aria-label={t("nav.search.aria")}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">{t("nav.search")}</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <nav className="mt-4 flex flex-1 flex-col gap-4" role="navigation">
          {groups.map((g) => (
            <div key={g.labelKey}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t(g.labelKey)}</p>
              <div className="flex flex-col gap-0.5">
                {g.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  const b = pkgBadge[item.pkg];
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="flex-1">{t(item.labelKey)}</span>
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
          onClick={toggleLocale}
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-foreground"
          aria-label={t("lang.label")}
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1 text-left">{t("lang.label")}</span>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase">
            {locale === "pt-BR" ? "PT" : "EN"}
          </span>
        </button>
        <button
          onClick={handleSignOut}
          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> {t("nav.signout")}
        </button>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden focus:outline-none">
        {children}
      </main>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder={t("palette.placeholder")} />
        <CommandList>
          <CommandEmpty>{t("palette.empty")}</CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g.labelKey} heading={t(g.labelKey)}>
              {g.items.map((item) => {
                const Icon = item.icon;
                const label = t(item.labelKey);
                return (
                  <CommandItem
                    key={item.to}
                    value={`${label} ${t(g.labelKey)} ${item.to}`}
                    onSelect={() => go(item.to)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
