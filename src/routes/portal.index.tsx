import { createFileRoute, Link } from "@tanstack/react-router";
import { Smartphone, Calendar, FileText, MessageCircle, Video } from "lucide-react";

export const Route = createFileRoute("/portal/")({
  component: Page,
  head: () => ({ meta: [{ title: "Portal do paciente · SaúdeOS" }, { name: "description", content: "Acompanhe consultas, receitas e exames pelo seu celular." }] }),
});

function Page() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="container-page py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold">SaúdeOS</Link>
          <Link to="/auth" className="rounded-lg border border-border px-3 py-1.5 text-sm">Entrar</Link>
        </div>
      </header>
      <main className="container-page py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Portal do paciente · PWA</p>
            <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">Sua saúde, no seu bolso.</h1>
            <p className="mt-4 text-lg text-muted-foreground">App instalável (sem App Store). Agende, veja exames, fale com a clínica e acesse receitas com QR de validação a qualquer momento.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
              <Feat icon={Calendar} title="Agendar" />
              <Feat icon={FileText} title="Receitas" />
              <Feat icon={Video} title="Teleconsulta" />
              <Feat icon={MessageCircle} title="Mensagens" />
            </div>
            <div className="mt-8 flex gap-3">
              <Link to="/auth" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Acessar minha conta</Link>
              <a href="#install" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium">Como instalar</a>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface-elevated p-8 text-center">
            <Smartphone className="h-24 w-24 mx-auto text-primary" />
            <p className="mt-4 font-display text-lg">Adicione à Tela de Início</p>
            <p className="mt-2 text-sm text-muted-foreground">No iPhone: Compartilhar → Adicionar à Tela.<br />No Android: Menu → Instalar app.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Feat({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated p-3">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
