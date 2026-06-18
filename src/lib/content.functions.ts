import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateText } from "ai";

// ---------- BRAND ----------
const BrandInput = z.object({
  logo_url: z.string().optional().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  font_heading: z.string().max(60).optional().nullable(),
  font_body: z.string().max(60).optional().nullable(),
  tone_of_voice: z.string().max(2000).optional().nullable(),
});

export const saveBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BrandInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const { data: row, error } = await context.supabase
      .from("brands")
      .update(data)
      .eq("tenant_id", tenant.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      const { data: ins, error: e2 } = await context.supabase
        .from("brands").insert({ ...data, tenant_id: tenant.id }).select().single();
      if (e2) throw e2;
      return ins;
    }
    return row;
  });

export const getBrand = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) return null;
    const { data } = await context.supabase
      .from("brands").select("*").eq("tenant_id", tenant.id).maybeSingle();
    return data;
  });

// ---------- POSTS ----------
export const listPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("social_posts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const PostInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200).optional().nullable(),
  caption: z.string().max(3000),
  hashtags: z.string().max(500).optional().nullable(),
  image_url: z.string().optional().nullable(),
  platforms: z.array(z.enum(["instagram", "facebook", "linkedin"])).min(1),
  scheduled_for: z.string().optional().nullable(),
  status: z.enum(["draft", "scheduled", "published", "failed"]).default("draft"),
});

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PostInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const payload = { ...data, tenant_id: tenant.id, created_by: context.userId };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("social_posts").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("social_posts").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("social_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- AI: GENERATE CAPTION ----------
const CaptionInput = z.object({
  topic: z.string().min(3).max(500),
  platform: z.enum(["instagram", "facebook", "linkedin"]).default("instagram"),
});

export const generateCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CaptionInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: tenant } = await context.supabase
      .from("tenants").select("display_name,specialty,type")
      .eq("owner_id", context.userId).maybeSingle();
    const { data: brand } = await context.supabase
      .from("brands").select("tone_of_voice")
      .eq("tenant_id", (await context.supabase.from("tenants").select("id").eq("owner_id", context.userId).maybeSingle()).data?.id ?? "")
      .maybeSingle();

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `Você é um copywriter especializado em saúde no Brasil.
Tom: ${brand?.tone_of_voice || "humanizado, educativo, acolhedor"}.
Plataforma: ${data.platform}.
Regras CFM/CFO: NUNCA prometer cura, NUNCA usar antes/depois sem disclaimer, NUNCA sensacionalismo, NUNCA descontos como atrativo principal. Use linguagem informativa, plural.
Inclua 6 hashtags relevantes ao final.
${tenant?.specialty ? `Especialidade: ${tenant.specialty}.` : ""}
Profissional: ${tenant?.display_name || ""}.`,
      prompt: `Crie uma legenda para ${data.platform} sobre: ${data.topic}`,
    });
    return { caption: text };
  });

// ---------- AI: GENERATE IMAGE ----------
const ImageInput = z.object({
  prompt: z.string().min(5).max(1000),
});

export const generatePostImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImageInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const { data: brand } = await context.supabase
      .from("brands").select("primary_color,secondary_color,accent_color")
      .eq("tenant_id", tenant.id).maybeSingle();

    const palette = [brand?.primary_color, brand?.secondary_color, brand?.accent_color]
      .filter(Boolean).join(", ");
    const styled = `${data.prompt}. Square 1:1 social media post for a healthcare professional. Clean, professional, photorealistic or modern flat illustration. ${palette ? `Use brand color palette: ${palette}.` : ""} Respeite o tom profissional médico/odontológico.`;

    // Call Lovable AI Gateway image generation (OpenAI-compatible chat with image modality)
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: styled }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Limite de geração atingido. Tente em alguns instantes.");
      if (res.status === 402) throw new Error("Créditos esgotados. Adicione créditos para continuar.");
      throw new Error(`Falha ao gerar imagem (${res.status}): ${t}`);
    }
    const json: any = await res.json();
    const imageUrl: string | undefined = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("Resposta sem imagem.");

    // dataURL → upload para bucket
    const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return { image_url: imageUrl };
    const mime = match[1];
    const ext = mime.split("/")[1] || "png";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const path = `${tenant.id}/posts/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await context.supabase.storage
      .from("brand-assets").upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = context.supabase.storage.from("brand-assets").getPublicUrl(path);
    return { image_url: pub.publicUrl };
  });

// ---------- AI: GENERATE CONTENT IDEAS ----------
export const generateContentIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { data: tenant } = await context.supabase
      .from("tenants").select("id,display_name,specialty,type")
      .eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `Você é um estrategista de conteúdo para profissionais de saúde no Brasil.
Compliance CFM/CFO obrigatório: NUNCA promessa de cura, NUNCA antes/depois sensacionalista, sempre educativo.
Retorne um JSON array com EXATAMENTE 8 ideias, cada uma com {"title":"...","body":"...","category":"educativo|institucional|sazonal|engajamento"}.
Apenas o JSON, sem markdown.`,
      prompt: `Gere 8 ideias de posts para ${tenant.display_name}${tenant.specialty ? ` (${tenant.specialty})` : ""} para o próximo mês.`,
    });
    let ideas: any[] = [];
    try {
      const clean = text.replace(/^```json\n?|\n?```$/g, "").trim();
      ideas = JSON.parse(clean);
    } catch {
      throw new Error("Resposta inválida da IA");
    }
    const rows = ideas.slice(0, 8).map((i: any) => ({
      tenant_id: tenant.id,
      title: String(i.title || "").slice(0, 200),
      body: String(i.body || "").slice(0, 2000),
      category: String(i.category || "educativo").slice(0, 50),
    }));
    const { data: inserted, error } = await context.supabase
      .from("content_ideas").insert(rows).select();
    if (error) throw error;
    return inserted ?? [];
  });

export const listContentIdeas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("content_ideas").select("*").order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  });

// ---------- AD CAMPAIGNS ----------
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ad_campaigns").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const CampaignInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  platform: z.enum(["google_search", "google_pmax", "meta_instagram", "meta_facebook"]),
  objective: z.enum(["leads", "site_visits", "agendamentos", "reconhecimento"]),
  status: z.enum(["draft", "active", "paused", "ended"]).default("draft"),
  daily_budget_cents: z.number().int().min(0),
  audience: z.string().max(500).optional().nullable(),
  headline: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  landing_url: z.string().url().optional().nullable().or(z.literal("")),
});

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CampaignInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const payload: any = { ...data, tenant_id: tenant.id, landing_url: data.landing_url || null };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("ad_campaigns").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("ad_campaigns").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ad_campaigns").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- AI: SUGGEST CAMPAIGN COPY ----------
const SuggestCampaignInput = z.object({
  platform: z.enum(["google_search", "google_pmax", "meta_instagram", "meta_facebook"]),
  objective: z.enum(["leads", "site_visits", "agendamentos", "reconhecimento"]),
  briefing: z.string().min(5).max(1000),
});

export const suggestCampaignCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SuggestCampaignInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { data: tenant } = await context.supabase
      .from("tenants").select("display_name,specialty,city,state")
      .eq("owner_id", context.userId).maybeSingle();

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `Você cria copy de anúncios para profissionais de saúde no Brasil.
Compliance CFM/CFO obrigatório: NUNCA promessa de resultado, NUNCA antes/depois, NUNCA desconto como gatilho principal.
Retorne JSON {"headline":"até 30 chars","description":"até 90 chars","audience":"sugestão de público"}. Apenas JSON.`,
      prompt: `Plataforma: ${data.platform}. Objetivo: ${data.objective}. Local: ${tenant?.city || ""}/${tenant?.state || ""}. Especialidade: ${tenant?.specialty || ""}. Briefing: ${data.briefing}`,
    });
    try {
      const clean = text.replace(/^```json\n?|\n?```$/g, "").trim();
      return JSON.parse(clean);
    } catch {
      throw new Error("Resposta inválida da IA");
    }
  });
