import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { portalResetPassword } from "@/lib/waveB.functions";
import { z } from "zod";

export const Route = createFileRoute("/portal/recuperar")({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPage,
});

function ResetPage() {
  const { token = "" } = useSearch({ from: "/portal/recuperar" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const reset = useServerFn(portalResetPassword);
  const mut = useMutation({
    mutationFn: () => reset({ data: { token, password } }),
    onSuccess: () => toast.success("Senha redefinida. Volte e faça login."),
    onError: (e: any) => toast.error(e.message ?? "Token inválido"),
  });

  if (!token) {
    return <main className="mx-auto max-w-md p-8 text-center text-sm text-muted-foreground">Link de recuperação inválido.</main>;
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redefinir senha</CardTitle>
          <CardDescription>Escolha uma nova senha de acesso ao portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nova senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><Label>Confirmar</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <Button
            className="w-full"
            disabled={password.length < 6 || password !== confirm || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Salvando…" : "Redefinir"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
