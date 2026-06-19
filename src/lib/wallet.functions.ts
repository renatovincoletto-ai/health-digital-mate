import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function tenantOf(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

async function publicSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listPatientWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patient_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const { data: tx, error } = await context.supabase
      .from("patient_wallet_transactions")
      .select("*")
      .eq("tenant_id", tid)
      .eq("patient_id", data.patient_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const balance = (tx ?? []).reduce((s: number, t: any) => {
      const v = Number(t.amount);
      if (t.kind === "credit" || t.kind === "refund") return s + v;
      if (t.kind === "debit") return s - v;
      return s + v; // adjustment (can be negative)
    }, 0);
    return { transactions: tx ?? [], balance };
  });

export const addWalletTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patient_id: z.string().uuid(),
      kind: z.enum(["credit", "debit", "refund", "adjustment"]),
      amount: z.number(),
      description: z.string().max(500).optional(),
      reference_type: z.string().max(50).optional(),
      reference_id: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const { data: row, error } = await context.supabase
      .from("patient_wallet_transactions")
      .insert({ ...data, tenant_id: tid, created_by: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const deleteWalletTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("patient_wallet_transactions").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listWalletBalances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantOf(context);
    const { data, error } = await context.supabase
      .from("patient_wallet_balances")
      .select("*")
      .eq("tenant_id", tid)
      .order("balance", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// Public for portal (token-validated)
export const portalWallet = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await publicSupabase();
    const { data: sess } = await sb.from("patient_portal_sessions").select("*").eq("token", data.token).maybeSingle();
    if (!sess || new Date(sess.expires_at) < new Date()) throw new Error("Sessão expirada");
    const { data: tx } = await sb
      .from("patient_wallet_transactions")
      .select("id, kind, amount, description, created_at")
      .eq("tenant_id", sess.tenant_id)
      .eq("patient_id", sess.patient_id)
      .order("created_at", { ascending: false })
      .limit(50);
    const list = tx ?? [];
    const balance = list.reduce((s: number, t: any) => {
      const v = Number(t.amount);
      if (t.kind === "credit" || t.kind === "refund") return s + v;
      if (t.kind === "debit") return s - v;
      return s + v;
    }, 0);
    return { transactions: list, balance };
  });
