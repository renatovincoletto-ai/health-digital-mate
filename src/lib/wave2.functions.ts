import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ DASHBOARD KPIs ============
export const getDashboardKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const today = new Date();
    const startToday = new Date(today); startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(today); endToday.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6); weekStart.setHours(0, 0, 0, 0);

    const [todayAppts, monthAppts, weekAppts, patients, waiting, txMonth, txToday, waitlistCount, npsRows] = await Promise.all([
      sb.from("appointments").select("id,status,starts_at,patient_name,professional_id,service_id", { count: "exact" })
        .gte("starts_at", startToday.toISOString()).lte("starts_at", endToday.toISOString()),
      sb.from("appointments").select("id,status,starts_at", { count: "exact" })
        .gte("starts_at", monthStart.toISOString()),
      sb.from("appointments").select("starts_at,status")
        .gte("starts_at", weekStart.toISOString()).lte("starts_at", endToday.toISOString()),
      sb.from("patients").select("id", { count: "exact", head: true }),
      sb.from("appointments").select("id", { count: "exact", head: true })
        .in("status", ["waiting_room", "in_service"]),
      sb.from("financial_transactions").select("amount,direction,status")
        .gte("created_at", monthStart.toISOString()),
      sb.from("financial_transactions").select("amount,direction,status")
        .gte("created_at", startToday.toISOString()).lte("created_at", endToday.toISOString()),
      sb.from("waitlist").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      sb.from("nps_surveys").select("score,created_at")
        .gte("created_at", new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString()),
    ]);

    const txs = (txMonth.data ?? []) as any[];
    const txDirection = (t: any) => t.direction ?? (t.type === "income" ? "in" : t.type === "expense" ? "out" : t.type);
    const receita = txs.filter(t => txDirection(t) === "in" && t.status === "paid").reduce((s, t) => s + Number(t.amount || 0), 0);
    const despesa = txs.filter(t => txDirection(t) === "out" && t.status === "paid").reduce((s, t) => s + Number(t.amount || 0), 0);
    const aReceber = txs.filter(t => txDirection(t) === "in" && t.status === "pending").reduce((s, t) => s + Number(t.amount || 0), 0);
    const todayTxs = (txToday.data ?? []) as any[];
    const receitaHoje = todayTxs.filter(t => txDirection(t) === "in" && t.status === "paid").reduce((s, t) => s + Number(t.amount || 0), 0);

    const monthData = (monthAppts.data ?? []) as any[];
    const totalMes = monthData.length;
    const concluidos = monthData.filter(a => a.status === "completed").length;
    const faltas = monthData.filter(a => a.status === "no_show").length;
    const taxaFalta = totalMes ? (faltas / totalMes) * 100 : 0;
    const ocupacao = totalMes ? (concluidos / totalMes) * 100 : 0;
    const ticketMedio = concluidos ? receita / concluidos : 0;

    // NPS (last 60 days)
    const nps = (npsRows.data ?? []) as Array<{ score: number }>;
    const promotores = nps.filter(n => n.score >= 9).length;
    const detratores = nps.filter(n => n.score <= 6).length;
    const npsScore = nps.length ? Math.round(((promotores - detratores) / nps.length) * 100) : null;

    // Weekly sparkline: bookings per day for the last 7 days
    const week = (weekAppts.data ?? []) as Array<{ starts_at: string }>;
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const c = week.filter(a => {
        const t = new Date(a.starts_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      days.push({ date: d.toISOString().slice(0, 10), count: c });
    }

    return {
      todayCount: todayAppts.count ?? 0,
      todayList: (todayAppts.data ?? []) as any[],
      monthCount: totalMes,
      patientsCount: patients.count ?? 0,
      waitingNow: waiting.count ?? 0,
      waitlistCount: waitlistCount.count ?? 0,
      receitaMes: receita,
      receitaHoje,
      despesaMes: despesa,
      aReceberMes: aReceber,
      saldoMes: receita - despesa,
      taxaFalta,
      ocupacao,
      ticketMedio,
      npsScore,
      npsCount: nps.length,
      weekly: days,
    };
  });

// ============ RECEPÇÃO / SALA DE ESPERA ============
export const listTodayAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
    const { data, error } = await context.supabase
      .from("appointments")
      .select("*, professionals(full_name,color), services(name,duration_minutes)")
      .gte("starts_at", startToday.toISOString())
      .lte("starts_at", endToday.toISOString())
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const setAppointmentReceptionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "waiting_room", "in_service", "completed", "no_show", "cancelled"]),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ WAITLIST ============
export const listWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("waitlist")
      .select("*, professionals(full_name), services(name,duration_minutes)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const WaitlistInput = z.object({
  id: z.string().uuid().optional(),
  patient_name: z.string().min(2).max(160),
  patient_phone: z.string().max(40).optional().nullable(),
  patient_email: z.string().email().optional().or(z.literal("")).nullable(),
  professional_id: z.string().uuid().nullable().optional(),
  service_id: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  preferred_from: z.string().nullable().optional(),
  preferred_to: z.string().nullable().optional(),
  notes: z.string().max(800).nullable().optional(),
  status: z.enum(["waiting", "contacted", "scheduled", "dropped"]).default("waiting"),
});
export const saveWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => WaitlistInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: t } = await sb.from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!t) throw new Error("Consultório não encontrado");
    const payload: any = { ...data, tenant_id: t.id, patient_email: data.patient_email || null };
    if (data.id) {
      const { id, ...rest } = payload;
      const { data: row, error } = await sb.from("waitlist").update(rest).eq("id", id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await sb.from("waitlist").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deleteWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("waitlist").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ ALERGIAS ============
export const listPatientAllergies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patient_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("patient_allergies").select("*").eq("patient_id", data.patient_id)
      .order("severity", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

const AllergyInput = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  substance: z.string().min(1).max(160),
  severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
  reaction: z.string().max(400).optional().nullable(),
  notes: z.string().max(800).optional().nullable(),
});
export const savePatientAllergy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AllergyInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: t } = await sb.from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!t) throw new Error("Consultório não encontrado");
    const payload: any = { ...data, tenant_id: t.id };
    if (data.id) {
      const { id, ...rest } = payload;
      const { data: row, error } = await sb.from("patient_allergies").update(rest).eq("id", id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await sb.from("patient_allergies").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const deletePatientAllergy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("patient_allergies").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ AGENDAMENTO RECORRENTE ============
const RecurringInput = z.object({
  professional_id: z.string().uuid(),
  service_id: z.string().uuid().nullable().optional(),
  patient_name: z.string().min(2).max(160),
  patient_phone: z.string().max(40).optional().nullable(),
  patient_email: z.string().email().optional().or(z.literal("")).nullable(),
  starts_at: z.string(),
  duration_minutes: z.number().int().min(5).max(480).default(30),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  occurrences: z.number().int().min(2).max(52),
  internal_notes: z.string().optional().nullable(),
});
export const createRecurringAppointments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RecurringInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: t } = await sb.from("tenants").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!t) throw new Error("Consultório não encontrado");
    const groupId = crypto.randomUUID();
    const rule = data.frequency === "weekly" ? "FREQ=WEEKLY"
      : data.frequency === "biweekly" ? "FREQ=WEEKLY;INTERVAL=2"
      : "FREQ=MONTHLY";
    const stepDays = data.frequency === "weekly" ? 7 : data.frequency === "biweekly" ? 14 : 0;
    const rows: any[] = [];
    const base = new Date(data.starts_at);
    for (let i = 0; i < data.occurrences; i++) {
      const start = new Date(base);
      if (data.frequency === "monthly") start.setMonth(base.getMonth() + i);
      else start.setDate(base.getDate() + i * stepDays);
      const end = new Date(start.getTime() + data.duration_minutes * 60_000);
      rows.push({
        tenant_id: t.id,
        professional_id: data.professional_id,
        service_id: data.service_id || null,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone || null,
        patient_email: data.patient_email || null,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: "confirmed",
        internal_notes: data.internal_notes || null,
        recurrence_rule: `${rule};COUNT=${data.occurrences}`,
        recurrence_group_id: groupId,
      });
    }
    const { error } = await sb.from("appointments").insert(rows);
    if (error) throw error;
    return { ok: true, count: rows.length, group_id: groupId };
  });
