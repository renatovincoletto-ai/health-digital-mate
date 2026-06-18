import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ============ NFS-e / FISCAL ============
export const listNfse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("nfse_invoices").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

const NfseInput = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(2).max(500),
  amount: z.number().nonnegative(),
  iss_rate: z.number().min(0).max(100).default(0),
  service_code: z.string().max(20).optional(),
  taker_name: z.string().max(160).optional(),
  taker_document: z.string().max(30).optional(),
  taker_email: z.string().email().optional().or(z.literal("")),
});
export const issueNfse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NfseInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const iss_amount = +(data.amount * (data.iss_rate / 100)).toFixed(2);
    const number = `RPS-${Date.now().toString().slice(-8)}`;
    const payload = { ...data, tenant_id, iss_amount, rps_number: number, status: "issued", issued_at: new Date().toISOString(), taker_email: data.taker_email || null };
    const { data: row, error } = await context.supabase.from("nfse_invoices").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const listTaxObligations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("tax_obligations").select("*").order("due_date", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const TaxInput = z.object({
  kind: z.string().min(2).max(50),
  period: z.string().min(2).max(20),
  amount: z.number().nonnegative(),
  due_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export const saveTaxObligation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TaxInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("tax_obligations").insert({ ...data, tenant_id, due_date: data.due_date || null }).select().single();
    if (error) throw error;
    return row;
  });

export const markTaxPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tax_obligations").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ PAYOUTS / TEF ============
export const listPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("professional_payouts").select("*, professionals(full_name)").order("period_end", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const PayoutInput = z.object({
  professional_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  gross_amount: z.number().nonnegative(),
  fees_amount: z.number().nonnegative().default(0),
  payment_method: z.string().optional(),
});
export const createPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PayoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const net = +(data.gross_amount - data.fees_amount).toFixed(2);
    const { data: row, error } = await context.supabase.from("professional_payouts").insert({ ...data, tenant_id, net_amount: net }).select().single();
    if (error) throw error;
    return row;
  });

export const settlePayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("professional_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listTerminals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("pos_terminals").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const TerminalInput = z.object({
  acquirer: z.string().min(2),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  label: z.string().optional(),
});
export const saveTerminal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TerminalInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("pos_terminals").insert({ ...data, tenant_id }).select().single();
    if (error) throw error;
    return row;
  });

export const listTefTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("tef_transactions").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  });

// ============ INSURANCE / TISS ============
export const listInsurancePlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("insurance_plans").select("*").order("operator_name");
    if (error) throw error;
    return data ?? [];
  });

const PlanInput = z.object({
  operator_name: z.string().min(2),
  plan_name: z.string().min(2),
  ans_code: z.string().optional(),
  contract_number: z.string().optional(),
});
export const saveInsurancePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("insurance_plans").insert({ ...data, tenant_id }).select().single();
    if (error) throw error;
    return row;
  });

export const listTissGuides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("tiss_guides").select("*, insurance_plans(operator_name, plan_name), patients(full_name)").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

const GuideInput = z.object({
  insurance_plan_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  guide_type: z.enum(["consulta", "sadt", "internacao", "outras"]),
  guide_number: z.string().optional(),
  authorization_number: z.string().optional(),
  amount: z.number().nonnegative(),
  service_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export const saveTissGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GuideInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload = { ...data, tenant_id, service_date: data.service_date || null };
    const { data: row, error } = await context.supabase.from("tiss_guides").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const settleTissGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), paid_amount: z.number(), glosa_amount: z.number().default(0) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tiss_guides").update({ paid_amount: data.paid_amount, glosa_amount: data.glosa_amount, status: "settled" }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ JOURNEYS / FLOW ============
export const listJourneys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("patient_journeys").select("*, journey_steps(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const JourneyInput = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  trigger_event: z.enum(["appointment_completed", "no_show", "first_visit", "birthday", "treatment_finished", "manual"]),
  active: z.boolean().default(false),
});
export const saveJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JourneyInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("patient_journeys").insert({ ...data, tenant_id }).select().single();
    if (error) throw error;
    return row;
  });

const StepInput = z.object({
  journey_id: z.string().uuid(),
  step_order: z.number().int().nonnegative(),
  delay_hours: z.number().int().nonnegative(),
  channel: z.enum(["whatsapp", "sms", "email", "task"]),
  template: z.string().min(1),
  action: z.string().optional(),
});
export const addJourneyStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StepInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("journey_steps").insert({ ...data, tenant_id }).select().single();
    if (error) throw error;
    return row;
  });

export const toggleJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("patient_journeys").update({ active: data.active }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
