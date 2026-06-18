import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function tenantOf(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (data) return data.id as string;
  const { data: ur } = await ctx.supabase.from("user_roles").select("tenant_id").eq("user_id", ctx.userId).limit(1).maybeSingle();
  if (!ur) throw new Error("Sem clínica vinculada");
  return ur.tenant_id as string;
}

export const listProfessionalsForNote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantOf(context);
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("professionals")
      .select("id, full_name, specialty, color, is_active")
      .eq("tenant_id", tid)
      .order("full_name");
    if (error) throw error;
    return data ?? [];
  });

export const patientTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patient_name: z.string().trim().min(2).max(120),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const sb = context.supabase as any;

    const { data: notes } = await sb
      .from("consultation_notes")
      .select("id, created_at, professional_id, patient_name, soap_subjective, soap_objective, soap_assessment, soap_plan, patient_summary, transcript")
      .eq("tenant_id", tid)
      .ilike("patient_name", `%${data.patient_name}%`)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: pros } = await sb
      .from("professionals")
      .select("id, full_name, specialty, color")
      .eq("tenant_id", tid);

    const proMap = new Map<string, any>((pros ?? []).map((p: any) => [p.id, p]));
    const enriched = (notes ?? []).map((n: any) => ({
      ...n,
      professional: n.professional_id ? proMap.get(n.professional_id) ?? null : null,
    }));

    // Group by professional for "passed through which pros"
    const byPro = new Map<string, { professional: any; count: number; first: string; last: string }>();
    for (const n of enriched) {
      const key = n.professional_id || "__sem__";
      const entry = byPro.get(key);
      if (!entry) {
        byPro.set(key, { professional: n.professional, count: 1, first: n.created_at, last: n.created_at });
      } else {
        entry.count++;
        if (n.created_at < entry.first) entry.first = n.created_at;
        if (n.created_at > entry.last) entry.last = n.created_at;
      }
    }

    return {
      notes: enriched,
      providers: Array.from(byPro.values()).sort((a, b) => (b.last < a.last ? -1 : 1)),
    };
  });

export const searchPatientNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const sb = context.supabase as any;
    const { data: names } = await sb
      .from("consultation_notes")
      .select("patient_name")
      .eq("tenant_id", tid)
      .ilike("patient_name", `%${data.q}%`)
      .limit(50);
    const unique = Array.from(new Set((names ?? []).map((n: any) => n.patient_name as string)));
    return unique.slice(0, 10);
  });
