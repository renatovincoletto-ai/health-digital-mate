import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeQuote, type PackageKey, type PatientPackKey } from "./pricing";

async function tenantOf(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("tenant_id").eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.tenant_id) throw new Error("Usuário sem clínica associada");
  return data.tenant_id as string;
}

export const listQuotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const tenantId = await tenantOf(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("subscription_quotes").select("*").eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    package_key: PackageKey;
    professionals: number;
    units: number;
    patient_pack: PatientPackKey;
    status?: string;
  }) => d)
  .handler(async ({ data, context }: any) => {
    const tenantId = await tenantOf(context.supabase, context.userId);
    const calc = computeQuote(data);
    const { data: row, error } = await context.supabase
      .from("subscription_quotes").insert({
        tenant_id: tenantId,
        package_key: data.package_key,
        professionals: data.professionals,
        units: data.units,
        patient_pack: data.patient_pack,
        status: data.status ?? "draft",
        created_by: context.userId,
        ...calc,
      }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }: any) => {
    const { error } = await context.supabase
      .from("subscription_quotes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const tenantUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const tenantId = await tenantOf(context.supabase, context.userId);
    const [profs, units, patients] = await Promise.all([
      context.supabase.from("professionals").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      context.supabase.from("locations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      context.supabase.from("patients").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).is("archived_at", null),
    ]);
    return {
      professionals: profs.count ?? 0,
      units: units.count ?? 0,
      patients: patients.count ?? 0,
    };
  });
