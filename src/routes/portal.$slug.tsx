import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { portalLoginByClinic, portalMe, portalRequestReset } from "@/lib/waveB.functions";
import { portalWallet } from "@/lib/wallet.functions";

export const Route = createFileRoute("/portal/$slug")({ component: PortalClinic });

const STORAGE_KEY = "portalSession";

function PortalClinic() {
  const { slug } = useParams({ from: "/portal/$slug" });
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(`${STORAGE_KEY}:${slug}`) : null;
    if (raw) setToken(raw);
  }, [slug]);

  const fetchMe = useServerFn(portalMe);
  useEffect(() => {
    if (!token) return;
    fetchMe({ data: { token } })
      .then(setMe)
      .catch(() => { localStorage.removeItem(`${STORAGE_KEY}:${slug}`); setToken(null); });
  }, [token, slug, fetchMe]);

  if (!token) return <PortalLogin slug={slug} onLogin={(t) => { localStorage.setItem(`${STORAGE_KEY}:${slug}`, t); setToken(t); }} />;
  if (!me) return <main className="mx-auto max-w-3xl p-8 text-center text-sm text-muted-foreground">Carregando…</main>;
  return <PortalHome slug={slug} me={me} token={token} onLogout={() => { localStorage.removeItem(`${STORAGE_KEY}:${slug}`); setToken(null); setMe(null); }} />;
}

function PortalLogin({ slug, onLogin }: { slug: string; onLogin: (t: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const login = useServerFn(portalLoginByClinic);
  const reset = useServerFn(portalRequestReset);

  const loginMut = useMutation({
    mutationFn: () => login({ data: { slug, cpf, password } }),
    onSuccess: (res: any) => { toast.success(`Bem-vindo, ${res.tenant.name}`); onLogin(res.token); },
    onError: (e: any) => toast.error(e.message ?? "Não foi possível entrar"),
  });
  const resetMut = useMutation({
    mutationFn: () => reset({ data: { slug, cpf } }),
    onSuccess: () => toast.success("Se houver e-mail cadastrado, enviaremos instruções"),
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Portal do Paciente</h1>
        <p className="text-sm text-muted-foreground">Acesso da clínica <code className="rounded bg-muted px-1">/{slug}</code></p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrar</CardTitle>
          <CardDescription>Use seu CPF e a senha cadastrada na clínica.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>CPF</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
          <div><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" disabled={!cpf || !password || loginMut.isPending} onClick={() => loginMut.mutate()}>
            {loginMut.isPending ? "Entrando…" : "Entrar"}
          </Button>
          <button type="button" className="block w-full text-center text-xs text-muted-foreground underline" onClick={() => cpf && resetMut.mutate()}>
            Esqueci minha senha
          </button>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Não tem cadastro? Entre em contato com a clínica.
      </p>
    </main>
  );
}

function PortalHome({ slug, me, onLogout }: { slug: string; me: any; onLogout: () => void }) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {me.patient?.full_name ?? "paciente"}</h1>
          <p className="text-xs text-muted-foreground">Portal <code className="rounded bg-muted px-1">/{slug}</code></p>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>Sair</Button>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Próximas consultas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(me.appointments ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem agendamentos recentes.</p>}
          {(me.appointments ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{new Date(a.starts_at).toLocaleString("pt-BR")}</span>
              <Badge variant="secondary">{a.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(me.prescriptions ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem documentos disponíveis.</p>}
          {(me.prescriptions ?? []).map((rx: any) => (
            <div key={rx.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{new Date(rx.created_at).toLocaleDateString("pt-BR")} — {rx.status}</span>
              {rx.pdf_url
                ? <a className="text-primary underline" href={rx.pdf_url} target="_blank" rel="noreferrer">Baixar PDF</a>
                : <span className="text-xs text-muted-foreground">aguardando assinatura</span>}
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-xs">
        <Link to="/" className="text-muted-foreground underline">Voltar ao site</Link>
      </p>
    </main>
  );
}
