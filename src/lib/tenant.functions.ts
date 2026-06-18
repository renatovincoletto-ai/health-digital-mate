import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultSiteContent } from "./site-content";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const getMyTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

/**
 * Garante que o usuário tenha um tenant mínimo, criando um padrão se necessário.
 * Substitui o onboarding obrigatório inicial — agora cada seção tem seu próprio onboarding.
 */
export const ensureMyTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (existing) return existing;

    const email = (context.claims?.email as string | undefined) ?? "";
    const fallbackName = email ? email.split("@")[0] : "Meu Consultório";
    const displayName = fallbackName.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const baseSlug = slugify(displayName) || "consultorio";

    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 6) {
      const { data: taken } = await context.supabase
        .from("tenants").select("id").eq("slug", slug).maybeSingle();
      if (!taken) break;
      attempt += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .insert({
        type: "medico",
        display_name: displayName,
        owner_id: context.userId,
        slug,
        onboarding_status: "pending",
      })
      .select()
      .single();
    if (error) throw error;

    await context.supabase.from("user_roles").insert({
      user_id: context.userId, tenant_id: tenant.id, role: "owner",
    });
    await context.supabase.from("brands").insert({ tenant_id: tenant.id });
    const seed = defaultSiteContent(tenant.display_name, tenant.specialty, tenant.city);
    await context.supabase.from("sites").insert({
      tenant_id: tenant.id,
      content: seed,
      seo_title: tenant.display_name,
      seo_description: seed.hero.subheadline,
    });
    return tenant;
  });

const CreateTenantSchema = z.object({
  type: z.enum(["medico", "dentista", "clinica", "outro"]),
  display_name: z.string().min(2).max(100),
  specialty: z.string().max(80).optional(),
  council_type: z.string().max(10).optional(),
  council_number: z.string().max(30).optional(),
  council_state: z.string().max(5).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(5).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
});

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateTenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const baseSlug = slugify(data.display_name) || "consultorio";
    // garante slug único
    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 6) {
      const { data: existing } = await context.supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .insert({
        ...data,
        owner_id: context.userId,
        slug,
        onboarding_status: "site_pending",
      })
      .select()
      .single();
    if (error) throw error;

    // role owner
    await context.supabase.from("user_roles").insert({
      user_id: context.userId,
      tenant_id: tenant.id,
      role: "owner",
    });

    // brand default
    await context.supabase.from("brands").insert({ tenant_id: tenant.id });

    // site default
    const seed = defaultSiteContent(tenant.display_name, tenant.specialty, tenant.city);
    await context.supabase.from("sites").insert({
      tenant_id: tenant.id,
      content: seed,
      seo_title: `${tenant.display_name} — ${tenant.specialty || (tenant.type === "dentista" ? "Odontologia" : "Saúde")}${tenant.city ? ` em ${tenant.city}` : ""}`,
      seo_description: seed.hero.subheadline,
    });

    return tenant;
  });

export const finishOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ onboarding_status: "completed" })
      .eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
