import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listTemplates, saveTemplate, deleteTemplate } from "@/lib/waveB.functions";

export const Route = createFileRoute("/_authenticated/modelos")({ component: ModelosPage });

const KINDS = [
  { value: "atestado", label: "Atestado" },
  { value: "receituario", label: "Receituário" },
  { value: "prontuario", label: "Prontuário" },
  { value: "exame", label: "Pedido de exame" },
  { value: "laudo", label: "Laudo" },
  { value: "termo", label: "Termo de consentimento" },
] as const;

function ModelosPage() {
  const qc = useQueryClient();
  const list = useServerFn(listTemplates);
  const save = useServerFn(saveTemplate);
  const del = useServerFn(deleteTemplate);

  const { data: templates = [] } = useQuery({ queryKey: ["doc-templates"], queryFn: () => list() });

  const [editing, setEditing] = useState<any>({ kind: "atestado", title: "", body: "", variables: [] });

  const saveMut = useMutation({
    mutationFn: (p: any) => save({ data: p }),
    onSuccess: () => {
      toast.success("Modelo salvo");
      qc.invalidateQueries({ queryKey: ["doc-templates"] });
      setEditing({ kind: editing.kind, title: "", body: "", variables: [] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["doc-templates"] }); },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Modelos de documentos</h1>
          <p className="text-sm text-muted-foreground">
            Biblioteca de atestados, receituários, prontuários, pedidos de exame, laudos e termos. Use variáveis como
            <code className="mx-1 rounded bg-muted px-1">{"{{paciente}}"}</code>,
            <code className="mx-1 rounded bg-muted px-1">{"{{cpf}}"}</code>,
            <code className="mx-1 rounded bg-muted px-1">{"{{data}}"}</code>,
            <code className="mx-1 rounded bg-muted px-1">{"{{profissional}}"}</code>.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editing.id ? "Editar modelo" : "Novo modelo"}</CardTitle>
              <CardDescription>Os modelos podem ser usados em prontuário, receituário e atestados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={editing.kind} onValueChange={(v) => setEditing({ ...editing, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea
                  rows={10}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder={"Ex.: Atesto para os devidos fins que {{paciente}}, CPF {{cpf}}, esteve em atendimento no dia {{data}}."}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveMut.mutate({
                    id: editing.id, kind: editing.kind, title: editing.title.trim(),
                    body: editing.body, variables: editing.variables ?? [], is_default: !!editing.is_default,
                  })}
                  disabled={!editing.title.trim() || !editing.body.trim() || saveMut.isPending}
                >
                  {editing.id ? "Salvar alterações" : "Criar modelo"}
                </Button>
                {editing.id && (
                  <Button variant="outline" onClick={() => setEditing({ kind: "atestado", title: "", body: "", variables: [] })}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meus modelos</CardTitle>
              <CardDescription>{templates.length} modelos cadastrados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.length === 0 && <p className="text-sm text-muted-foreground">Nenhum modelo ainda.</p>}
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{KINDS.find((k) => k.value === t.kind)?.label ?? t.kind}</Badge>
                      <span className="truncate font-medium">{t.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => delMut.mutate(t.id)}>Remover</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
