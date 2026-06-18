import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Whitelist of tenant-scoped tables that can be exported/imported
export const EXPORTABLE_TABLES = [
  "patients", "appointments", "professionals", "services", "locations",
  "insurance_plans", "prescriptions", "consultation_notes", "anamnese_responses",
  "anamnese_templates", "treatment_plans", "treatment_plan_items", "odontogram_entries",
  "patient_allergies", "patient_attachments", "patient_journeys", "journey_steps",
  "journey_enrollments", "waitlist", "availability_rules", "availability_blocks",
  "financial_accounts", "financial_transactions", "professional_payouts",
  "professional_splits", "payment_links", "tef_transactions", "quotes",
  "tiss_guides", "nfse_invoices", "tax_obligations", "payroll_entries",
  "inventory_items", "inventory_movements", "reminders", "review_requests",
  "reviews", "nps_surveys", "referrals", "internal_messages", "call_logs",
  "email_contacts", "email_campaigns", "social_posts", "content_ideas",
  "ad_campaigns", "whatsapp_conversations", "whatsapp_messages",
  "document_templates", "support_tickets",
] as const;

export type ExportableTable = (typeof EXPORTABLE_TABLES)[number];

async function tenantOf(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (data) return data.id as string;
  const { data: ur } = await ctx.supabase.from("user_roles").select("tenant_id").eq("user_id", ctx.userId).limit(1).maybeSingle();
  if (!ur) throw new Error("Sem clínica vinculada");
  return ur.tenant_id as string;
}

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const cols = Array.from(rows.reduce((s: Set<string>, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export const listExportableTables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantOf(context);
    const out: Array<{ table: string; count: number }> = [];
    for (const t of EXPORTABLE_TABLES) {
      const { count } = await context.supabase.from(t).select("id", { count: "exact", head: true }).eq("tenant_id", tid);
      out.push({ table: t, count: count ?? 0 });
    }
    return out;
  });

export const exportTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      table: z.enum(EXPORTABLE_TABLES as unknown as [string, ...string[]]),
      format: z.enum(["csv", "json"]).default("csv"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const sb = context.supabase as any;
    const { data: rows, error } = await sb.from(data.table).select("*").eq("tenant_id", tid).limit(50000);
    if (error) throw error;
    const payload = data.format === "json" ? JSON.stringify(rows ?? [], null, 2) : toCsv(rows ?? []);
    return { filename: `${data.table}.${data.format}`, content: payload, count: rows?.length ?? 0 };
  });

export const exportAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantOf(context);
    const sb = context.supabase as any;
    const bundle: Record<string, any[]> = {};
    for (const t of EXPORTABLE_TABLES) {
      const { data } = await sb.from(t).select("*").eq("tenant_id", tid).limit(50000);
      bundle[t] = data ?? [];
    }
    return {
      filename: `export-lgpd-${new Date().toISOString().slice(0, 10)}.json`,
      content: JSON.stringify({ exported_at: new Date().toISOString(), tenant_id: tid, data: bundle }, null, 2),
    };
  });

// Parse CSV (simple, supports quoted fields)
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === "," || c === ";") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); lines.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); lines.push(cur); }
  const headers = (lines.shift() ?? []).map((h) => h.trim());
  const rows = lines.filter((l) => l.some((v) => v && v.length)).map((l) => {
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = (l[i] ?? "").trim(); });
    return r;
  });
  return { headers, rows };
}

// Field schemas for normalization mapping per table (only the most useful)
const TABLE_FIELDS: Record<string, string[]> = {
  patients: ["full_name", "email", "phone", "cpf", "birth_date", "gender", "address", "city", "state", "zip_code", "notes"],
  professionals: ["full_name", "email", "phone", "specialty", "license_number", "license_state"],
  services: ["name", "description", "price", "duration_minutes", "category"],
  insurance_plans: ["name", "operator", "code", "notes"],
  inventory_items: ["name", "sku", "category", "unit", "quantity", "min_quantity", "cost_price", "sale_price"],
  email_contacts: ["email", "full_name", "phone", "tags"],
};

export const aiNormalizeCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      table: z.string(),
      csv: z.string().min(5).max(2_000_000),
      maxRows: z.number().int().min(1).max(2000).default(500),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const fields = TABLE_FIELDS[data.table];
    if (!fields) throw new Error("Tabela não suporta normalização por IA");
    const parsed = parseCsv(data.csv);
    const sample = parsed.rows.slice(0, 5);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const sys = `Você normaliza dados de planilhas para o schema de uma clínica. Responda APENAS JSON válido no formato {"mapping": {"colunaCsv": "campo_destino|null"}, "notes": "..."}. Campos válidos: ${fields.join(", ")}. Use null para colunas que não tenham correspondência.`;
    const user = `Tabela alvo: ${data.table}\nColunas CSV: ${JSON.stringify(parsed.headers)}\nAmostra de linhas:\n${JSON.stringify(sample, null, 2)}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) throw new Error(`IA falhou: ${r.status}`);
    const j = await r.json();
    let mapping: Record<string, string | null> = {};
    let notes = "";
    try {
      const parsedAi = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
      mapping = parsedAi.mapping ?? {};
      notes = parsedAi.notes ?? "";
    } catch {
      // fallback identity mapping
      parsed.headers.forEach((h) => { mapping[h] = fields.includes(h) ? h : null; });
    }
    // Build normalized preview
    const normalized = parsed.rows.slice(0, data.maxRows).map((row) => {
      const out: Record<string, any> = {};
      for (const [src, dest] of Object.entries(mapping)) {
        if (dest && fields.includes(dest)) out[dest] = row[src] ?? null;
      }
      return out;
    });
    return { headers: parsed.headers, mapping, notes, preview: normalized.slice(0, 10), total: parsed.rows.length, normalized };
  });

export const importRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      table: z.string(),
      rows: z.array(z.record(z.any())).min(1).max(5000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const fields = TABLE_FIELDS[data.table];
    if (!fields) throw new Error("Tabela não permitida");
    const tid = await tenantOf(context);
    const cleaned = data.rows.map((r) => {
      const out: Record<string, any> = { tenant_id: tid };
      for (const f of fields) if (r[f] !== undefined && r[f] !== "") out[f] = r[f];
      return out;
    });
    const sb = context.supabase as any;
    const { data: inserted, error } = await sb.from(data.table).insert(cleaned).select("id");
    if (error) throw error;
    return { inserted: inserted?.length ?? 0 };
  });

export const importableTables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => Object.keys(TABLE_FIELDS).map((t) => ({ table: t, fields: TABLE_FIELDS[t] })));
