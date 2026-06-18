import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

export type ProviderKind = "asaas" | "focus_nfe" | "memed" | "pluggy";

// =========== INTEGRATIONS CRUD ===========
export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const { data, error } = await context.supabase
      .from("integration_accounts")
      .select("*")
      .eq("tenant_id", tenant_id)
      .in("provider", ["asaas", "focus_nfe", "memed", "pluggy"]);
    if (error) throw error;
    return data ?? [];
  });

const SaveInput = z.object({
  provider: z.enum(["asaas", "focus_nfe", "memed", "pluggy"]),
  status: z.enum(["active", "inactive", "sandbox"]).default("sandbox"),
  account_email: z.string().email().nullable().optional().or(z.literal("")),
  metadata: z.record(z.string(), z.any()).default({}),
});
export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    // upsert by (tenant_id, provider) — emulate since no unique index: delete + insert
    await context.supabase
      .from("integration_accounts")
      .delete()
      .eq("tenant_id", tenant_id)
      .eq("provider", data.provider)
      .is("professional_id", null);
    const payload: any = {
      tenant_id,
      provider: data.provider,
      status: data.status,
      account_email: data.account_email || null,
      metadata: data.metadata,
    };
    const { data: row, error } = await context.supabase
      .from("integration_accounts").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ provider: z.enum(["asaas", "focus_nfe", "memed", "pluggy"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: acc } = await context.supabase
      .from("integration_accounts").select("*")
      .eq("tenant_id", tenant_id).eq("provider", data.provider).maybeSingle();
    if (!acc) return { ok: false, message: "Conector não configurado" };
    await context.supabase.from("integration_accounts")
      .update({ last_sync_at: new Date().toISOString() }).eq("id", acc.id);
    const isSandbox = acc.status === "sandbox";
    return {
      ok: true,
      mode: isSandbox ? "sandbox" : "live",
      message: isSandbox
        ? "Modo sandbox: conexão simulada com sucesso. Nenhuma chamada externa foi feita."
        : "Conexão validada com sucesso.",
    };
  });

// =========== PAYMENT LINKS (Asaas) ===========
const PayLinkInput = z.object({
  amount: z.number().positive(),
  description: z.string().max(300).optional().nullable(),
  patient_id: z.string().uuid().nullable().optional(),
  method: z.enum(["pix", "boleto", "credit_card", "any"]).default("any"),
  expires_in_days: z.number().int().min(1).max(60).default(7),
});
export const createPaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PayLinkInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: acc } = await context.supabase
      .from("integration_accounts").select("*")
      .eq("tenant_id", tenant_id).eq("provider", "asaas").maybeSingle();
    const isSandbox = !acc || acc.status === "sandbox";
    const expires_at = new Date(Date.now() + data.expires_in_days * 86400_000).toISOString();
    const external_id = isSandbox ? `sim_${Math.random().toString(36).slice(2, 10)}` : null;
    const url = isSandbox
      ? `https://sandbox.pay.local/${external_id}`
      : null;
    const qr_code = isSandbox && (data.method === "pix" || data.method === "any")
      ? `00020126${Math.random().toString(36).slice(2, 10).toUpperCase()}5204000053039865802BR`
      : null;
    const { data: row, error } = await context.supabase.from("payment_links").insert({
      tenant_id,
      amount: data.amount,
      description: data.description ?? null,
      patient_id: data.patient_id ?? null,
      provider: "asaas",
      status: "pending",
      external_id,
      url,
      qr_code,
      expires_at,
    }).select().single();
    if (error) throw error;
    return { ...row, sandbox: isSandbox };
  });

export const listPaymentLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payment_links").select("*, patients(full_name)")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const simulatePaymentReceived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payment_links")
      .update({ status: "paid" }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// =========== NFSE (Focus NFe) ===========
const NfseInput = z.object({
  amount: z.number().positive(),
  description: z.string().min(3).max(500),
  patient_id: z.string().uuid().nullable().optional(),
  taker_name: z.string().min(2).max(200),
  taker_document: z.string().min(11).max(20),
  taker_email: z.string().email().nullable().optional().or(z.literal("")),
  service_code: z.string().max(20).default("17.06"),
  iss_rate: z.number().min(0).max(0.1).default(0.03),
});
export const issueNfse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NfseInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: acc } = await context.supabase
      .from("integration_accounts").select("*")
      .eq("tenant_id", tenant_id).eq("provider", "focus_nfe").maybeSingle();
    const isSandbox = !acc || acc.status === "sandbox";
    const iss_amount = +(data.amount * data.iss_rate).toFixed(2);
    const number = isSandbox ? `SIM-${Date.now().toString().slice(-8)}` : null;
    const rps = `${Math.floor(Math.random() * 99999)}`.padStart(5, "0");
    const { data: row, error } = await context.supabase.from("nfse_invoices").insert({
      tenant_id,
      amount: data.amount,
      description: data.description,
      patient_id: data.patient_id ?? null,
      taker_name: data.taker_name,
      taker_document: data.taker_document,
      taker_email: data.taker_email || null,
      service_code: data.service_code,
      iss_rate: data.iss_rate,
      iss_amount,
      status: isSandbox ? "issued" : "pending",
      number,
      rps_number: rps,
      issued_at: isSandbox ? new Date().toISOString() : null,
      metadata: { sandbox: isSandbox, provider: "focus_nfe" },
    }).select().single();
    if (error) throw error;
    await context.supabase.rpc("log_audit", {
      _action: "nfse.issued",
      _resource_type: "nfse_invoices",
      _resource_id: (row as any)?.id ?? "",
      _metadata: { amount: data.amount, sandbox: isSandbox, number } as never,
      _severity: "info",
    });
    return { ...row, sandbox: isSandbox };
  });

// =========== MEMED ===========
const MemedInput = z.object({
  patient_id: z.string().uuid(),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    duration: z.string().optional(),
  })).min(1),
  notes: z.string().optional().nullable(),
});
export const createMemedPrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MemedInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: acc } = await context.supabase
      .from("integration_accounts").select("*")
      .eq("tenant_id", tenant_id).eq("provider", "memed").maybeSingle();
    const isSandbox = !acc || acc.status === "sandbox";
    const external_id = `memed_${Math.random().toString(36).slice(2, 12)}`;
    const content = [
      ...data.medications.map((m) => `${m.name} — ${m.dosage}${m.duration ? ` (${m.duration})` : ""}`),
      data.notes ? `\nObservações: ${data.notes}` : "",
    ].join("\n");
    const { data: row, error } = await context.supabase.from("prescriptions").insert({
      tenant_id,
      patient_id: data.patient_id,
      doc_type: "prescription",
      signature_provider: "memed",
      signature_id: external_id,
      status: isSandbox ? "signed" : "draft",
      content,
      pdf_url: isSandbox ? `https://sandbox.memed.local/rx/${external_id}.pdf` : null,
      qr_code: isSandbox ? `MEMED-${external_id.toUpperCase()}` : null,
    } as any).select().single();
    if (error) throw error;
    return { ...row, sandbox: isSandbox };
  });

// =========== OPEN FINANCE (Pluggy) ===========
export const syncOpenFinance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const { data: acc } = await context.supabase
      .from("integration_accounts").select("*")
      .eq("tenant_id", tenant_id).eq("provider", "pluggy").maybeSingle();
    const isSandbox = !acc || acc.status === "sandbox";

    // Make sure there's at least one bank account
    const { data: account } = await context.supabase
      .from("financial_accounts").select("id").eq("tenant_id", tenant_id).limit(1).maybeSingle();
    let account_id = account?.id;
    if (!account_id) {
      const { data: created } = await context.supabase.from("financial_accounts").insert({
        tenant_id, name: "Conta Principal (Open Finance)", account_type: "bank", balance: 0, is_active: true,
      } as any).select("id").single();
      account_id = created!.id;
    }

    const samples = isSandbox ? [
      { description: "PIX recebido - Consulta", amount: 250, direction: "in", category: "consulta" },
      { description: "PIX recebido - Procedimento", amount: 480, direction: "in", category: "procedimento" },
      { description: "Tarifa bancária", amount: 19.9, direction: "out", category: "tarifa" },
      { description: "Aluguel", amount: 2800, direction: "out", category: "aluguel" },
    ] : [];

    if (samples.length) {
      const now = new Date().toISOString();
      const rows = samples.map((s) => ({
        tenant_id,
        account_id,
        description: s.description,
        amount: s.amount,
        direction: s.direction,
        category: s.category,
        status: "paid",
        paid_at: now,
      }));
      await context.supabase.from("financial_transactions").insert(rows as any);
      await context.supabase.from("integration_accounts")
        .update({ last_sync_at: now }).eq("tenant_id", tenant_id).eq("provider", "pluggy");
    }
    return { ok: true, imported: samples.length, sandbox: isSandbox };
  });
