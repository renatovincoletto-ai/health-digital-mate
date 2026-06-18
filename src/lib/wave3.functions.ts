import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ============ SETTINGS ============
export const getAutomationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const { data } = await context.supabase.from("automation_settings").select("*").eq("tenant_id", tenant_id).maybeSingle();
    return data ?? {
      tenant_id, email_enabled: true, whatsapp_enabled: false, sms_enabled: false,
      email_from_name: null, email_from_address: null, twilio_from_number: null, twilio_whatsapp_from: null, dry_run: true,
    };
  });

const SettingsInput = z.object({
  email_enabled: z.boolean(),
  whatsapp_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  email_from_name: z.string().max(120).nullable().optional(),
  email_from_address: z.string().email().nullable().optional().or(z.literal("")),
  twilio_from_number: z.string().max(30).nullable().optional(),
  twilio_whatsapp_from: z.string().max(40).nullable().optional(),
  dry_run: z.boolean(),
});
export const saveAutomationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingsInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload: any = { ...data, tenant_id, email_from_address: data.email_from_address || null };
    const { error } = await context.supabase.from("automation_settings").upsert(payload, { onConflict: "tenant_id" });
    if (error) throw error;
    return { ok: true };
  });

// ============ JOBS ============
export const listAutomationJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automation_jobs").select("*")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const getAutomationStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [pending, sent, failed, total] = await Promise.all([
      sb.from("automation_jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("automation_jobs").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", monthStart.toISOString()),
      sb.from("automation_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      sb.from("automation_jobs").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
    ]);
    return {
      pending: pending.count ?? 0,
      sentMonth: sent.count ?? 0,
      failed: failed.count ?? 0,
      totalMonth: total.count ?? 0,
    };
  });

const JobInput = z.object({
  kind: z.enum(["reminder", "journey", "email", "manual"]).default("manual"),
  channel: z.enum(["email", "whatsapp", "sms"]),
  recipient: z.string().min(3).max(200),
  recipient_name: z.string().max(160).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1).max(4000),
  scheduled_for: z.string().optional(),
  patient_id: z.string().uuid().nullable().optional(),
  appointment_id: z.string().uuid().nullable().optional(),
});
export const enqueueAutomationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JobInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload: any = {
      ...data,
      tenant_id,
      scheduled_for: data.scheduled_for ?? new Date().toISOString(),
    };
    const { data: row, error } = await context.supabase.from("automation_jobs").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const retryAutomationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automation_jobs")
      .update({ status: "pending", last_error: null, scheduled_for: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const cancelAutomationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automation_jobs")
      .update({ status: "skipped" }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Trigger processor manually (calls the public route)
export const triggerProcessor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const url = `${process.env.SUPABASE_URL?.replace(".supabase.co", "")}`;
    // Same-origin: just call our own public route relative
    const base = process.env.PUBLIC_BASE_URL || "";
    const target = base ? `${base}/api/public/hooks/run-automations` : "/api/public/hooks/run-automations";
    try {
      const r = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const txt = await r.text();
      return { ok: r.ok, status: r.status, body: txt.slice(0, 500) };
    } catch (e: any) {
      return { ok: false, status: 0, body: e.message };
    }
  });
