import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ============ PATIENTS / CRM ============
export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return data ?? [];
  });

const PatientInput = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2).max(160),
  cpf: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().max(30).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string()).default([]),
});
export const savePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PatientInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload: any = { ...data, tenant_id, email: data.email || null, birth_date: data.birth_date || null };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("patients").update(payload).eq("id", data.id).select().single();
      if (error) throw error; return row;
    }
    const { data: row, error } = await context.supabase.from("patients").insert(payload).select().single();
    if (error) throw error; return row;
  });

export const deletePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("patients").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ TELEMEDICINE ============
export const listTeleSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("telemedicine_sessions").select("*, patients(full_name)").order("created_at", { ascending: false }).limit(100);
    if (error) throw error; return data ?? [];
  });

export const createTeleSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patient_id: z.string().uuid().optional(), appointment_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const roomId = crypto.randomUUID().slice(0, 12);
    const room_url = `https://meet.jit.si/saudeos-${roomId}`;
    const { data: row, error } = await context.supabase.from("telemedicine_sessions").insert({
      tenant_id, patient_id: data.patient_id ?? null, appointment_id: data.appointment_id ?? null,
      room_url, status: "scheduled",
    }).select().single();
    if (error) throw error; return row;
  });

// ============ PRESCRIPTIONS ============
export const listPrescriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("prescriptions").select("*, patients(full_name)").order("created_at", { ascending: false }).limit(200);
    if (error) throw error; return data ?? [];
  });

const RxInput = z.object({
  patient_id: z.string().uuid(),
  doc_type: z.enum(["receita", "atestado", "exame"]).default("receita"),
  content: z.string().min(5).max(8000),
  valid_until: z.string().nullable().optional(),
});
export const createPrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RxInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const qr_code = `https://saudeos.app/v/${crypto.randomUUID()}`;
    const { data: row, error } = await context.supabase.from("prescriptions").insert({
      tenant_id, patient_id: data.patient_id, doc_type: data.doc_type, content: data.content,
      valid_until: data.valid_until || null, qr_code, status: "signed",
      signature_provider: "saudeos-icp",
    }).select().single();
    if (error) throw error; return row;
  });

// ============ TREATMENT PLANS ============
export const listTreatmentPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("treatment_plans").select("*, patients(full_name), treatment_plan_items(*)").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  });

const PlanInput = z.object({
  patient_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  items: z.array(z.object({
    procedure_name: z.string(),
    tooth: z.string().optional(),
    unit_value: z.number().default(0),
    quantity: z.number().int().default(1),
  })).default([]),
});
export const createTreatmentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const total = data.items.reduce((s, i) => s + i.unit_value * i.quantity, 0);
    const { data: plan, error } = await context.supabase.from("treatment_plans").insert({
      tenant_id, patient_id: data.patient_id, title: data.title, description: data.description ?? null, total_value: total,
    }).select().single();
    if (error) throw error;
    if (data.items.length) {
      await context.supabase.from("treatment_plan_items").insert(
        data.items.map((it, idx) => ({ ...it, plan_id: plan.id, tenant_id, sequence: idx }))
      );
    }
    return plan;
  });

// ============ ODONTOGRAM ============
export const listOdontogram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patient_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("odontogram_entries").select("*").eq("patient_id", data.patient_id);
    if (error) throw error; return rows ?? [];
  });

export const saveOdontogramEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid(),
    tooth: z.string(),
    face: z.string().optional(),
    condition: z.string(),
    procedure: z.string().optional(),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("odontogram_entries").insert({
      ...data, tenant_id, recorded_by: context.userId,
    }).select().single();
    if (error) throw error; return row;
  });

// ============ FINANCEIRO ============
export const listFinancialAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("financial_accounts").select("*").order("created_at");
    if (error) throw error; return data ?? [];
  });

export const saveFinancialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    account_type: z.string().default("bank"),
    bank_name: z.string().optional(),
    balance: z.number().default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload = { ...data, tenant_id };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("financial_accounts").update(payload).eq("id", data.id).select().single();
      if (error) throw error; return row;
    }
    const { data: row, error } = await context.supabase.from("financial_accounts").insert(payload).select().single();
    if (error) throw error; return row;
  });

export const listFinancialTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("financial_transactions").select("*, patients(full_name), professionals(full_name), financial_accounts(name)").order("due_date", { ascending: false }).limit(500);
    if (error) throw error; return data ?? [];
  });

const TxInput = z.object({
  id: z.string().uuid().optional(),
  account_id: z.string().uuid().nullable().optional(),
  patient_id: z.string().uuid().nullable().optional(),
  professional_id: z.string().uuid().nullable().optional(),
  direction: z.enum(["in", "out"]),
  category: z.string().nullable().optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  due_date: z.string().nullable().optional(),
  status: z.enum(["pending", "paid", "overdue", "canceled"]).default("pending"),
  payment_method: z.string().nullable().optional(),
});
export const saveTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TxInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload: any = { ...data, tenant_id, due_date: data.due_date || null };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("financial_transactions").update(payload).eq("id", data.id).select().single();
      if (error) throw error; return row;
    }
    const { data: row, error } = await context.supabase.from("financial_transactions").insert(payload).select().single();
    if (error) throw error; return row;
  });

export const markTransactionPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("financial_transactions")
      .update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", data.id).select().single();
    if (error) throw error; return row;
  });

// ============ PAYMENT LINKS ============
export const listPaymentLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("payment_links").select("*, patients(full_name)").order("created_at", { ascending: false }).limit(100);
    if (error) throw error; return data ?? [];
  });

export const createPaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid().nullable().optional(),
    amount: z.number().positive(),
    description: z.string().optional(),
    provider: z.enum(["pix", "card", "boleto"]).default("pix"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const external_id = crypto.randomUUID();
    const url = `https://pay.saudeos.app/${external_id}`;
    const qr_code = data.provider === "pix" ? `00020126360014BR.GOV.BCB.PIX${external_id}` : null;
    const { data: row, error } = await context.supabase.from("payment_links").insert({
      tenant_id, patient_id: data.patient_id ?? null, amount: data.amount,
      description: data.description ?? null, provider: data.provider, external_id, url, qr_code,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }).select().single();
    if (error) throw error; return row;
  });

// ============ SPLITS ============
export const listSplits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("professional_splits").select("*, professionals(full_name), services(name)");
    if (error) throw error; return data ?? [];
  });

export const saveSplit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    professional_id: z.string().uuid(),
    service_id: z.string().uuid().nullable().optional(),
    rule_type: z.enum(["percentage", "fixed"]).default("percentage"),
    rule_value: z.number(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload = { ...data, tenant_id };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("professional_splits").update(payload).eq("id", data.id).select().single();
      if (error) throw error; return row;
    }
    const { data: row, error } = await context.supabase.from("professional_splits").insert(payload).select().single();
    if (error) throw error; return row;
  });

// ============ QUOTES ============
export const listQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("quotes").select("*, patients(full_name)").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  });

export const createQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid().nullable().optional(),
    title: z.string().min(1),
    valid_until: z.string().nullable().optional(),
    items: z.array(z.object({ name: z.string(), qty: z.number().default(1), unit: z.number().default(0) })).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const total = data.items.reduce((s, i) => s + i.qty * i.unit, 0);
    const { data: row, error } = await context.supabase.from("quotes").insert({
      tenant_id, patient_id: data.patient_id ?? null, title: data.title,
      items: data.items, total_value: total, valid_until: data.valid_until || null,
    }).select().single();
    if (error) throw error; return row;
  });

// ============ INVENTORY ============
export const listInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("inventory_items").select("*").order("name");
    if (error) throw error; return data ?? [];
  });

export const saveInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    sku: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().default("un"),
    quantity: z.number().default(0),
    min_quantity: z.number().default(0),
    unit_cost: z.number().default(0),
    expires_at: z.string().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload: any = { ...data, tenant_id, expires_at: data.expires_at || null };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("inventory_items").update(payload).eq("id", data.id).select().single();
      if (error) throw error; return row;
    }
    const { data: row, error } = await context.supabase.from("inventory_items").insert(payload).select().single();
    if (error) throw error; return row;
  });

export const moveInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    item_id: z.string().uuid(),
    movement_type: z.enum(["in", "out", "adjust"]),
    quantity: z.number(),
    reason: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: item } = await context.supabase.from("inventory_items").select("quantity").eq("id", data.item_id).single();
    const delta = data.movement_type === "in" ? data.quantity : data.movement_type === "out" ? -data.quantity : 0;
    const newQty = data.movement_type === "adjust" ? data.quantity : Number(item?.quantity ?? 0) + delta;
    await context.supabase.from("inventory_items").update({ quantity: newQty }).eq("id", data.item_id);
    await context.supabase.from("inventory_movements").insert({ ...data, tenant_id, user_id: context.userId });
    return { ok: true, quantity: newQty };
  });

// ============ INTERNAL CHAT ============
export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ channel: z.string().default("general") }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("internal_messages").select("*").eq("channel", data.channel).order("created_at", { ascending: true }).limit(200);
    if (error) throw error; return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ channel: z.string().default("general"), content: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("internal_messages").insert({
      tenant_id, sender_id: context.userId, channel: data.channel, content: data.content,
    }).select().single();
    if (error) throw error; return row;
  });

// ============ CALL CENTER ============
export const listCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("call_logs").select("*, patients(full_name)").order("started_at", { ascending: false }).limit(200);
    if (error) throw error; return data ?? [];
  });

export const logCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid().nullable().optional(),
    direction: z.enum(["in", "out"]),
    from_number: z.string().optional(),
    to_number: z.string().optional(),
    duration_seconds: z.number().int().default(0),
    outcome: z.string().optional(),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("call_logs").insert({
      ...data, tenant_id, agent_id: context.userId,
    }).select().single();
    if (error) throw error; return row;
  });

// ============ REMINDERS ============
export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("reminders").select("*, patients(full_name)").order("scheduled_for", { ascending: false }).limit(200);
    if (error) throw error; return data ?? [];
  });

export const scheduleReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid().nullable().optional(),
    appointment_id: z.string().uuid().nullable().optional(),
    channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
    scheduled_for: z.string(),
    message: z.string().min(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("reminders").insert({ ...data, tenant_id }).select().single();
    if (error) throw error; return row;
  });

export const confirmReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), confirmation: z.enum(["yes", "no", "reschedule"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("reminders").update({ confirmation: data.confirmation, status: "completed" }).eq("id", data.id).select().single();
    if (error) throw error; return row;
  });

// ============ REFERRALS ============
export const listReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("referrals").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  });

export const createReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    referrer_patient_id: z.string().uuid().nullable().optional(),
    referrer_email: z.string().email().optional(),
    referred_email: z.string().email().optional(),
    reward_type: z.enum(["discount", "credit", "cashback"]).default("discount"),
    reward_value: z.number().default(50),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const code = `IND-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: row, error } = await context.supabase.from("referrals").insert({ ...data, tenant_id, code }).select().single();
    if (error) throw error; return row;
  });

// ============ NPS ============
export const listNps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("nps_surveys").select("*, patients(full_name)").order("created_at", { ascending: false }).limit(200);
    if (error) throw error; return data ?? [];
  });

export const submitNps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid().nullable().optional(),
    score: z.number().int().min(0).max(10),
    comment: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const category = data.score >= 9 ? "promoter" : data.score >= 7 ? "passive" : "detractor";
    const { data: row, error } = await context.supabase.from("nps_surveys").insert({
      ...data, tenant_id, category, responded_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error; return row;
  });

// ============ BI ============
export const getBiOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [{ count: patientsCount }, { count: apptCount }, { data: txs }, { data: nps }] = await Promise.all([
      context.supabase.from("patients").select("*", { count: "exact", head: true }).eq("tenant_id", tenant_id),
      context.supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenant_id).gte("created_at", since),
      context.supabase.from("financial_transactions").select("direction, amount, status").eq("tenant_id", tenant_id).gte("created_at", since),
      context.supabase.from("nps_surveys").select("score, category").eq("tenant_id", tenant_id).gte("created_at", since),
    ]);
    const revenue = (txs ?? []).filter((t: any) => t.direction === "in" && t.status === "paid").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expense = (txs ?? []).filter((t: any) => t.direction === "out" && t.status === "paid").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const npsArr = nps ?? [];
    const promoters = npsArr.filter((n: any) => n.category === "promoter").length;
    const detractors = npsArr.filter((n: any) => n.category === "detractor").length;
    const npsScore = npsArr.length ? Math.round(((promoters - detractors) / npsArr.length) * 100) : 0;
    return {
      patients: patientsCount ?? 0,
      appointments30d: apptCount ?? 0,
      revenue30d: revenue,
      expense30d: expense,
      profit30d: revenue - expense,
      nps: npsScore,
      npsResponses: npsArr.length,
    };
  });
