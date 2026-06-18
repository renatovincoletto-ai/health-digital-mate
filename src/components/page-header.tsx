import type { ReactNode } from "react";

/**
 * Cabeçalho padrão das telas internas do Minha Clínica.
 * Garante mesma densidade, hierarquia visual e tipografia em todo o app.
 *
 * Estrutura: eyebrow (uppercase) + título display + descrição + ações.
 * Use sempre dentro de `<div className="container-page py-8">`.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "mb-8",
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
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
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
