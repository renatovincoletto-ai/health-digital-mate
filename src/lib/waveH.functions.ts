import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ============ PERFORMANCE POR PROFISSIONAL ============
export const getProfessionalPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const sb = context.supabase;
    const since = new Date(); since.setDate(since.getDate() - 90);

    const [{ data: pros }, { data: appts }, { data: tx }, { data: nps }] = await Promise.all([
      sb.from("professionals").select("id,name,specialty,color").eq("tenant_id", tenant_id),
      sb.from("appointments").select("id,professional_id,service_id,status,starts_at").eq("tenant_id", tenant_id).gte("starts_at", since.toISOString()),
      sb.from("financial_transactions").select("amount,direction,professional_id,paid_at,due_date").eq("tenant_id", tenant_id).gte("due_date", since.toISOString().slice(0, 10)),
      sb.from("nps_surveys").select("score,professional_id,created_at").eq("tenant_id", tenant_id).gte("created_at", since.toISOString()),
    ]);

    const rows = (pros ?? []).map((p: any) => {
      const a = (appts ?? []).filter((x: any) => x.professional_id === p.id);
      const completed = a.filter((x: any) => x.status === "completed").length;
      const noShow = a.filter((x: any) => x.status === "no_show").length;
      const cancelled = a.filter((x: any) => x.status === "cancelled").length;
      const total = a.length;
      const revenue = (tx ?? []).filter((t: any) => t.professional_id === p.id && t.kind === "income")
        .reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
      const ticket = completed > 0 ? revenue / completed : 0;
      const npsRows = (nps ?? []).filter((n: any) => n.professional_id === p.id);
      const proms = npsRows.filter((n: any) => Number(n.score) >= 9).length;
      const detrs = npsRows.filter((n: any) => Number(n.score) <= 6).length;
      const npsScore = npsRows.length > 0 ? Math.round(((proms - detrs) / npsRows.length) * 100) : 0;
      return {
        id: p.id, name: p.name, specialty: p.specialty, color: p.color,
        total, completed, noShow, cancelled,
        noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
        revenue, ticket, npsScore, npsCount: npsRows.length,
      };
    });
    rows.sort((a: any, b: any) => b.revenue - a.revenue);
    return rows;
  });

// ============ FUNIL DE CAPTAÇÃO ============
export const getCaptureFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const sb = context.supabase;
    const since = new Date(); since.setDate(since.getDate() - 90);

    const [{ count: leads }, { data: appts }, { data: returners }] = await Promise.all([
      sb.from("waitlist").select("id", { count: "exact", head: true }).eq("tenant_id", tenant_id).gte("created_at", since.toISOString()),
      sb.from("appointments").select("id,patient_name,status,starts_at").eq("tenant_id", tenant_id).gte("starts_at", since.toISOString()),
      sb.from("appointments").select("patient_name,starts_at").eq("tenant_id", tenant_id).gte("starts_at", since.toISOString()),
    ]);

    const scheduled = (appts ?? []).length;
    const attended = (appts ?? []).filter((a: any) => a.status === "completed").length;

    // recorrência: pacientes com 2+ consultas no período
    const counts = new Map<string, number>();
    for (const r of returners ?? []) {
      const k = (r.patient_name ?? "").toLowerCase().trim();
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const recurring = Array.from(counts.values()).filter(c => c >= 2).length;

    return {
      leads: leads ?? 0,
      scheduled,
      attended,
      recurring,
      conversionLeadToSched: leads ? Math.round((scheduled / Math.max(leads, 1)) * 100) : 0,
      conversionSchedToAtt: scheduled ? Math.round((attended / scheduled) * 100) : 0,
      conversionAttToRec: attended ? Math.round((recurring / Math.max(attended, 1)) * 100) : 0,
    };
  });

// ============ COHORT DE RETENÇÃO ============
export const getRetentionCohort = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const sb = context.supabase;
    const since = new Date(); since.setMonth(since.getMonth() - 6);

    const { data: appts } = await sb.from("appointments")
      .select("patient_name,starts_at,status")
      .eq("tenant_id", tenant_id)
      .gte("starts_at", since.toISOString())
      .order("starts_at", { ascending: true });

    // first visit per patient
    const firstVisit = new Map<string, Date>();
    const visitsByPatient = new Map<string, Date[]>();
    for (const a of appts ?? []) {
      const k = (a.patient_name ?? "").toLowerCase().trim();
      if (!k) continue;
      const d = new Date(a.starts_at);
      if (!firstVisit.has(k)) firstVisit.set(k, d);
      if (!visitsByPatient.has(k)) visitsByPatient.set(k, []);
      visitsByPatient.get(k)!.push(d);
    }

    // group cohorts by month of first visit
    const cohorts = new Map<string, { size: number; r30: number; r60: number; r90: number }>();
    for (const [k, first] of firstVisit) {
      const month = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
      const visits = visitsByPatient.get(k) ?? [];
      const r30 = visits.some(v => v.getTime() > first.getTime() && v.getTime() - first.getTime() <= 30 * 86400000) ? 1 : 0;
      const r60 = visits.some(v => v.getTime() > first.getTime() && v.getTime() - first.getTime() <= 60 * 86400000) ? 1 : 0;
      const r90 = visits.some(v => v.getTime() > first.getTime() && v.getTime() - first.getTime() <= 90 * 86400000) ? 1 : 0;
      const c = cohorts.get(month) ?? { size: 0, r30: 0, r60: 0, r90: 0 };
      c.size += 1; c.r30 += r30; c.r60 += r60; c.r90 += r90;
      cohorts.set(month, c);
    }
    return Array.from(cohorts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, c]) => ({
        month,
        size: c.size,
        r30: c.size ? Math.round((c.r30 / c.size) * 100) : 0,
        r60: c.size ? Math.round((c.r60 / c.size) * 100) : 0,
        r90: c.size ? Math.round((c.r90 / c.size) * 100) : 0,
      }));
  });

// ============ DRE SIMPLIFICADO ============
export const getSimpleDre = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenant_id = await getTenantId(context);
    const sb = context.supabase;
    const since = new Date(); since.setMonth(since.getMonth() - 6); since.setDate(1);

    const [{ data: tx }, { data: payouts }] = await Promise.all([
      sb.from("financial_transactions").select("amount,kind,occurred_at").eq("tenant_id", tenant_id).gte("occurred_at", since.toISOString()),
      sb.from("professional_payouts").select("amount,reference_month").eq("tenant_id", tenant_id).gte("reference_month", since.toISOString().slice(0, 10)),
    ]);

    const buckets = new Map<string, { revenue: number; expense: number; payout: number }>();
    for (const t of tx ?? []) {
      const d = new Date(t.occurred_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(k) ?? { revenue: 0, expense: 0, payout: 0 };
      if (t.kind === "income") b.revenue += Number(t.amount ?? 0);
      else if (t.kind === "expense") b.expense += Number(t.amount ?? 0);
      buckets.set(k, b);
    }
    for (const p of payouts ?? []) {
      const d = new Date(p.reference_month);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(k) ?? { revenue: 0, expense: 0, payout: 0 };
      b.payout += Number(p.amount ?? 0);
      buckets.set(k, b);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, b]) => ({
        month,
        revenue: b.revenue,
        expense: b.expense,
        payout: b.payout,
        profit: b.revenue - b.expense - b.payout,
      }));
  });
