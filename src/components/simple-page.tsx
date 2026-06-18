import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { PageHeader } from "./page-header";

export function SimplePage({
  title,
  description,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell>
      <div className="container-page py-8">
        <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
        {children}
      </div>
    </AppShell>
  );
}
