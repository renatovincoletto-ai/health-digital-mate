import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { COMPLIANCE_GUARDRAILS, SiteContentSchema, type SiteContent } from "./site-content";

export const getMySite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tenant, error: tErr } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tenant) return null;

    const [siteRes, messagesRes, brandRes] = await Promise.all([
      context.supabase.from("sites").select("*").eq("tenant_id", tenant.id).maybeSingle(),
      context.supabase
        .from("site_messages")
        .select("*")
        .eq(
          "site_id",
          (await context.supabase
            .from("sites")
            .select("id")
            .eq("tenant_id", tenant.id)
            .maybeSingle()).data?.id ?? "00000000-0000-0000-0000-000000000000",
        )
        .order("created_at"),
      context.supabase.from("brands").select("*").eq("tenant_id", tenant.id).maybeSingle(),
    ]);

    if (siteRes.error) throw siteRes.error;
    return {
      tenant,
      site: siteRes.data,
      messages: messagesRes.data ?? [],
      brand: brandRes.data,
    };
  });

const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const sendAssistantMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SendMessageSchema.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: tenant, error: tErr } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tenant) throw new Error("Tenant não encontrado");

    const { data: site, error: sErr } = await context.supabase
      .from("sites")
      .select("*")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!site) throw new Error("Site não encontrado");

    // salva user message
    await context.supabase.from("site_messages").insert({
      site_id: site.id,
      role: "user",
      content: data.message,
    });

    // histórico (últimas 12 mensagens)
    const { data: history } = await context.supabase
      .from("site_messages")
      .select("role, content")
      .eq("site_id", site.id)
      .order("created_at", { ascending: false })
      .limit(12);
    const ordered = [...(history ?? [])].reverse();

    const systemPrompt = `Você é o assistente de site do SaúdeOS. Você ajuda ${tenant.type === "dentista" ? "dentistas" : tenant.type === "clinica" ? "clínicas" : "médicos"} a criar e editar o site profissional deles.

Sobre o profissional/consultório:
- Nome: ${tenant.display_name}
- Tipo: ${tenant.type}
- Especialidade: ${tenant.specialty || "não informada"}
- Conselho: ${tenant.council_type || ""} ${tenant.council_number || ""}${tenant.council_state ? `/${tenant.council_state}` : ""}
- Cidade: ${tenant.city || "não informada"}

${COMPLIANCE_GUARDRAILS}

A cada mensagem do usuário, você responde com:
1. Uma resposta amigável e curta (campo "reply") explicando o que você fez ou perguntando o que falta.
2. O conteúdo completo e atualizado do site (campo "siteContent") seguindo exatamente o schema.

Se o usuário só conversar (sem pedir mudança), repita o conteúdo atual sem alterações no siteContent.
Sempre escreva em português do Brasil. Tom acolhedor, profissional, sem clichês.`;

    const currentContent = JSON.stringify(site.content);

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { experimental_output } = await generateText({
        model,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Conteúdo atual do site (JSON):\n${currentContent}\n\n---\nMensagem do profissional: ${data.message}`,
          },
          ...ordered.slice(0, -1).map((m) => ({
            role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: m.content,
          })),
        ],
        experimental_output: Output.object({
          schema: z.object({
            reply: z.string(),
            siteContent: SiteContentSchema,
          }),
        }),
      });

      const result = experimental_output as { reply: string; siteContent: SiteContent };

      // salva assistant message
      await context.supabase.from("site_messages").insert({
        site_id: site.id,
        role: "assistant",
        content: result.reply,
      });

      // atualiza site
      await context.supabase
        .from("sites")
        .update({ content: result.siteContent })
        .eq("id", site.id);

      return { reply: result.reply, siteContent: result.siteContent };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar resposta";
      await context.supabase.from("site_messages").insert({
        site_id: site.id,
        role: "assistant",
        content: `Tive um problema para processar agora: ${message}. Pode tentar de novo?`,
      });
      throw err;
    }
  });

export const togglePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ published: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!tenant) throw new Error("Tenant não encontrado");
    const { error } = await context.supabase
      .from("sites")
      .update({ published: data.published })
      .eq("tenant_id", tenant.id);
    if (error) throw error;
    if (data.published) {
      await context.supabase
        .from("tenants")
        .update({ onboarding_status: "completed" })
        .eq("id", tenant.id);
    }
    return { ok: true };
  });

// PÚBLICO: usado pela rota /s/$slug — leitura via publishable key + policy TO anon
export const getPublicSite = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: tenant, error } = await client
      .from("tenants")
      .select("id, display_name, slug, type, specialty, city, state, phone, whatsapp, email, council_type, council_number, council_state")
      .eq("slug", data.slug)
      .eq("onboarding_status", "completed")
      .maybeSingle();
    if (error) throw error;
    if (!tenant) return null;
    const { data: site } = await client
      .from("sites")
      .select("content, seo_title, seo_description, published")
      .eq("tenant_id", tenant.id)
      .eq("published", true)
      .maybeSingle();
    if (!site) return null;
    return { tenant, site };
  });
