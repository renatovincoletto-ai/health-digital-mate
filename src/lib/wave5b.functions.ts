import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ============ DRE ============
export const getDre = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ months: z.number().int().min(1).max(24).default(6) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const since = new Date();
    since.setMonth(since.getMonth() - data.months + 1);
    since.setDate(1); since.setHours(0, 0, 0, 0);
    const { data: rows, error } = await sb
      .from("financial_transactions")
      .select("amount, direction, category, paid_at, due_date, status")
      .gte("paid_at", since.toISOString());
    if (error) throw error;

    type Bucket = { month: string; income: number; expense: number; net: number; byCategory: Record<string, number> };
    const map = new Map<string, Bucket>();
    for (const r of rows ?? []) {
      const d = r.paid_at ?? r.due_date;
      if (!d) continue;
      const month = d.slice(0, 7);
      const b = map.get(month) ?? { month, income: 0, expense: 0, net: 0, byCategory: {} };
      const amt = Number(r.amount);
      const cat = r.category ?? "outros";
      if (r.direction === "in") { b.income += amt; b.byCategory[`+ ${cat}`] = (b.byCategory[`+ ${cat}`] ?? 0) + amt; }
      else { b.expense += amt; b.byCategory[`- ${cat}`] = (b.byCategory[`- ${cat}`] ?? 0) + amt; }
      b.net = b.income - b.expense;
      map.set(month, b);
    }
    const buckets = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    const totals = buckets.reduce(
      (acc, b) => ({ income: acc.income + b.income, expense: acc.expense + b.expense, net: acc.net + b.net }),
      { income: 0, expense: 0, net: 0 },
    );
    return { buckets, totals };
  });

// ============ PAYROLL ============
export const listPayroll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payroll_entries").select("*").order("reference_month", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

const PayrollInput = z.object({
  id: z.string().uuid().optional(),
  reference_month: z.string(),
  full_name: z.string().min(1).max(160),
  role_label: z.string().max(60).nullable().optional(),
  professional_id: z.string().uuid().nullable().optional(),
  base_salary: z.number().min(0),
  pro_labore: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  inss: z.number().min(0).default(0),
  fgts: z.number().min(0).default(0),
  irrf: z.number().min(0).default(0),
  other_deductions: z.number().min(0).default(0),
  status: z.enum(["draft", "approved", "paid"]).default("draft"),
  notes: z.string().max(500).nullable().optional(),
});
export const savePayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PayrollInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const net_amount = +(
      data.base_salary + data.pro_labore + data.bonus - data.inss - data.irrf - data.other_deductions
    ).toFixed(2);
    const payload: any = { ...data, tenant_id, net_amount };
    if (data.id) {
      const { error } = await context.supabase.from("payroll_entries").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("payroll_entries").insert(payload).select().single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const deletePayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payroll_entries").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ RBAC ============
export const listRolePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("role_permissions").select("*");
    if (error) throw error;
    return data ?? [];
  });

const RolePermInput = z.object({
  role: z.enum(["owner", "admin", "staff"]),
  module: z.string().min(1).max(40),
  can_view: z.boolean(),
  can_create: z.boolean(),
  can_edit: z.boolean(),
  can_delete: z.boolean(),
  max_discount_pct: z.number().min(0).max(100).nullable().optional(),
});
export const saveRolePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RolePermInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { error } = await context.supabase.from("role_permissions").upsert(
      { ...data, tenant_id } as any,
      { onConflict: "tenant_id,role,module" },
    );
    if (error) throw error;
    await context.supabase.rpc("log_audit", {
      _action: "role_permission.updated",
      _resource_type: "role_permissions",
      _resource_id: `${(data as any).role}:${(data as any).module}`,
      _metadata: data as never,
      _severity: "critical",
    });
    return { ok: true };
  });

// ============ TEAM ============
export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const { data: roles } = await context.supabase
      .from("user_roles").select("user_id, role").eq("tenant_id", tenant_id);
    const ids = (roles ?? []).map((r: any) => r.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await context.supabase
      .from("profiles").select("id, full_name, avatar_url").in("id", ids);
    return (roles ?? []).map((r: any) => ({
      user_id: r.user_id,
      role: r.role,
      profile: profiles?.find((p: any) => p.id === r.user_id) ?? null,
    }));
  });

// ============ DEBT NEGOTIATION ============
const NegoInput = z.object({
  patient_id: z.string().uuid().nullable().optional(),
  original_amount: z.number().positive(),
  interest_pct: z.number().min(0).max(50).default(0),
  fine_pct: z.number().min(0).max(50).default(0),
  discount_pct: z.number().min(0).max(80).default(0),
  installments: z.number().int().min(1).max(36).default(1),
  due_first: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export const createDebtNegotiation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NegoInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const withInterest = data.original_amount * (1 + data.interest_pct / 100) * (1 + data.fine_pct / 100);
    const final_amount = +(withInterest * (1 - data.discount_pct / 100)).toFixed(2);
    const installment_amount = +(final_amount / data.installments).toFixed(2);
    const { data: row, error } = await context.supabase.from("debt_negotiations").insert({
      tenant_id,
      patient_id: data.patient_id ?? null,
      original_amount: data.original_amount,
      interest_pct: data.interest_pct,
      fine_pct: data.fine_pct,
      discount_pct: data.discount_pct,
      installments: data.installments,
      installment_amount,
      final_amount,
      due_first: data.due_first ?? null,
      notes: data.notes ?? null,
      status: "agreed",
    }).select().single();
    if (error) throw error;
    await context.supabase.rpc("log_audit", {
      _action: "debt_negotiation.created",
      _resource_type: "debt_negotiations",
      _resource_id: (row as any)?.id ?? "",
      _metadata: { original: data.original_amount, final: final_amount, installments: data.installments } as never,
      _severity: "warn",
    });
    return row;
  });

export const listDebtNegotiations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("debt_negotiations").select("*, patients(full_name)")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  });

// ============ PORTAL (public lookup by CPF + birth) ============
const PortalLookupInput = z.object({
  cpf: z.string().min(11).max(14),
  birth_date: z.string(),
});
export const portalLookup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PortalLookupInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cpf = data.cpf.replace(/\D/g, "");
    const { data: patient } = await supabaseAdmin
      .from("patients").select("id, full_name, tenant_id, birth_date")
      .eq("cpf", cpf).maybeSingle();
    if (!patient || patient.birth_date !== data.birth_date) {
      return { ok: false as const, message: "Não encontramos os dados informados." };
    }
    const now = new Date().toISOString();
    const { data: fullPatient } = await supabaseAdmin
      .from("patients").select("phone, email").eq("id", patient.id).maybeSingle();
    const phone = fullPatient?.phone ?? "";
    const email = fullPatient?.email ?? "";
    const apptsQuery = supabaseAdmin.from("appointments")
      .select("id, starts_at, ends_at, status, patient_name")
      .eq("tenant_id", patient.tenant_id).gte("starts_at", now)
      .order("starts_at").limit(20);
    const [{ data: appts }, { data: rx }, { data: nf }] = await Promise.all([
      phone ? apptsQuery.eq("patient_phone", phone) :
      email ? apptsQuery.eq("patient_email", email) :
      apptsQuery.eq("patient_name", patient.full_name),
      supabaseAdmin.from("prescriptions")
        .select("id, content, pdf_url, status, created_at, valid_until")
        .eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("nfse_invoices")
        .select("id, number, amount, status, issued_at, pdf_url")
        .eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(20),
    ]);
    return {
      ok: true as const,
      patient: { id: patient.id, full_name: patient.full_name },
      appointments: appts ?? [],
      prescriptions: rx ?? [],
      invoices: nf ?? [],
    };
  });
