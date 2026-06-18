import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  secondaryIcon: SecondaryIcon,
  title,
  description,
  bullets,
  wave,
}: {
  icon: LucideIcon;
  secondaryIcon?: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  wave: string;
}) {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {SecondaryIcon && <SecondaryIcon className="h-3.5 w-3.5" />}
          {wave} · em desenvolvimento
        </div>
        <div className="mb-7 flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{description}</p>
        <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
          <p className="mb-4 text-sm font-semibold">O que virá neste módulo</p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Avise no chat quando quiser que este módulo seja construído.
        </p>
      </div>
    </div>
  );
}
