import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Calendar, FileText, Receipt } from "lucide-react";
import { portalLookup } from "@/lib/wave5b.functions";

export const Route = createFileRoute("/portal/acesso")({
  component: PortalAcesso,
  head: () => ({ meta: [{ title: "Portal do paciente · acesso" }, { name: "description", content: "Acesse suas consultas, receitas e notas fiscais." }] }),
});

function PortalAcesso() {
  const lookup = useServerFn(portalLookup);
  const [cpf, setCpf] = useState("");
  const [birth, setBirth] = useState("");
  const mut = useMutation({
    mutationFn: () => lookup({ data: { cpf, birth_date: birth } }),
  });
  const result = mut.data;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="container-page py-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold">Portal do paciente</span>
        </div>
      </header>
      <main className="container-page max-w-2xl py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>Informe seu CPF e data de nascimento para visualizar consultas, receitas e notas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>CPF</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
            <div><Label>Data de nascimento</Label><Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></div>
            <Button className="w-full" onClick={() => mut.mutate()} disabled={mut.isPending || !cpf || !birth}>
              {mut.isPending ? "Buscando..." : "Acessar"}
            </Button>
            {result && !result.ok && <p className="text-sm text-destructive">{result.message}</p>}
          </CardContent>
        </Card>

        {result && result.ok && (
          <>
            <h2 className="text-xl font-semibold">Olá, {result.patient.full_name}</h2>
            <Section icon={Calendar} title="Próximas consultas" empty="Sem consultas agendadas.">
              {result.appointments.map((a: any) => (
                <Row key={a.id} primary={new Date(a.starts_at).toLocaleString("pt-BR")} secondary={a.status} />
              ))}
            </Section>
            <Section icon={FileText} title="Receitas" empty="Nenhuma receita emitida.">
              {result.prescriptions.map((p: any) => (
                <Row key={p.id} primary={p.content?.slice?.(0, 60) ?? "Prescrição"} secondary={p.status}
                     action={p.pdf_url ? <a href={p.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">PDF</a> : null} />
              ))}
            </Section>
            <Section icon={Receipt} title="Notas fiscais" empty="Nenhuma nota emitida.">
              {result.invoices.map((n: any) => (
                <Row key={n.id} primary={`NF ${n.number ?? "-"} · R$ ${Number(n.amount).toFixed(2)}`} secondary={n.status}
                     action={n.pdf_url ? <a href={n.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">PDF</a> : null} />
              ))}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, empty, children }: any) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.some(Boolean) && arr.length > 0 && arr[0] !== undefined;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Icon className="h-4 w-4 text-primary" /><CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasContent ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}
function Row({ primary, secondary, action }: { primary: string; secondary?: string; action?: any }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      <div><div className="font-medium">{primary}</div>{secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}</div>
      {action}
    </div>
  );
}
