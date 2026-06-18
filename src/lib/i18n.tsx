import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "pt-BR" | "en";

type Dict = Record<string, string>;

const ptBR: Dict = {
  "nav.search": "Buscar…",
  "nav.search.aria": "Abrir busca rápida (Ctrl+K)",
  "nav.skip": "Pular para o conteúdo",
  "nav.signout": "Sair",
  "nav.main": "Navegação principal",
  "palette.placeholder": "Buscar página… (ex: agenda, NPS, financeiro)",
  "palette.empty": "Nenhum resultado.",
  "lang.label": "Idioma",
  // Groups
  "group.visao": "Visão",
  "group.clinic": "Clinic — Atendimento",
  "group.pay": "Pay — Financeiro",
  "group.flow": "Flow — Relacionamento",
  "group.presenca": "Presença — Marketing",
  "group.contabil": "Contábil — Fiscal",
  "group.config": "Configuração",
  // Items
  "item.dashboard": "Painel",
  "item.setup": "Central de configuração",
  "item.integracoes": "Integrações",
  "item.bi": "BI",
  "item.agenda": "Agenda",
  "item.recepcao": "Recepção",
  "item.pacientes": "Pacientes",
  "item.prontuario": "Prontuário",
  "item.anamnese": "Anamnese",
  "item.teleconsulta": "Teleconsulta",
  "item.prescricoes": "Prescrições",
  "item.modelos": "Modelos de documentos",
  "item.planos": "Planos de tratamento",
  "item.estoque": "Estoque",
  "item.unidades": "Unidades",
  "item.financeiro": "Caixa",
  "item.pagamentos": "Pagamentos online",
  "item.maquininhas": "Maquininhas (TEF)",
  "item.orcamentos": "Orçamentos",
  "item.repasses": "Repasses",
  "item.convenios": "Convênios",
  "item.tiss": "Guias TISS",
  "item.whatsapp": "Agente WhatsApp",
  "item.automacoes": "Automações",
  "item.jornadas": "Jornadas IA",
  "item.lembretes": "Lembretes",
  "item.indicacoes": "Indicações",
  "item.nps": "NPS",
  "item.chat": "Chat interno",
  "item.callcenter": "Call center",
  "item.site": "Site",
  "item.conteudo": "Conteúdo",
  "item.anuncios": "Anúncios",
  "item.email": "E-mail mkt",
  "item.reputacao": "Reputação",
  "item.contador": "Painel contábil",
  "item.fiscal": "NFS-e",
  "item.tributos": "Tributos",
  "item.dre": "DRE",
  "item.folha": "Folha de pagamento",
  "item.equipe": "Equipe & permissões",
  "item.faturamento": "Plano & Faturamento",
  "item.dados": "Importar & Exportar",
  "item.tasks": "Tasks & Feedback",
  "item.auditoria": "Auditoria",
  "nav.menu": "Abrir menu",
};

const en: Dict = {
  "nav.search": "Search…",
  "nav.search.aria": "Open quick search (Ctrl+K)",
  "nav.skip": "Skip to content",
  "nav.signout": "Sign out",
  "nav.main": "Main navigation",
  "palette.placeholder": "Search page… (e.g. agenda, NPS, finance)",
  "palette.empty": "No results.",
  "lang.label": "Language",
  "group.visao": "Overview",
  "group.clinic": "Clinic — Care",
  "group.pay": "Pay — Finance",
  "group.flow": "Flow — Relationships",
  "group.presenca": "Presence — Marketing",
  "group.contabil": "Accounting — Tax",
  "group.config": "Settings",
  "item.dashboard": "Dashboard",
  "item.setup": "Setup center",
  "item.integracoes": "Integrations",
  "item.bi": "BI",
  "item.agenda": "Calendar",
  "item.recepcao": "Reception",
  "item.pacientes": "Patients",
  "item.prontuario": "Medical record",
  "item.anamnese": "Intake form",
  "item.teleconsulta": "Telehealth",
  "item.prescricoes": "Prescriptions",
  "item.modelos": "Document templates",
  "item.planos": "Treatment plans",
  "item.estoque": "Inventory",
  "item.unidades": "Locations",
  "item.financeiro": "Cash",
  "item.pagamentos": "Online payments",
  "item.maquininhas": "Card readers (TEF)",
  "item.orcamentos": "Quotes",
  "item.repasses": "Payouts",
  "item.convenios": "Insurance",
  "item.tiss": "TISS claims",
  "item.whatsapp": "WhatsApp agent",
  "item.automacoes": "Automations",
  "item.jornadas": "AI journeys",
  "item.lembretes": "Reminders",
  "item.indicacoes": "Referrals",
  "item.nps": "NPS",
  "item.chat": "Internal chat",
  "item.callcenter": "Call center",
  "item.site": "Website",
  "item.conteudo": "Content",
  "item.anuncios": "Ads",
  "item.email": "Email marketing",
  "item.reputacao": "Reputation",
  "item.contador": "Accounting panel",
  "item.fiscal": "Invoices (NFS-e)",
  "item.tributos": "Taxes",
  "item.dre": "Income statement",
  "item.folha": "Payroll",
  "item.equipe": "Team & permissions",
  "item.faturamento": "Plan & Billing",
  "item.dados": "Import & Export",
  "item.tasks": "Tasks & Feedback",
};

const dicts: Record<Locale, Dict> = { "pt-BR": ptBR, en };

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string };

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "app.locale";

function detectInitial(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved === "pt-BR" || saved === "en") return saved;
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  return nav.startsWith("pt") ? "pt-BR" : nav.startsWith("en") ? "en" : "pt-BR";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR");

  useEffect(() => {
    setLocaleState(detectInitial());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "pt-BR" ? "pt-BR" : "en";
    }
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }

  function t(key: string): string {
    return dicts[locale][key] ?? dicts["pt-BR"][key] ?? key;
  }

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback when provider missing (e.g., SSR).
    return {
      locale: "pt-BR",
      setLocale: () => {},
      t: (key: string) => dicts["pt-BR"][key] ?? key,
    };
  }
  return ctx;
}
