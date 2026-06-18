import type { ReactNode } from "react";
import { AppShell } from "./app-shell";

export function SimplePage({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-start justify-between gap-4 pb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </AppShell>
  );
}
