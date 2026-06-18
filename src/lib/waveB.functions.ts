import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function tenantOf(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ===== Templates =====
export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ kind: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    let q = context.supabase.from("document_templates").select("*").eq("tenant_id", tid).order("kind").order("title");
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      kind: z.enum(["atestado", "receituario", "prontuario", "exame", "laudo", "termo"]),
      title: z.string().min(2).max(120),
      body: z.string().min(1).max(20000),
      variables: z.array(z.string()).default([]),
      is_default: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const payload = { tenant_id: tid, kind: data.kind, title: data.title, body: data.body, variables: data.variables, is_default: data.is_default, created_by: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("document_templates").update(payload).eq("id", data.id).eq("tenant_id", tid);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("document_templates").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const { error } = await context.supabase.from("document_templates").delete().eq("id", data.id).eq("tenant_id", tid);
    if (error) throw error;
    return { ok: true };
  });

// ===== Portal accounts (gestão pela clínica) =====
async function sha256(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashPassword(pw: string, salt: string) {
  return `${salt}:${await sha256(`${salt}:${pw}`)}`;
}
async function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return (await sha256(`${salt}:${pw}`)) === hash;
}
function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const upsertPortalAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patient_id: z.string().uuid(),
      cpf: z.string().min(11),
      email: z.string().email().optional(),
      password: z.string().min(6).max(72),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const cpf = data.cpf.replace(/\D/g, "");
    const salt = randomToken(8);
    const hash = await hashPassword(data.password, salt);
    const { error } = await context.supabase
      .from("patient_portal_accounts")
      .upsert(
        { tenant_id: tid, patient_id: data.patient_id, cpf, email: data.email ?? null, password_hash: hash, failed_attempts: 0, locked_until: null },
        { onConflict: "tenant_id,cpf" },
      );
    if (error) throw error;
    return { ok: true };
  });

// ===== Portal público (sem auth) =====
async function publicSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const portalLoginByClinic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ slug: z.string().min(1), cpf: z.string().min(11), password: z.string().min(6) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await publicSupabase();
    const { data: tenant } = await sb.from("tenants").select("id, display_name").eq("slug", data.slug).maybeSingle();
    if (!tenant) throw new Error("Clínica não encontrada");
    const cpf = data.cpf.replace(/\D/g, "");
    const { data: acc } = await sb.from("patient_portal_accounts").select("*").eq("tenant_id", tenant.id).eq("cpf", cpf).maybeSingle();
    if (!acc) throw new Error("CPF ou senha incorretos");
    if (acc.locked_until && new Date(acc.locked_until) > new Date()) throw new Error("Conta bloqueada temporariamente. Tente em alguns minutos.");
    const ok = await verifyPassword(data.password, acc.password_hash);
    if (!ok) {
      const attempts = (acc.failed_attempts ?? 0) + 1;
      const lock = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await sb.from("patient_portal_accounts").update({ failed_attempts: attempts, locked_until: lock }).eq("id", acc.id);
      throw new Error("CPF ou senha incorretos");
    }
    const token = randomToken(32);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await sb.from("patient_portal_sessions").insert({ token, account_id: acc.id, tenant_id: tenant.id, patient_id: acc.patient_id, expires_at });
    await sb.from("patient_portal_accounts").update({ last_login_at: new Date().toISOString(), failed_attempts: 0, locked_until: null }).eq("id", acc.id);
    return { token, tenant: { id: tenant.id, name: tenant.display_name } };
  });

export const portalRequestReset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ slug: z.string().min(1), cpf: z.string().min(11) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await publicSupabase();
    const { data: tenant } = await sb.from("tenants").select("id").eq("slug", data.slug).maybeSingle();
    if (!tenant) return { ok: true }; // não revelar
    const cpf = data.cpf.replace(/\D/g, "");
    const { data: acc } = await sb.from("patient_portal_accounts").select("id, email").eq("tenant_id", tenant.id).eq("cpf", cpf).maybeSingle();
    if (!acc?.email) return { ok: true };
    const token = randomToken(24);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await sb.from("patient_portal_accounts").update({ reset_token: token, reset_expires_at: expires }).eq("id", acc.id);
    // E-mail de envio fica plugável (Onda futura). Por ora, expor o token apenas em log do servidor.
    console.log(`[portal-reset] enviar para ${acc.email} link com token: ${token}`);
    return { ok: true };
  });

export const portalResetPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(8), password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await publicSupabase();
    const { data: acc } = await sb.from("patient_portal_accounts").select("id, reset_expires_at").eq("reset_token", data.token).maybeSingle();
    if (!acc || !acc.reset_expires_at || new Date(acc.reset_expires_at) < new Date()) throw new Error("Token inválido ou expirado");
    const salt = randomToken(8);
    const hash = await hashPassword(data.password, salt);
    await sb.from("patient_portal_accounts").update({ password_hash: hash, reset_token: null, reset_expires_at: null, failed_attempts: 0, locked_until: null }).eq("id", acc.id);
    return { ok: true };
  });

export const portalMe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await publicSupabase();
    const { data: sess } = await sb.from("patient_portal_sessions").select("*").eq("token", data.token).maybeSingle();
    if (!sess || new Date(sess.expires_at) < new Date()) throw new Error("Sessão expirada");
    const { data: patient } = await sb.from("patients").select("id, full_name, email, phone").eq("id", sess.patient_id).maybeSingle();
    const { data: appts } = await sb
      .from("appointments")
      .select("id, scheduled_at, status, service_name, professional_name")
      .eq("patient_id", sess.patient_id)
      .gte("scheduled_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString())
      .order("scheduled_at", { ascending: false })
      .limit(50);
    const { data: rxs } = await sb
      .from("prescriptions")
      .select("id, issued_at, content")
      .eq("patient_id", sess.patient_id)
      .order("issued_at", { ascending: false })
      .limit(20);
    return { patient, appointments: appts ?? [], prescriptions: rxs ?? [] };
  });
