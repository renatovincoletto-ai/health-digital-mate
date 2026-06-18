import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Step = { label: string; hint?: string; href?: string; done?: boolean };
type SectionConfig = {
  title: string;
  intro: string;
  steps: Step[];
  cta?: { label: string; href: string };
};

const REGISTRY: Record<string, SectionConfig> = {
  agenda: {
    title: "Configurar Agenda",
    intro: "Defina horários, intervalos e regras de bloqueio para começar a receber agendamentos.",
    steps: [
      { label: "Cadastrar profissionais e suas especialidades", href: "/equipe" },
      { label: "Definir horários de atendimento (regras de disponibilidade)" },
      { label: "Configurar duração padrão por tipo de consulta" },
      { label: "Ativar lembretes automáticos 24h/1h antes", href: "/lembretes" },
    ],
  },
  pacientes: {
    title: "Configurar Pacientes",
    intro: "Personalize os campos do cadastro e importe sua base de pacientes existente.",
    steps: [
      { label: "Definir campos obrigatórios do prontuário" },
      { label: "Importar pacientes via CSV", href: "/dados" },
      { label: "Configurar consentimento LGPD", href: "/privacidade" },
    ],
  },
  financeiro: {
    title: "Configurar Financeiro",
    intro: "Conecte contas, gateway de pagamento e categorize seu plano de contas.",
    steps: [
      { label: "Cadastrar contas (banco, caixa, cartão)" },
      { label: "Conectar gateway de pagamento (Asaas)", href: "/integracoes" },
      { label: "Configurar maquininhas/TEF", href: "/maquininhas" },
      { label: "Definir categorias de receita e despesa" },
    ],
  },
  fiscal: {
    title: "Configurar Fiscal",
    intro: "Emita NFS-e direto do sistema. Configure certificado e dados da prefeitura.",
    steps: [
      { label: "Cadastrar CNPJ, regime tributário e CNAE" },
      { label: "Upload do certificado digital A1" },
      { label: "Testar emissão em sandbox" },
      { label: "Ativar emissão automática após pagamento" },
    ],
  },
  whatsapp: {
    title: "Configurar WhatsApp",
    intro: "Conecte seu número e ative o agente de IA para responder pacientes 24/7.",
    steps: [
      { label: "Conectar número via QR Code" },
      { label: "Treinar agente com FAQ da clínica" },
      { label: "Definir horários de transferência para humano" },
      { label: "Ativar confirmação automática de consultas" },
    ],
  },
  site: {
    title: "Configurar Site",
    intro: "Publique sua página profissional em minhaclinica.ia.br/seu-slug.",
    steps: [
      { label: "Personalizar logo, cores e textos", href: "/site" },
      { label: "Adicionar fotos e serviços" },
      { label: "Conectar agenda pública" },
      { label: "Publicar e divulgar o link" },
    ],
  },
  bi: {
    title: "Configurar BI",
    intro: "Acompanhe KPIs em tempo real e gere snapshots históricos.",
    steps: [
      { label: "Escolher métricas favoritas no painel" },
      { label: "Agendar snapshots mensais automáticos" },
      { label: "Exportar dados para Excel/CSV", href: "/dados" },
    ],
  },
  jornadas: {
    title: "Configurar Jornadas",
    intro: "Crie fluxos automatizados de relacionamento por etapa do paciente.",
    steps: [
      { label: "Escolher modelos prontos (pós-consulta, retorno, aniversário)" },
      { label: "Personalizar mensagens e canais (e-mail/WhatsApp)" },
      { label: "Definir gatilhos automáticos" },
      { label: "Ativar a jornada" },
    ],
  },
  marketing: {
    title: "Configurar Marketing IA",
    intro: "Gere campanhas, posts e anúncios com IA seguindo guardrails CFM.",
    steps: [
      { label: "Definir tom de voz e persona da clínica" },
      { label: "Conectar Instagram/Facebook", href: "/integracoes" },
      { label: "Gerar primeira campanha", href: "/anuncios" },
    ],
  },
  equipe: {
    title: "Configurar Equipe",
    intro: "Cadastre profissionais, defina papéis e permissões.",
    steps: [
      { label: "Cadastrar profissionais (CRM/CRO, especialidade)" },
      { label: "Convidar usuários por e-mail" },
      { label: "Definir permissões por papel" },
      { label: "Configurar repasse e comissão", href: "/repasses" },
    ],
  },
  prontuario: {
    title: "Configurar Prontuário",
    intro: "Modelos clínicos prontos e assinatura eletrônica conforme CFM.",
    steps: [
      { label: "Escolher modelos de evolução por especialidade", href: "/modelos" },
      { label: "Configurar anamneses personalizadas", href: "/anamnese" },
      { label: "Ativar assinatura eletrônica" },
    ],
  },
  prescricoes: {
    title: "Configurar Prescrições",
    intro: "Emita receitas com validade jurídica via Memed/integração.",
    steps: [
      { label: "Conectar Memed ou provedor equivalente", href: "/integracoes" },
      { label: "Cadastrar receituários favoritos" },
      { label: "Configurar assinatura digital ICP-Brasil" },
    ],
  },
  teleconsulta: {
    title: "Configurar Teleconsulta",
    intro: "Atenda online com sala criptografada e gravação opcional.",
    steps: [
      { label: "Testar câmera e microfone" },
      { label: "Configurar link de sala fixo ou por consulta" },
      { label: "Habilitar gravação com consentimento" },
    ],
  },
  contador: {
    title: "Configurar Contador",
    intro: "Dê acesso ao seu contador com perfil restrito a relatórios fiscais.",
    steps: [
      { label: "Convidar contador por e-mail", href: "/equipe" },
      { label: "Configurar envio automático de XMLs mensais" },
      { label: "Habilitar acesso ao DRE", href: "/dre" },
    ],
  },
  estoque: {
    title: "Configurar Estoque",
    intro: "Controle materiais, validade e alertas de reposição.",
    steps: [
      { label: "Cadastrar itens iniciais com saldo" },
      { label: "Definir ponto de reposição mínimo" },
      { label: "Configurar fornecedores" },
    ],
  },
  default: {
    title: "Configurar esta seção",
    intro: "Siga os passos para deixar esta funcionalidade pronta para uso.",
    steps: [
      { label: "Revisar dados básicos da clínica" },
      { label: "Personalizar conforme seu fluxo" },
      { label: "Testar com dados reais" },
    ],
  },
};

export function SectionOnboarding({ section, trigger }: { section: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const cfg = REGISTRY[section] ?? REGISTRY.default;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Onboarding
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{cfg.title}</SheetTitle>
          <SheetDescription>{cfg.intro}</SheetDescription>
        </SheetHeader>

        <ol className="mt-6 space-y-3">
          {cfg.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-border bg-surface-elevated p-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{step.label}</p>
                {step.hint && <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>}
                {step.href && (
                  <Link
                    to={step.href}
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Abrir <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        {cfg.cta && (
          <Link to={cfg.cta.href} onClick={() => setOpen(false)}>
            <Button className="mt-6 w-full">{cfg.cta.label}</Button>
          </Link>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Você pode reabrir este guia a qualquer momento clicando em <strong>Onboarding</strong> no topo da página.
        </p>
      </SheetContent>
    </Sheet>
  );
}
