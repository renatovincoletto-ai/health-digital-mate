import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- PROFESSIONALS ----------
export const listProfessionals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("professionals")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const ProfessionalInput = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2).max(120),
  specialty: z.string().max(120).optional().nullable(),
  council_type: z.string().max(10).optional().nullable(),
  council_number: z.string().max(30).optional().nullable(),
  council_state: z.string().max(5).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3B82F6"),
  is_active: z.boolean().default(true),
});

export const saveProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfessionalInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const payload = { ...data, tenant_id: tenant.id, email: data.email || null };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("professionals").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("professionals").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deleteProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("professionals").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- SERVICES ----------
export const listServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("services").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const ServiceInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  duration_minutes: z.number().int().min(5).max(600),
  price_cents: z.number().int().min(0).optional().nullable(),
  requires_deposit: z.boolean().default(false),
  deposit_cents: z.number().int().min(0).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#10B981"),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
});

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ServiceInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const payload = { ...data, tenant_id: tenant.id };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("services").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("services").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- AVAILABILITY RULES ----------
export const listAvailabilityRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("availability_rules").select("*").order("weekday", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const RulesInput = z.object({
  professional_id: z.string().uuid(),
  rules: z.array(z.object({
    weekday: z.number().int().min(0).max(6),
    start_minute: z.number().int().min(0).max(1439),
    end_minute: z.number().int().min(1).max(1440),
  })),
});

export const replaceAvailabilityRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RulesInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    await context.supabase.from("availability_rules")
      .delete().eq("professional_id", data.professional_id);
    if (data.rules.length === 0) return { ok: true };
    const { error } = await context.supabase.from("availability_rules").insert(
      data.rules.map((r) => ({ ...r, tenant_id: tenant.id, professional_id: data.professional_id })),
    );
    if (error) throw error;
    return { ok: true };
  });

// ---------- APPOINTMENTS ----------
const ListApptsInput = z.object({
  from: z.string(), // ISO
  to: z.string(),
});

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListApptsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("appointments")
      .select("*, professionals(full_name,color), services(name,color)")
      .gte("starts_at", data.from)
      .lte("starts_at", data.to)
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

const ApptInput = z.object({
  id: z.string().uuid().optional(),
  professional_id: z.string().uuid(),
  service_id: z.string().uuid().optional().nullable(),
  patient_name: z.string().min(2).max(120),
  patient_email: z.string().email().optional().nullable().or(z.literal("")),
  patient_phone: z.string().max(30).optional().nullable(),
  patient_notes: z.string().max(1000).optional().nullable(),
  internal_notes: z.string().max(1000).optional().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled", "no_show", "completed"]).default("confirmed"),
});

export const saveAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant } = await context.supabase
      .from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!tenant) throw new Error("Consultório não encontrado");
    const payload = {
      ...data,
      tenant_id: tenant.id,
      patient_email: data.patient_email || null,
      origin: "manual" as const,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("appointments").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("appointments").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "confirmed", "cancelled", "no_show", "completed"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("appointments").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- INTEGRATIONS (stubs) ----------
export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("integration_accounts").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
