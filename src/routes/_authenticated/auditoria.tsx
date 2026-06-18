import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { listAuditLog, auditStats } from "@/lib/audit.functions";

export const Route = createFileRoute("/_authenticated/auditoria")({
  component: AuditoriaPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-8">
      <p className="text-destructive">{error.message}</p>
      <button onClick={reset} className="mt-2 text-sm underline">Tentar novamente</button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Não encontrado</div>,
});

function AuditoriaPage() {
  const [severity, setSeverity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const listFn = useServerFn(listAuditLog);
  const statsFn = useServerFn(auditStats);

  const stats = useQuery({
    queryKey: ["audit-stats"],
    queryFn: () => statsFn({ data: {} as never }),
  });

  const logs = useQuery({
    queryKey: ["audit-log", severity],
    queryFn: () => listFn({ data: { limit: 300, severity: severity === "all" ? undefined : severity } }),
  });

  const filtered = (logs.data ?? []).filter((r) =>
    !search ||
    r.action.toLowerCase().includes(search.toLowerCase()) ||
    r.resource_type.toLowerCase().includes(search.toLowerCase()) ||
    (r.resource_id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Auditoria</h1>
            <p className="text-sm text-muted-foreground mt-1">Registro de ações sensíveis nos últimos 180 dias.</p>
          </div>
          <Link to="/equipe" className="text-sm text-primary hover:underline">Gerenciar perfis →</Link>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Eventos (7d)</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{stats.data?.total ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Avisos</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{stats.data?.bySeverity.warn ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-red-500" /> Críticos</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{stats.data?.bySeverity.critical ?? 0}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Eventos recentes</CardTitle>
              <div className="flex items-center gap-2">
                <Input placeholder="Buscar ação ou recurso…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56" />
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Aviso</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Ação</th>
                    <th className="py-2 pr-3">Recurso</th>
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Severidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                      <td className="py-2 pr-3 font-medium">{r.action}</td>
                      <td className="py-2 pr-3">{r.resource_type}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground font-mono">{r.resource_id?.slice(0, 8) ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={r.severity === "critical" ? "destructive" : r.severity === "warn" ? "secondary" : "outline"}>{r.severity}</Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum evento registrado ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
