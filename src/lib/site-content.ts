import { z } from "zod";

export const SiteContentSchema = z.object({
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string().optional(),
  }),
  about: z.object({
    title: z.string(),
    body: z.string(),
  }),
  services: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  differentiators: z.array(z.string()),
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
  location: z.object({
    address: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    hours: z.string().optional(),
  }),
  contact: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
  }),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

export const defaultSiteContent = (
  displayName: string,
  specialty?: string | null,
  city?: string | null,
): SiteContent => ({
  hero: {
    headline: `Cuidado em ${specialty || "saúde"} com escuta de verdade`,
    subheadline: `${displayName} acompanha você do diagnóstico ao tratamento, com tempo, ciência e respeito.`,
    primaryCta: "Agendar consulta",
    secondaryCta: "Conhecer o consultório",
  },
  about: {
    title: "Sobre o consultório",
    body: "Conte aqui sua história, formação e o que torna seu atendimento único.",
  },
  services: [
    { title: "Consulta", description: "Avaliação completa com tempo dedicado a você." },
    { title: "Acompanhamento", description: "Retornos e plano de cuidado individualizado." },
  ],
  differentiators: [
    "Atendimento humanizado",
    "Estrutura moderna",
    "Tecnologia a serviço do diagnóstico",
  ],
  faq: [
    {
      question: "Quais convênios são aceitos?",
      answer: "Entre em contato pelo WhatsApp para informações atualizadas.",
    },
  ],
  location: {
    city: city ?? undefined,
  },
  contact: {},
});

export const COMPLIANCE_GUARDRAILS = `
DIRETRIZES OBRIGATÓRIAS (CFM/CFO/LGPD) — você DEVE seguir:
- NUNCA prometer resultado, cura, sucesso garantido.
- NUNCA usar expressões como "antes e depois", "o melhor", "o número 1", "o mais procurado".
- NUNCA criar conteúdo sensacionalista, com apelo emocional excessivo ou que induza ao medo.
- NUNCA mencionar preços, descontos, condições comerciais ou promoções de procedimentos.
- NUNCA divulgar especialidade não registrada nos órgãos competentes (CRM/CFM/CRO/CFO).
- Sempre mencionar o registro no conselho quando relevante.
- Tom: técnico, acolhedor, sóbrio. Sem emojis em textos do site.
- Linguagem: português do Brasil, formal-acessível.
`.trim();
