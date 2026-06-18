import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard,
  Globe,
  Calendar,
  Sparkles,
  Megaphone,
  Star,
  LogOut,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/dashboard" | "/site" | "/agenda" | "/conteudo" | "/anuncios" | "/reputacao";
  label: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/site", label: "Site", icon: Globe },
  { to: "/agenda", label: "Agenda", icon: Calendar, soon: true },
  { to: "/conteudo", label: "Conteúdo", icon: Sparkles, soon: true },
  { to: "/anuncios", label: "Anúncios", icon: Megaphone, soon: true },
  { to: "/reputacao", label: "Reputação", icon: Star, soon: true },
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar p-4 lg:flex">
        <div className="px-2 py-2">
          <BrandMark to="/dashboard" />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.soon ? (
                  <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                    em breve
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
