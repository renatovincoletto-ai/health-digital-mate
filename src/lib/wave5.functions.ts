import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

async function tenantId(ctx: { supabase: ReturnType<typeof createClient<Database>>; userId: string }) {
  const { data } = await ctx.supabase
    .from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id;
}

// ============ LOCATIONS (multi-unit) ============
export const listLocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("locations").select("*").order("is_primary", { ascending: false }).order("created_at");
    if (error) throw error;
    return data ?? [];
  });

const LocationInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  address: z.string().max(240).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(5).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  is_primary: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const saveLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LocationInput.parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    if (data.is_primary) {
      await context.supabase.from("locations").update({ is_primary: false }).eq("tenant_id", tid);
    }
    const payload = { ...data, tenant_id: tid };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("locations").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("locations").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deleteLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("locations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ ANAMNESE ============
export const listAnamneseTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("anamnese_templates").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const QuestionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "boolean", "select"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
});

const TemplateInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  questions: z.array(QuestionSchema).default([]),
  active: z.boolean().default(true),
});

export const saveAnamneseTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TemplateInput.parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const payload = { ...data, tenant_id: tid, questions: data.questions };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("anamnese_templates").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("anamnese_templates").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const generateAnamneseTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ specialty: z.string().min(2).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const provider = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
    const { text } = await generateText({
      model: provider("google/gemini-2.5-flash"),
      system: "Você é um especialista em prontuários médicos/odontológicos no Brasil. Gere anamneses adequadas à LGPD e às boas práticas dos conselhos (CFM/CFO).",
      prompt: `Crie uma anamnese digital para a especialidade "${data.specialty}". Retorne APENAS JSON válido no formato:
{"name":"...","description":"...","questions":[{"id":"q1","label":"...","type":"text|textarea|boolean|select","options":["..."],"required":true}]}
Inclua 8 a 12 perguntas cobrindo: queixa principal, histórico, alergias, medicamentos em uso, condições crônicas e dados específicos da especialidade. Nunca peça CPF, RG ou dados não essenciais.`,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inválida da IA");
    const parsed = JSON.parse(match[0]);
    return parsed as { name: string; description: string; questions: Array<z.infer<typeof QuestionSchema>> };
  });

export const listAnamneseResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("anamnese_responses")
      .select("*, anamnese_templates(name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

// Public anamnese — anon submit (uses publishable client)
export const getPublicAnamnese = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: tenant } = await sb
      .from("tenants").select("id, display_name").eq("slug", data.slug).maybeSingle();
    if (!tenant) return null;
    const { data: template } = await sb
      .from("anamnese_templates")
      .select("id, name, description, questions")
      .eq("tenant_id", tenant.id).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return { tenant, template };
  });

export const submitAnamnese = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      slug: z.string(),
      template_id: z.string().uuid(),
      patient_name: z.string().min(2).max(120),
      patient_email: z.string().email().optional().or(z.literal("")),
      patient_phone: z.string().max(30).optional(),
      answers: z.record(z.string(), z.any()),
      lgpd_consent: z.literal(true),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: tenant } = await sb
      .from("tenants").select("id").eq("slug", data.slug).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const { error } = await sb.from("anamnese_responses").insert({
      tenant_id: tenant.id,
      template_id: data.template_id,
      patient_name: data.patient_name,
      patient_email: data.patient_email || null,
      patient_phone: data.patient_phone || null,
      answers: data.answers,
      lgpd_consent: true,
    });
    if (error) throw error;
    return { ok: true };
  });

// ============ CONSULTATION NOTES (AI SOAP) ============
export const listConsultationNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("consultation_notes").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const generateSoapNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patient_name: z.string().min(2).max(120),
      patient_phone: z.string().max(40).optional().nullable(),
      transcript: z.string().min(20).max(20000),
      specialty: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const provider = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
    const { text } = await generateText({
      model: provider("google/gemini-2.5-flash"),
      system: "Você é um assistente clínico. Gera (1) nota SOAP técnica para o prontuário e (2) um resumo curto, em linguagem leiga e acolhedora, para o paciente leigo entender o que aconteceu na consulta e quais são os próximos passos. Nunca invente sintomas, diagnósticos ou condutas. Não inclua diagnóstico não mencionado.",
      prompt: `Especialidade: ${data.specialty ?? "Geral"}.
Paciente: ${data.patient_name}.
Transcrição/anotações da consulta:
"""
${data.transcript}
"""

Retorne APENAS JSON no formato exato:
{"subjective":"...","objective":"...","assessment":"...","plan":"...","patient_summary":"Olá ${data.patient_name}, ..."}

O campo patient_summary deve ter no máximo 6 linhas, em português claro, sem jargão médico, citar orientações e próximos passos. Não inclua dados sensíveis desnecessários.`,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inválida da IA");
    const soap = JSON.parse(match[0]) as {
      subjective: string; objective: string; assessment: string; plan: string; patient_summary: string;
    };
    const { data: row, error } = await context.supabase.from("consultation_notes").insert({
      tenant_id: tid,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone || null,
      transcript: data.transcript,
      soap_subjective: soap.subjective,
      soap_objective: soap.objective,
      soap_assessment: soap.assessment,
      soap_plan: soap.plan,
      patient_summary: soap.patient_summary,
      status: "ready",
    }).select().single();
    if (error) throw error;
    return row;
  });

export const transcribeConsultationAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      audio_base64: z.string().min(100),
      mime: z.string().min(3).max(60),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const extMap: Record<string, string> = {
      "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3",
      "audio/wav": "wav", "audio/ogg": "ogg",
    };
    const ext = extMap[data.mime.split(";")[0]] ?? "webm";
    const bin = Uint8Array.from(atob(data.audio_base64), (c) => c.charCodeAt(0));
    const file = new File([bin], `consulta.${ext}`, { type: data.mime });
    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", file);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Configurações.");
      throw new Error(`Falha ao transcrever: ${res.status} ${t}`);
    }
    const json = await res.json() as { text?: string };
    return { text: json.text ?? "" };
  });

export const markConsultationWhatsappSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("consultation_notes")
      .update({ whatsapp_sent_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });


// ============ REPUTATION ============
export const listReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: reviews }, { data: requests }] = await Promise.all([
      context.supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      context.supabase.from("review_requests").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    return { reviews: reviews ?? [], requests: requests ?? [] };
  });

const ReviewInput = z.object({
  source: z.enum(["google", "direct", "facebook"]).default("direct"),
  author_name: z.string().max(120).optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000).optional(),
});

export const addReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const { data: row, error } = await context.supabase
      .from("reviews").insert({ ...data, tenant_id: tid, reviewed_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return row;
  });

export const suggestReviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ review_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: review } = await context.supabase
      .from("reviews").select("*").eq("id", data.review_id).maybeSingle();
    if (!review) throw new Error("Avaliação não encontrada");
    const provider = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
    const { text } = await generateText({
      model: provider("google/gemini-2.5-flash"),
      system: "Você responde avaliações de pacientes em consultórios médicos/odontológicos no Brasil. Tom: educado, profissional, humano. Nunca confirme tratamento nem cite dados clínicos. Respeite a LGPD: nunca confirme se a pessoa é paciente.",
      prompt: `Avaliação ${review.rating}/5 de ${review.author_name ?? "paciente"}:\n"${review.content ?? ""}"\n\nEscreva uma resposta curta (até 3 frases) em português.`,
    });
    await context.supabase.from("reviews").update({ reply: text, reply_status: "drafted" }).eq("id", data.review_id);
    return { reply: text };
  });

export const scheduleReviewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patient_name: z.string().min(2),
      patient_phone: z.string().optional(),
      patient_email: z.string().email().optional().or(z.literal("")),
      channel: z.enum(["whatsapp", "email", "sms"]).default("whatsapp"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const { data: row, error } = await context.supabase.from("review_requests").insert({
      tenant_id: tid,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone || null,
      patient_email: data.patient_email || null,
      channel: data.channel,
      status: "queued",
    }).select().single();
    if (error) throw error;
    return row;
  });

// ============ EMAIL MARKETING ============
export const listEmailData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: campaigns }, { data: contacts }] = await Promise.all([
      context.supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
      context.supabase.from("email_contacts").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    return { campaigns: campaigns ?? [], contacts: contacts ?? [] };
  });

const CampaignInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  subject: z.string().min(2).max(200),
  preheader: z.string().max(200).optional().nullable(),
  body_html: z.string().max(50000).optional().nullable(),
  audience: z.string().default("all"),
  scheduled_for: z.string().datetime().optional().nullable(),
});

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CampaignInput.parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const payload = { ...data, tenant_id: tid };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("email_campaigns").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("email_campaigns").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const generateCampaignContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      topic: z.string().min(3).max(200),
      tone: z.string().default("acolhedor"),
      specialty: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const provider = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
    const { text } = await generateText({
      model: provider("google/gemini-2.5-flash"),
      system: "Você escreve e-mails marketing para consultórios médicos/odontológicos no Brasil. Respeite CFM/CFO e LGPD: sem promessa de resultado, sem antes/depois, sem sensacionalismo. Tom humano e útil.",
      prompt: `Crie um e-mail sobre "${data.topic}" para a especialidade "${data.specialty ?? "saúde"}". Tom: ${data.tone}.
Retorne APENAS JSON: {"subject":"...","preheader":"...","body_html":"<html aceito por clientes de e-mail, sem css externo>"}.`,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inválida da IA");
    return JSON.parse(match[0]) as { subject: string; preheader: string; body_html: string };
  });

const ContactInput = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  tags: z.array(z.string()).default([]),
});

export const addContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ContactInput.parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const { data: row, error } = await context.supabase
      .from("email_contacts")
      .upsert({ ...data, tenant_id: tid }, { onConflict: "tenant_id,email" })
      .select().single();
    if (error) throw error;
    return row;
  });
