import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listTeam, listRolePermissions, saveRolePermission } from "@/lib/wave5b.functions";

export const Route = createFileRoute("/_authenticated/equipe")({ component: EquipePage });

const ROLES = ["owner", "admin", "staff"] as const;
const MODULES = [
  "agenda", "pacientes", "prontuario", "financeiro", "pagamentos",
  "fiscal", "estoque", "relatorios", "integracoes", "folha",
] as const;

function EquipePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Equipe & Permissões</h1>
          <p className="text-sm text-muted-foreground">Controle quem acessa o quê e o limite máximo de desconto por perfil.</p>
        </header>
        <Tabs defaultValue="rbac">
          <TabsList>
            <TabsTrigger value="rbac">Matriz de permissões</TabsTrigger>
            <TabsTrigger value="team">Time</TabsTrigger>
          </TabsList>
          <TabsContent value="rbac" className="space-y-4"><RbacMatrix /></TabsContent>
          <TabsContent value="team" className="space-y-4"><TeamList /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function RbacMatrix() {
  const qc = useQueryClient();
  const list = useServerFn(listRolePermissions);
  const save = useServerFn(saveRolePermission);
  const { data: perms = [] } = useQuery({ queryKey: ["role-perms"], queryFn: () => list() });

  const map = useMemo(() => {
    const m = new Map<string, any>();
    perms.forEach((p: any) => m.set(`${p.role}:${p.module}`, p));
    return m;
  }, [perms]);

  const saveMut = useMutation({
    mutationFn: (p: any) => save({ data: p }),
    onSuccess: () => { toast.success("Permissão atualizada"); qc.invalidateQueries({ queryKey: ["role-perms"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  function toggle(role: string, module: string, field: "can_view" | "can_create" | "can_edit" | "can_delete", value: boolean) {
    const current = map.get(`${role}:${module}`) ?? { role, module, can_view: false, can_create: false, can_edit: false, can_delete: false };
    saveMut.mutate({ ...current, [field]: value });
  }
  function setDiscount(role: string, module: string, value: string) {
    const current = map.get(`${role}:${module}`) ?? { role, module, can_view: true, can_create: false, can_edit: false, can_delete: false };
    saveMut.mutate({ ...current, max_discount_pct: value === "" ? null : Number(value) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Permissões por perfil × módulo</CardTitle>
        <CardDescription>Configure o que cada perfil pode ver, criar, editar ou excluir, e o desconto máximo permitido.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="p-2">Perfil / Módulo</th>
              <th className="p-2">Ver</th><th className="p-2">Criar</th><th className="p-2">Editar</th><th className="p-2">Excluir</th>
              <th className="p-2">Desconto máx (%)</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.flatMap((role) =>
              MODULES.map((module) => {
                const p = map.get(`${role}:${module}`) ?? {};
                return (
                  <tr key={`${role}:${module}`} className="border-b last:border-0">
                    <td className="p-2">
                      <Badge variant="outline" className="mr-2 capitalize">{role}</Badge>
                      <span className="text-muted-foreground capitalize">{module}</span>
                    </td>
                    {(["can_view", "can_create", "can_edit", "can_delete"] as const).map((f) => (
                      <td key={f} className="p-2"><Checkbox checked={!!p[f]} onCheckedChange={(v) => toggle(role, module, f, !!v)} /></td>
                    ))}
                    <td className="p-2">
                      <Input className="w-24" type="number" defaultValue={p.max_discount_pct ?? ""} onBlur={(e) => setDiscount(role, module, e.target.value)} />
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function TeamList() {
  const list = useServerFn(listTeam);
  const { data = [] } = useQuery({ queryKey: ["team"], queryFn: () => list() });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Membros do consultório</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro além do proprietário.</p>}
        {data.map((m: any) => (
          <div key={m.user_id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div>
              <div className="font-medium">{m.profile?.full_name ?? m.user_id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{m.user_id}</div>
            </div>
            <Badge variant="outline" className="capitalize">{m.role}</Badge>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">
          Para convidar novos membros, crie a conta em /auth e atribua o perfil em <code>user_roles</code>.
        </p>
      </CardContent>
    </Card>
  );
}
