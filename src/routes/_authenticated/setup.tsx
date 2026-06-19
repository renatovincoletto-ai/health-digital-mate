import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar, Users, Stethoscope, ClipboardList, Video, FileText, ClipboardCheck,
  Package, Building2, Wallet, Link2, CreditCard, FileSignature, Banknote, Building, FileBarChart,
  MessageSquare, Workflow, Bell, Gift, Smile, Phone, Globe, Sparkles, Megaphone, Mail, Star,
  Calculator, Receipt, TrendingUp, CheckCircle2, Circle, ArrowRight, Search, ListChecks,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/setup")({ component: SetupPage });

type Pkg = "core" | "clinic" | "pay" | "flow" | "presenca" | "contabil";
type Step = { title: string; body: string; to?: string };
type Module = {
  id: string;
  label: string;
  icon: typeof Calendar;
  pkg: Pkg;
  description: string;
  to: string;
  steps: Step[];
};

const pkgInfo: Record<Pkg, { label: string; chip: string; dot: string }> = {
  core:     { label: "Core",     chip: "bg-muted text-muted-foreground",       dot: "bg-muted-foreground" },
  clinic:   { label: "Clinic",   chip: "bg-blue-500/15 text-blue-600",         dot: "bg-blue-500" },
  pay:      { label: "Pay",      chip: "bg-emerald-500/15 text-emerald-600",   dot: "bg-emerald-500" },
  flow:     { label: "Flow",     chip: "bg-violet-500/15 text-violet-600",     dot: "bg-violet-500" },
  presenca: { label: "Presença", chip: "bg-pink-500/15 text-pink-600",         dot: "bg-pink-500" },
  contabil: { label: "Contábil", chip: "bg-amber-500/15 text-amber-700",       dot: "bg-amber-500" },
};

const modules: Module[] = [
  // CORE
  { id: "perfil", label: "Perfil da clínica", icon: Building2, pkg: "core", to: "/onboarding",
    description: "Dados básicos do consultório usados em todos os módulos.",
    steps: [
      { title: "Preencher dados do consultório", body: "Nome, especialidade, conselho, cidade e contatos.", to: "/onboarding" },
      { title: "Adicionar logo e cores", body: "Suba a marca para uso no site, recibos e mensagens.", to: "/site" },
      { title: "Cadastrar unidades", body: "Se atende em mais de um endereço, registre cada unidade.", to: "/unidades" },
    ]},
  { id: "bi", label: "BI & métricas", icon: TrendingUp, pkg: "core", to: "/bi",
    description: "Indicadores de faturamento, ocupação e marketing.",
    steps: [
      { title: "Conectar agenda e financeiro", body: "Necessário para popular os indicadores." },
      { title: "Definir metas mensais", body: "Faturamento, novos pacientes e ticket médio.", to: "/bi" },
      { title: "Compartilhar painel com sócios", body: "Convide outros usuários no nível 'leitura'." },
    ]},

  // CLINIC
  { id: "agenda", label: "Agenda", icon: Calendar, pkg: "clinic", to: "/agenda",
    description: "Agendamento online com confirmação automática.",
    steps: [
      { title: "Criar serviços", body: "Consulta, retorno, procedimento — duração e preço.", to: "/agenda" },
      { title: "Definir horários de atendimento", body: "Dias, intervalos e bloqueios fixos.", to: "/agenda" },
      { title: "Ativar agendamento público", body: "Gera link /agendar para o paciente marcar sozinho.", to: "/site" },
      { title: "Conectar com lembretes", body: "Confirmação por WhatsApp 24h antes.", to: "/lembretes" },
    ]},
  { id: "pacientes", label: "Pacientes (CRM)", icon: Users, pkg: "clinic", to: "/pacientes",
    description: "Base unificada com tags, segmentação e LTV.",
    steps: [
      { title: "Importar pacientes", body: "Suba CSV ou cadastre manualmente.", to: "/pacientes" },
      { title: "Criar tags e segmentos", body: "Por convênio, especialidade, status." },
      { title: "Configurar campos personalizados", body: "Ex: alergias, plano de saúde, indicação." },
    ]},
  { id: "prontuario", label: "Prontuário SOAP", icon: Stethoscope, pkg: "clinic", to: "/prontuario",
    description: "Prontuário com ditado por voz estruturado por IA.",
    steps: [
      { title: "Permitir acesso ao microfone", body: "Necessário para ditado por voz.", to: "/prontuario" },
      { title: "Criar templates por especialidade", body: "Estruture SOAP por tipo de consulta." },
      { title: "Definir CID/CIAP favoritos", body: "Códigos mais usados em atalhos." },
    ]},
  { id: "anamnese", label: "Anamnese digital", icon: ClipboardList, pkg: "clinic", to: "/anamnese",
    description: "Paciente preenche antes da consulta.",
    steps: [
      { title: "Escolher modelo de anamnese", body: "Modelos prontos por especialidade.", to: "/anamnese" },
      { title: "Personalizar perguntas", body: "Inclua perguntas obrigatórias específicas." },
      { title: "Enviar automaticamente ao agendar", body: "Vinculado à agenda e WhatsApp." },
    ]},
  { id: "teleconsulta", label: "Teleconsulta", icon: Video, pkg: "clinic", to: "/teleconsulta",
    description: "Sala de vídeo segura com link único.",
    steps: [
      { title: "Aceitar termo de telemedicina", body: "Exigido pelo CFM/CFO.", to: "/teleconsulta" },
      { title: "Testar câmera e microfone", body: "Faça uma chamada teste." },
      { title: "Cobrar consulta online", body: "Conecte pagamentos para link com cobrança.", to: "/pagamentos" },
    ]},
  { id: "prescricoes", label: "Prescrições", icon: FileText, pkg: "clinic", to: "/prescricoes",
    description: "Receita, atestado e exame com QR.",
    steps: [
      { title: "Configurar assinatura digital", body: "Certificado A1/A3 ou Memed/iClinic Sign.", to: "/prescricoes" },
      { title: "Salvar medicamentos favoritos", body: "Posologia padrão para reuso rápido." },
      { title: "Imprimir cabeçalho personalizado", body: "Logo, CRM/CRO e endereço." },
    ]},
  { id: "planos", label: "Planos de tratamento", icon: ClipboardCheck, pkg: "clinic", to: "/planos",
    description: "Etapas, valores e status.",
    steps: [
      { title: "Cadastrar procedimentos", body: "Tabela de preços base.", to: "/planos" },
      { title: "Criar templates de plano", body: "Combos comuns por especialidade." },
      { title: "Vincular ao financeiro", body: "Cada etapa aprovada gera lançamento.", to: "/financeiro" },
    ]},
  { id: "estoque", label: "Estoque", icon: Package, pkg: "clinic", to: "/estoque",
    description: "Materiais, alerta de mínimo e validade.",
    steps: [
      { title: "Cadastrar itens", body: "Materiais e medicamentos.", to: "/estoque" },
      { title: "Definir estoque mínimo", body: "Recebe alerta quando atingir." },
      { title: "Lançar entradas e saídas", body: "Vincule consumo por procedimento." },
    ]},
  { id: "unidades", label: "Unidades", icon: Building2, pkg: "clinic", to: "/unidades",
    description: "Várias clínicas em um só painel.",
    steps: [
      { title: "Cadastrar cada unidade", body: "Endereço, telefone e responsável.", to: "/unidades" },
      { title: "Atribuir profissionais por unidade", body: "Quem atende em qual endereço." },
      { title: "Filtrar relatórios por unidade", body: "Faturamento e ocupação separados." },
    ]},

  // PAY
  { id: "financeiro", label: "Caixa & fluxo", icon: Wallet, pkg: "pay", to: "/financeiro",
    description: "Contas a pagar/receber e DRE.",
    steps: [
      { title: "Cadastrar contas bancárias", body: "Banco, agência e saldo inicial.", to: "/financeiro" },
      { title: "Criar categorias de receita e despesa", body: "Base para DRE e relatórios." },
      { title: "Conectar pagamentos online", body: "Recebe Pix/cartão direto no caixa.", to: "/pagamentos" },
    ]},
  { id: "pagamentos", label: "Pagamentos online", icon: Link2, pkg: "pay", to: "/pagamentos",
    description: "Pix, cartão e boleto com link único.",
    steps: [
      { title: "Conectar provedor", body: "Stripe, Pagar.me ou Mercado Pago.", to: "/pagamentos" },
      { title: "Definir taxas e prazos", body: "Como repassar custos." },
      { title: "Testar uma cobrança", body: "Gere um link de R$1 e finalize o pagamento." },
    ]},
  { id: "maquininhas", label: "Maquininhas (TEF)", icon: CreditCard, pkg: "pay", to: "/maquininhas",
    description: "Integração TEF para POS físico.",
    steps: [
      { title: "Solicitar maquininha integrada", body: "Cielo/Stone/Rede com TEF.", to: "/maquininhas" },
      { title: "Instalar agente TEF", body: "No computador da recepção." },
      { title: "Conciliar vendas automaticamente", body: "Bate com o caixa diariamente." },
    ]},
  { id: "orcamentos", label: "Orçamentos & contratos", icon: FileSignature, pkg: "pay", to: "/orcamentos",
    description: "Envio e aceite digital.",
    steps: [
      { title: "Criar template de orçamento", body: "Com logo e condições.", to: "/orcamentos" },
      { title: "Configurar contrato modelo", body: "LGPD, cancelamento, pagamento." },
      { title: "Ativar aceite por link", body: "Paciente assina pelo celular." },
    ]},
  { id: "repasses", label: "Repasses", icon: Banknote, pkg: "pay", to: "/repasses",
    description: "Comissão de profissionais e parceiros.",
    steps: [
      { title: "Cadastrar profissionais", body: "Com regra de comissão.", to: "/repasses" },
      { title: "Definir regras por procedimento", body: "% ou valor fixo." },
      { title: "Fechar repasse mensal", body: "Gera relatório e ordem de pagamento." },
    ]},
  { id: "convenios", label: "Convênios", icon: Building, pkg: "pay", to: "/convenios",
    description: "Tabelas e relacionamento com operadoras.",
    steps: [
      { title: "Cadastrar convênios atendidos", body: "Com tabela de procedimentos.", to: "/convenios" },
      { title: "Definir glosas comuns", body: "Para alerta automático." },
      { title: "Conectar TISS", body: "Envio de guias eletrônicas.", to: "/tiss" },
    ]},
  { id: "tiss", label: "Guias TISS", icon: FileBarChart, pkg: "pay", to: "/tiss",
    description: "SP/SADT, internação e consulta.",
    steps: [
      { title: "Configurar certificado e webservices", body: "Por operadora.", to: "/tiss" },
      { title: "Emitir guia teste", body: "Validar retorno da operadora." },
      { title: "Acompanhar status", body: "Autorização, glosa e pagamento." },
    ]},

  // FLOW
  { id: "whatsapp-agente", label: "Agente WhatsApp IA", icon: MessageSquare, pkg: "flow", to: "/whatsapp-agente",
    description: "Atendente virtual que marca consultas pelo WhatsApp.",
    steps: [
      { title: "Conectar número Twilio", body: "Cadastre o número WhatsApp Business.", to: "/whatsapp-agente" },
      { title: "Definir tom de voz do agente", body: "Saudação, horário e regras." },
      { title: "Liberar acesso à agenda", body: "Para marcar consultas reais." },
      { title: "Testar conversa", body: "Mande mensagem do seu celular e valide." },
    ]},
  { id: "jornadas", label: "Jornadas IA", icon: Workflow, pkg: "flow", to: "/jornadas",
    description: "Automação de mensagens por gatilho.",
    steps: [
      { title: "Escolher jornadas prontas", body: "Pós-consulta, retorno anual, aniversário.", to: "/jornadas" },
      { title: "Personalizar mensagens", body: "Tom, intervalo e CTA." },
      { title: "Ativar e monitorar conversão", body: "Veja taxa de retorno gerada." },
    ]},
  { id: "lembretes", label: "Lembretes", icon: Bell, pkg: "flow", to: "/lembretes",
    description: "WhatsApp/SMS/e-mail com confirmação.",
    steps: [
      { title: "Escolher canal", body: "WhatsApp recomendado.", to: "/lembretes" },
      { title: "Definir antecedência", body: "24h e 2h antes é o padrão." },
      { title: "Ativar resposta automática", body: "Confirma/cancela direto na mensagem." },
    ]},
  { id: "indicacoes", label: "Indicações", icon: Gift, pkg: "flow", to: "/indicacoes",
    description: "Paciente indica, ganha desconto.",
    steps: [
      { title: "Definir recompensa", body: "Desconto, crédito ou brinde.", to: "/indicacoes" },
      { title: "Gerar links únicos por paciente", body: "Rastreio automático." },
      { title: "Pagar recompensa ao validar", body: "Após primeira consulta do indicado." },
    ]},
  { id: "nps", label: "NPS pós-consulta", icon: Smile, pkg: "flow", to: "/nps",
    description: "Mede satisfação e alimenta reputação.",
    steps: [
      { title: "Definir gatilho de envio", body: "2h após consulta finalizada.", to: "/nps" },
      { title: "Personalizar pergunta", body: "Texto curto e direto." },
      { title: "Encaminhar promotores ao Google", body: "Notas 9-10 ganham link de avaliação.", to: "/reputacao" },
    ]},
  { id: "chat", label: "Chat interno", icon: MessageSquare, pkg: "flow", to: "/chat",
    description: "Mensagens entre profissionais e secretária.",
    steps: [
      { title: "Convidar a equipe", body: "Envie convite por e-mail.", to: "/chat" },
      { title: "Criar canais por tópico", body: "Recepção, clínico, financeiro." },
      { title: "Definir notificações", body: "Push e e-mail." },
    ]},
  { id: "callcenter", label: "Call center", icon: Phone, pkg: "flow", to: "/callcenter",
    description: "Fila e registro de chamadas.",
    steps: [
      { title: "Conectar PABX ou número virtual", body: "Twilio Voice / Zenvia.", to: "/callcenter" },
      { title: "Configurar URA simples", body: "Opções de atendimento." },
      { title: "Gravar chamadas (LGPD)", body: "Com aviso ao paciente." },
    ]},

  // PRESENÇA
  { id: "site", label: "Site profissional", icon: Globe, pkg: "presenca", to: "/site",
    description: "Editor com IA e SEO embutido.",
    steps: [
      { title: "Gerar site com IA", body: "Conteúdo a partir do seu perfil.", to: "/site" },
      { title: "Conectar domínio próprio", body: "drnome.com.br via DNS." },
      { title: "Publicar com SEO", body: "Title, descrição e Open Graph automáticos." },
    ]},
  { id: "conteudo", label: "Conteúdo & redes", icon: Sparkles, pkg: "presenca", to: "/conteudo",
    description: "Brand kit + posts com IA.",
    steps: [
      { title: "Subir brand kit", body: "Logo, cores e fontes.", to: "/conteudo" },
      { title: "Conectar Instagram", body: "Para agendar posts." },
      { title: "Gerar calendário do mês", body: "IA propõe 8-12 posts." },
    ]},
  { id: "anuncios", label: "Anúncios", icon: Megaphone, pkg: "presenca", to: "/anuncios",
    description: "Google e Meta Ads assistidos.",
    steps: [
      { title: "Conectar contas Google/Meta Ads", body: "OAuth direto.", to: "/anuncios" },
      { title: "Configurar pixel/conversões", body: "Para medir retorno." },
      { title: "Lançar primeira campanha", body: "Use template por especialidade." },
    ]},
  { id: "email", label: "E-mail marketing", icon: Mail, pkg: "presenca", to: "/email",
    description: "Campanhas e contatos segmentados.",
    steps: [
      { title: "Verificar domínio de envio", body: "SPF/DKIM no DNS.", to: "/email" },
      { title: "Importar listas", body: "Do CRM com consentimento LGPD." },
      { title: "Disparar primeira campanha", body: "Template responsivo pronto." },
    ]},
  { id: "reputacao", label: "Reputação Google", icon: Star, pkg: "presenca", to: "/reputacao",
    description: "Avaliações e respostas com IA.",
    steps: [
      { title: "Conectar perfil Google Business", body: "OAuth de gerenciador.", to: "/reputacao" },
      { title: "Ativar respostas com IA", body: "Aprovação opcional antes de publicar." },
      { title: "Programar pedidos de avaliação", body: "Via NPS automático.", to: "/nps" },
    ]},

  // CONTÁBIL
  { id: "contador", label: "Painel contábil", icon: Calculator, pkg: "contabil", to: "/contador",
    description: "Compartilhamento com seu contador.",
    steps: [
      { title: "Convidar contador", body: "Acesso somente leitura ao financeiro.", to: "/contador" },
      { title: "Definir competência fiscal", body: "Simples, Lucro Presumido etc." },
      { title: "Enviar relatórios mensais", body: "Automático até o dia 5." },
    ]},
  { id: "fiscal", label: "NFS-e", icon: FileText, pkg: "contabil", to: "/fiscal",
    description: "Emissão por município com certificado A1.",
    steps: [
      { title: "Subir certificado A1", body: "Arquivo .pfx + senha.", to: "/fiscal" },
      { title: "Configurar prefeitura", body: "Login municipal e série." },
      { title: "Emitir nota teste", body: "Valida integração com a prefeitura." },
    ]},
  { id: "tributos", label: "Tributos", icon: Receipt, pkg: "contabil", to: "/tributos",
    description: "DAS, IRPJ e relatórios.",
    steps: [
      { title: "Importar regime tributário", body: "Do CNPJ via Receita Federal.", to: "/tributos" },
      { title: "Gerar guia DAS mensal", body: "Cálculo automático." },
      { title: "Exportar para contador", body: "PDF + XML padronizado." },
    ]},
];

const STORAGE_KEY = "saudeos:setup-progress:v1";

function loadProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function SetupPage() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string>(modules[0].id);
  const [query, setQuery] = useState("");

  useEffect(() => { setProgress(loadProgress()); }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && modules.some((m) => m.id === hash)) setActive(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const filtered = useMemo(() => {
    if (!query) return modules;
    const q = query.toLowerCase();
    return modules.filter((m) => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }, [query]);

  const activeMod = modules.find((m) => m.id === active) || modules[0];

  function stepKey(modId: string, idx: number) { return `${modId}:${idx}`; }
  function toggleStep(modId: string, idx: number) {
    setProgress((p) => ({ ...p, [stepKey(modId, idx)]: !p[stepKey(modId, idx)] }));
  }
  function modProgress(mod: Module) {
    const done = mod.steps.filter((_, i) => progress[stepKey(mod.id, i)]).length;
    return { done, total: mod.steps.length };
  }

  const totals = useMemo(() => {
    let done = 0, total = 0;
    modules.forEach((m) => { const p = modProgress(m); done += p.done; total += p.total; });
    return { done, total };
  }, [progress]);

  return (
    <AppShell>
      <div className="flex min-h-screen">
        {/* Inner fixed sidebar (modules) */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border/70 bg-surface-elevated md:flex">
          <div className="border-b border-border/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Central de configuração</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight">Implementação passo a passo</h2>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{totals.done} de {totals.total} passos</span>
              <span className="font-medium text-foreground">
                {totals.total ? Math.round((totals.done / totals.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${totals.total ? (totals.done / totals.total) * 100 : 0}%` }} />
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar função..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.map((m) => {
              const p = modProgress(m);
              const complete = p.total > 0 && p.done === p.total;
              const isActive = m.id === active;
              const Icon = m.icon;
              const info = pkgInfo[m.pkg];
              return (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                    isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                  )}
                >
                  <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", info.dot)} />
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wider opacity-70">{info.label}</span>
                    </span>
                    <span className="block truncate text-sm font-medium text-foreground">{m.label}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{p.done}/{p.total} passos</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detail */}
        <div className="flex-1 overflow-x-hidden">
          <div className="container-page max-w-3xl py-8">
            {/* Mobile module picker */}
            <div className="mb-6 md:hidden">
              <select
                value={active}
                onChange={(e) => setActive(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{pkgInfo[m.pkg].label} · {m.label}</option>
                ))}
              </select>
            </div>

            <ActiveModule mod={activeMod} progress={progress} onToggle={toggleStep} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ActiveModule({
  mod, progress, onToggle,
}: {
  mod: Module;
  progress: Record<string, boolean>;
  onToggle: (modId: string, idx: number) => void;
}) {
  const info = pkgInfo[mod.pkg];
  const Icon = mod.icon;
  const done = mod.steps.filter((_, i) => progress[`${mod.id}:${i}`]).length;
  const pct = mod.steps.length ? Math.round((done / mod.steps.length) * 100) : 0;
  const complete = done === mod.steps.length;

  return (
    <div>
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", info.chip)}>{info.label}</span>
            {complete && (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-success/15 text-success">
                <CheckCircle2 className="h-3 w-3" /> Concluído
              </span>
            )}
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight">{mod.label}</h1>
          <p className="mt-1 text-muted-foreground">{mod.description}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-surface-elevated p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 font-medium">
            <ListChecks className="h-4 w-4 text-primary" /> Progresso
          </span>
          <span className="text-muted-foreground">{done}/{mod.steps.length} ({pct}%)</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={mod.to} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Abrir módulo <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <ol className="space-y-3">
        {mod.steps.map((s, i) => {
          const checked = !!progress[`${mod.id}:${i}`];
          return (
            <li
              key={i}
              className={cn(
                "group rounded-2xl border bg-surface-elevated p-5 transition",
                checked ? "border-success/30 bg-success/[0.03]" : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggle(mod.id, i)}
                  className="mt-0.5 shrink-0"
                  aria-label={checked ? "Marcar como pendente" : "Marcar como concluído"}
                >
                  {checked
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <Circle className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Passo {i + 1}</span>
                  </div>
                  <p className={cn("mt-0.5 font-display text-base font-semibold", checked && "line-through opacity-60")}>{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  {s.to && (
                    <a href={s.to} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      Ir para configurar <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm">
        <span className="text-muted-foreground">
          {complete ? "Tudo pronto neste módulo — bom trabalho!" : "Vá marcando os passos conforme implementa."}
        </span>
        <span className="text-xs text-muted-foreground">Progresso salvo neste navegador.</span>
      </div>
    </div>
  );
}
