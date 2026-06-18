import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("tenants").select("id").eq("owner_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Consultório não encontrado");
  return data.id as string;
}

// ============ ONDA A — Pacientes 360° ============

const PatientFullInput = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2).max(160),
  cpf: z.string().max(20).nullable().optional(),
  rg: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().max(30).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  marital_status: z.string().max(30).nullable().optional(),
  profession: z.string().max(80).nullable().optional(),
  blood_type: z.string().max(5).nullable().optional(),
  height_cm: z.number().nullable().optional(),
  weight_kg: z.number().nullable().optional(),
  allergies_summary: z.string().max(1000).nullable().optional(),
  payment_preference: z.string().max(40).nullable().optional(),
  photo_url: z.string().nullable().optional(),
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  notes: z.string().max(4000).nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export const savePatientFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PatientFullInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const payload: any = {
      ...data,
      tenant_id,
      email: data.email || null,
      birth_date: data.birth_date || null,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("patients").update(payload).eq("id", data.id).select().single();
      if (error) throw error; return row;
    }
    const { data: row, error } = await context.supabase.from("patients").insert(payload).select().single();
    if (error) throw error; return row;
  });

export const searchPatients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    q: z.string().default(""),
    limit: z.number().int().min(1).max(200).default(50),
    only_active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("patients")
      .select("id, full_name, cpf, phone, email, photo_url, last_visit_at, archived_at, tags, lifetime_value")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.only_active) query = query.is("archived_at", null);
    if (data.q?.trim()) {
      const q = data.q.trim();
      const digits = q.replace(/\D/g, "");
      // OR across name, email, cpf, phone
      const parts = [
        `full_name.ilike.%${q}%`,
        `email.ilike.%${q}%`,
      ];
      if (digits.length >= 3) {
        parts.push(`cpf.ilike.%${digits}%`);
        parts.push(`phone.ilike.%${digits}%`);
      }
      query = query.or(parts.join(","));
    }
    const { data: rows, error } = await query;
    if (error) throw error;
    return rows ?? [];
  });

export const getPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: patient, error } = await context.supabase.from("patients").select("*").eq("id", data.id).single();
    if (error) throw error;
    const [notes, allergies, prescriptions, attachments] = await Promise.all([
      context.supabase.from("consultation_notes")
        .select("id, created_at, status, soap_subjective, soap_plan, professional_id, professionals(full_name)")
        .eq("patient_id", data.id).order("created_at", { ascending: false }).limit(50),
      context.supabase.from("patient_allergies").select("*").eq("patient_id", data.id),
      context.supabase.from("prescriptions").select("id, doc_type, content, created_at, valid_until").eq("patient_id", data.id).order("created_at", { ascending: false }).limit(20),
      context.supabase.from("patient_attachments").select("*, professionals(full_name)").eq("patient_id", data.id).order("created_at", { ascending: false }),
    ]);
    return {
      patient,
      notes: notes.data ?? [],
      allergies: allergies.data ?? [],
      prescriptions: prescriptions.data ?? [],
      attachments: attachments.data ?? [],
    };
  });

export const archivePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), archived: z.boolean().default(true) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("patients")
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listInactivePatients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ months: z.number().int().min(1).max(60).default(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - data.months);
    const tenant_id = await getTenantId(context);
    const { data: rows, error } = await context.supabase
      .from("patients")
      .select("id, full_name, phone, email, last_visit_at, created_at")
      .eq("tenant_id", tenant_id)
      .is("archived_at", null)
      .or(`last_visit_at.is.null,last_visit_at.lt.${cutoff.toISOString()}`)
      .order("last_visit_at", { ascending: true, nullsFirst: true })
      .limit(200);
    if (error) throw error;
    return rows ?? [];
  });

// Attachments: client uploads directly to storage with its session; we just register the row.
export const registerPatientAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid(),
    consultation_note_id: z.string().uuid().nullable().optional(),
    professional_id: z.string().uuid().nullable().optional(),
    kind: z.enum(["photo", "exam", "document", "other"]).default("photo"),
    storage_path: z.string().min(3),
    file_name: z.string().optional(),
    mime_type: z.string().optional(),
    size_bytes: z.number().int().optional(),
    description: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("patient_attachments").insert({
      ...data,
      tenant_id,
      uploaded_by: context.userId,
    }).select().single();
    if (error) throw error;
    return row;
  });

export const deletePatientAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase.from("patient_attachments").select("storage_path").eq("id", data.id).single();
    if (row?.storage_path) {
      const bucket = row.storage_path.includes("/photo/") ? "patient-photos" : "patient-attachments";
      await context.supabase.storage.from(bucket).remove([row.storage_path]);
    }
    const { error } = await context.supabase.from("patient_attachments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const signAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    storage_path: z.string().min(3),
    bucket: z.enum(["patient-photos", "patient-attachments"]).default("patient-attachments"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage.from(data.bucket).createSignedUrl(data.storage_path, 60 * 30);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

// Save a quick allergy entry
export const savePatientAllergy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    patient_id: z.string().uuid(),
    substance: z.string().min(1),
    severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
    reaction: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context);
    const { data: row, error } = await context.supabase.from("patient_allergies").insert({
      ...data, tenant_id,
    }).select().single();
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
