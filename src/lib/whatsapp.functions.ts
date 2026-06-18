import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateText, tool, stepCountIs } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: ReturnType<typeof createClient<Database>>; userId: string };

async function tenantId(ctx: Ctx) {
  const { data } = await ctx.supabase
    .from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id;
}

function normalizePhone(p: string) {
  return p.replace(/\D/g, "");
}

// ============ LIST CONVERSATIONS ============
export const listWhatsappConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const getWhatsappThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [conv, msgs] = await Promise.all([
      context.supabase.from("whatsapp_conversations").select("*").eq("id", data.conversation_id).maybeSingle(),
      context.supabase.from("whatsapp_messages").select("*").eq("conversation_id", data.conversation_id).order("created_at"),
    ]);
    if (conv.error) throw conv.error;
    if (msgs.error) throw msgs.error;
    return { conversation: conv.data, messages: msgs.data ?? [] };
  });

// ============ AGENT TOOLS (server-side) ============
function buildAgentTools(supabase: Ctx["supabase"], tid: string) {
  return {
    list_professionals: tool({
      description: "Lista os profissionais ativos da clínica para o paciente escolher.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("professionals")
          .select("id, full_name, specialty")
          .eq("tenant_id", tid)
          .eq("is_active", true);
        return (data ?? []).map((p) => ({ id: p.id, name: p.full_name, specialty: p.specialty ?? "Geral" }));
      },
    }),

    list_available_slots: tool({
      description: "Retorna horários livres de um profissional num intervalo (ISO yyyy-mm-dd). Use ao oferecer horários.",
      inputSchema: z.object({
        professional_id: z.string().uuid(),
        date_from: z.string(),
        date_to: z.string(),
      }),
      execute: async ({ professional_id, date_from, date_to }) => {
        const fromIso = new Date(`${date_from}T00:00:00`).toISOString();
        const toIso = new Date(`${date_to}T23:59:59`).toISOString();
        const [rules, appts] = await Promise.all([
          supabase.from("availability_rules").select("weekday, start_minute, end_minute").eq("tenant_id", tid).eq("professional_id", professional_id),
          supabase.from("appointments").select("starts_at, ends_at").eq("tenant_id", tid).eq("professional_id", professional_id).gte("starts_at", fromIso).lte("starts_at", toIso).neq("status", "cancelled"),
        ]);
        const ruleList = rules.data ?? [];
        const busy = (appts.data ?? []).map((a) => ({ s: new Date(a.starts_at).getTime(), e: new Date(a.ends_at).getTime() }));
        const slots: { start: string; end: string }[] = [];
        const slotMin = 30;
        const start = new Date(`${date_from}T00:00:00`);
        const end = new Date(`${date_to}T00:00:00`);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const wd = d.getDay();
          const todaysRules = ruleList.filter((r) => r.weekday === wd);
          for (const r of todaysRules) {
            for (let m = r.start_minute; m + slotMin <= r.end_minute; m += slotMin) {
              const s = new Date(d); s.setHours(0, m, 0, 0);
              const e = new Date(s.getTime() + slotMin * 60_000);
              if (s.getTime() < Date.now()) continue;
              const clash = busy.some((b) => s.getTime() < b.e && e.getTime() > b.s);
              if (!clash) slots.push({ start: s.toISOString(), end: e.toISOString() });
              if (slots.length >= 12) break;
            }
            if (slots.length >= 12) break;
          }
          if (slots.length >= 12) break;
        }
        return slots;
      },
    }),

    book_appointment: tool({
      description: "Confirma a marcação após o paciente aceitar um horário específico.",
      inputSchema: z.object({
        professional_id: z.string().uuid(),
        starts_at: z.string(),
        ends_at: z.string(),
        patient_name: z.string().min(2),
        patient_phone: z.string().min(8),
      }),
      execute: async ({ professional_id, starts_at, ends_at, patient_name, patient_phone }) => {
        const { data, error } = await supabase.from("appointments").insert({
          tenant_id: tid,
          professional_id,
          starts_at,
          ends_at,
          patient_name,
          patient_phone,
          origin: "whatsapp_agent",
          status: "scheduled",
        }).select("id, starts_at").single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, appointment_id: data.id, starts_at: data.starts_at };
      },
    }),
  };
}

// ============ RECEIVE A PATIENT MESSAGE (sandbox/webhook) ============
export const sendPatientMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patient_phone: z.string().min(8).max(40),
      patient_name: z.string().min(1).max(120).optional(),
      text: z.string().min(1).max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantId(context);
    const phone = normalizePhone(data.patient_phone);

    // Upsert conversation
    const { data: existing } = await context.supabase
      .from("whatsapp_conversations")
      .select("*").eq("tenant_id", tid).eq("patient_phone", phone).maybeSingle();
    let conv = existing;
    if (!conv) {
      const { data: created, error } = await context.supabase
        .from("whatsapp_conversations")
        .insert({ tenant_id: tid, patient_phone: phone, patient_name: data.patient_name ?? null })
        .select().single();
      if (error) throw error;
      conv = created;
    } else if (data.patient_name && !conv.patient_name) {
      await context.supabase.from("whatsapp_conversations").update({ patient_name: data.patient_name }).eq("id", conv.id);
      conv.patient_name = data.patient_name;
    }

    // Save patient message
    await context.supabase.from("whatsapp_messages").insert({
      conversation_id: conv.id, tenant_id: tid, role: "patient", content: data.text,
    });

    // Load history for context
    const { data: history } = await context.supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", conv.id)
      .order("created_at")
      .limit(30);

    const provider = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
    const tools = buildAgentTools(context.supabase, tid);

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = `Você é a recepcionista virtual da clínica, atendendo pelo WhatsApp em português do Brasil. Sua missão é ajudar o paciente a marcar, remarcar ou tirar dúvidas simples de agendamento. Regras:
- Seja breve, gentil e use "você". No máximo 4 linhas por mensagem.
- Telefone do paciente: ${phone}. Nome conhecido: ${conv.patient_name ?? "desconhecido — pergunte"}.
- Hoje é ${today}.
- Para oferecer horários, SEMPRE use a tool list_available_slots (nunca invente horário).
- Antes de marcar, confirme: profissional, data/hora e nome completo.
- Só chame book_appointment depois do "sim, confirmo" do paciente.
- Nunca dê diagnóstico, nunca prometa resultado, nunca discuta preços/valores específicos sem autorização. Se o paciente pedir algo clínico, sugira agendar consulta.
- Se não souber resolver, diga que vai chamar a recepção humana.`;

    const messagesForLLM = (history ?? []).map((m) => ({
      role: m.role === "agent" ? "assistant" as const : m.role === "patient" ? "user" as const : "system" as const,
      content: m.content,
    }));

    let replyText = "";
    let toolCallsLog: unknown[] = [];
    try {
      const result = await generateText({
        model: provider("google/gemini-2.5-flash"),
        system: systemPrompt,
        messages: messagesForLLM,
        tools,
        stopWhen: stepCountIs(8),
      });
      replyText = result.text || "Tudo bem! Em que mais posso ajudar?";
      toolCallsLog = result.steps?.flatMap((s) => s.toolCalls ?? []) ?? [];
    } catch (e) {
      replyText = "Desculpe, tive um problema agora. Já vou chamar a recepção para te ajudar.";
      toolCallsLog = [{ error: (e as Error).message }];
    }

    await context.supabase.from("whatsapp_messages").insert({
      conversation_id: conv.id,
      tenant_id: tid,
      role: "agent",
      content: replyText,
      tool_calls: toolCallsLog.length ? JSON.parse(JSON.stringify(toolCallsLog)) : null,
    });
    await context.supabase.from("whatsapp_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);

    return { conversation_id: conv.id, reply: replyText };
  });

export const setWhatsappStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "handoff", "closed"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("whatsapp_conversations").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
