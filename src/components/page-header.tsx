import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionOnboarding } from "./section-onboarding";

/**
 * Cabeçalho padrão das telas internas do Minha Clínica.
 * Garante mesma densidade, hierarquia visual e tipografia em todo o app.
 *
 * `onboardingSection`: chave do registro em SectionOnboarding. Quando definida,
 * exibe automaticamente o botão Onboarding daquele módulo + um botão Ajustes
 * que leva para a Central de configuração ancorada no módulo (`/setup#<id>`).
 *
 * `settingsHref`: opcional, sobrescreve o link do botão Ajustes.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  onboardingSection,
  settingsHref,
  className = "mb-8",
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  onboardingSection?: string;
  settingsHref?: string;
  className?: string;
}) {
  const settingsHash = onboardingSection ?? undefined;
  const showSettings = Boolean(settingsHref || settingsHash);

  return (
    <header className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {(actions || onboardingSection || showSettings) && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onboardingSection && <SectionOnboarding section={onboardingSection} />}
          {showSettings && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              {settingsHref ? (
                <a href={settingsHref}>
                  <Settings2 className="h-4 w-4" />
                  Ajustes
                </a>
              ) : (
                <Link to="/setup" hash={settingsHash}>
                  <Settings2 className="h-4 w-4" />
                  Ajustes
                </Link>
              )}
            </Button>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}
