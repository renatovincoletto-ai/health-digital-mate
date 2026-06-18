import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const SlugInput = z.object({ slug: z.string().min(1).max(80) });

export const getPublicAgendaData = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => SlugInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: tenant, error: tErr } = await sb
      .from("tenants")
      .select("id, slug, display_name, specialty, city, state, onboarding_status")
      .eq("slug", data.slug)
      .eq("onboarding_status", "completed")
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tenant) return null;

    const [{ data: pros }, { data: svcs }, { data: rules }, { data: blocks }] = await Promise.all([
      sb.from("professionals").select("id,full_name,specialty,color,avatar_url")
        .eq("tenant_id", tenant.id).eq("is_active", true),
      sb.from("services").select("id,name,description,duration_minutes,price_cents,color")
        .eq("tenant_id", tenant.id).eq("is_active", true).eq("is_public", true),
      sb.from("availability_rules").select("professional_id,weekday,start_minute,end_minute")
        .eq("tenant_id", tenant.id),
      sb.from("availability_blocks").select("professional_id,starts_at,ends_at")
        .eq("tenant_id", tenant.id).gte("ends_at", new Date().toISOString()),
    ]);

    return {
      tenant,
      professionals: pros ?? [],
      services: svcs ?? [],
      rules: rules ?? [],
      blocks: blocks ?? [],
    };
  });

const BookedInput = z.object({
  tenant_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  from: z.string(),
  to: z.string(),
});

// Retorna apenas intervalos ocupados (sem PII)
export const getBookedSlots = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => BookedInput.parse(d))
  .handler(async ({ data }) => {
    // usa service_role apenas para retornar janelas ocupadas (sem dados de paciente)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("appointments")
      .select("starts_at,ends_at")
      .eq("tenant_id", data.tenant_id)
      .eq("professional_id", data.professional_id)
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", data.from)
      .lte("starts_at", data.to);
    if (error) throw error;
    return rows ?? [];
  });

const BookInput = z.object({
  tenant_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  service_id: z.string().uuid(),
  patient_name: z.string().min(2).max(120),
  patient_email: z.string().email().optional().or(z.literal("")),
  patient_phone: z.string().min(8).max(30),
  patient_notes: z.string().max(1000).optional(),
  starts_at: z.string(),
  ends_at: z.string(),
});

export const createPublicAppointment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BookInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("appointments")
      .insert({
        ...data,
        patient_email: data.patient_email || null,
        origin: "public",
        status: "pending",
      })
      .select("id")
      .single();
    if (error) {
      // se overlap, retorna mensagem amigável
      if (error.message?.includes("appointments_no_overlap")) {
        throw new Error("Este horário acabou de ser reservado. Escolha outro.");
      }
      throw error;
    }
    return row;
  });
