import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultSiteContent } from "./site-content";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const getMyTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

/**
 * Garante que o usuário tenha um tenant mínimo, criando um padrão se necessário.
 * Substitui o onboarding obrigatório inicial — agora cada seção tem seu próprio onboarding.
 */
export const ensureMyTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (existing) {
      await ensureOwnerRole(context, existing.id);
      await seedTenantExamples(context, existing.id);
      return existing;
    }

    const email = (context.claims?.email as string | undefined) ?? "";
    const fallbackName = email ? email.split("@")[0] : "Meu Consultório";
    const displayName = fallbackName.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const baseSlug = slugify(displayName) || "consultorio";

    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 6) {
      const { data: taken } = await context.supabase
        .from("tenants").select("id").eq("slug", slug).maybeSingle();
      if (!taken) break;
      attempt += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .insert({
        type: "medico",
        display_name: displayName,
        owner_id: context.userId,
        slug,
        onboarding_status: "pending",
      })
      .select()
      .single();
    if (error) throw error;

    await ensureOwnerRole(context, tenant.id);
    await context.supabase.from("brands").insert({ tenant_id: tenant.id });
    const seed = defaultSiteContent(tenant.display_name, tenant.specialty, tenant.city);
    await context.supabase.from("sites").insert({
      tenant_id: tenant.id,
      content: seed,
      seo_title: tenant.display_name,
      seo_description: seed.hero.subheadline,
    });
    await seedTenantExamples(context, tenant.id);
    return tenant;
  });

async function ensureOwnerRole(context: { supabase: any; userId: string }, tenantId: string) {
  const { data: role } = await context.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .maybeSingle();
  if (!role) {
    await context.supabase.from("user_roles").insert({
      user_id: context.userId,
      tenant_id: tenantId,
      role: "owner",
    });
  }
}

async function seedTenantExamples(context: { supabase: any; userId: string }, tenantId: string) {
  const { count } = await context.supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if ((count ?? 0) > 0) return;

  const now = new Date();
  const isoAt = (days: number, hour: number, minutes = 0) => {
    const d = new Date(now);
    d.setDate(now.getDate() + days);
    d.setHours(hour, minutes, 0, 0);
    return d.toISOString();
  };
  const dateAt = (days: number) => isoAt(days, 12).slice(0, 10);

  const { data: locations } = await context.supabase.from("locations").insert([
    { tenant_id: tenantId, name: "Unidade Centro", address: "Av. Paulista, 1000", city: "São Paulo", state: "SP", phone: "(11) 3333-1000", is_primary: true },
    { tenant_id: tenantId, name: "Unidade Jardins", address: "Rua Estados Unidos, 450", city: "São Paulo", state: "SP", phone: "(11) 3333-2000" },
  ]).select("id, name");

  const { data: professionals } = await context.supabase.from("professionals").insert([
    { tenant_id: tenantId, full_name: "Dra. Marina Costa", specialty: "Clínica geral", council_type: "CRM", council_number: "123456", council_state: "SP", email: "marina@exemplo.com", phone: "(11) 98888-1001", color: "#2563EB" },
    { tenant_id: tenantId, full_name: "Dr. Rafael Nogueira", specialty: "Cardiologia", council_type: "CRM", council_number: "654321", council_state: "SP", email: "rafael@exemplo.com", phone: "(11) 98888-1002", color: "#16A34A" },
    { tenant_id: tenantId, full_name: "Dra. Laura Mendes", specialty: "Dermatologia", council_type: "CRM", council_number: "789456", council_state: "SP", email: "laura@exemplo.com", phone: "(11) 98888-1003", color: "#DC2626" },
    { tenant_id: tenantId, full_name: "Dr. Pedro Almeida", specialty: "Ortopedia", council_type: "CRM", council_number: "321987", council_state: "SP", email: "pedro@exemplo.com", phone: "(11) 98888-1004", color: "#7C3AED" },
  ]).select("id, full_name");

  const { data: services } = await context.supabase.from("services").insert([
    { tenant_id: tenantId, name: "Consulta inicial", description: "Avaliação clínica completa", duration_minutes: 50, price_cents: 28000, color: "#2563EB" },
    { tenant_id: tenantId, name: "Retorno", description: "Revisão de conduta", duration_minutes: 30, price_cents: 16000, color: "#16A34A" },
    { tenant_id: tenantId, name: "Teleconsulta", description: "Atendimento remoto", duration_minutes: 40, price_cents: 22000, color: "#0EA5E9" },
    { tenant_id: tenantId, name: "Procedimento ambulatorial", description: "Procedimento em consultório", duration_minutes: 60, price_cents: 65000, requires_deposit: true, deposit_cents: 15000, color: "#DC2626" },
  ]).select("id, name");

  const { data: patients } = await context.supabase.from("patients").insert([
    { tenant_id: tenantId, full_name: "Ana Beatriz Lima", cpf: "123.456.789-10", email: "ana@example.com", phone: "(11) 90000-0001", birth_date: "1990-04-12", gender: "Feminino", blood_type: "O+", tags: ["VIP", "Hipertensão"], allergies_summary: "Alergia a dipirona", payment_preference: "PIX", last_visit_at: isoAt(-20, 10), lifetime_value: 1280 },
    { tenant_id: tenantId, full_name: "Carlos Henrique Souza", cpf: "234.567.890-11", email: "carlos@example.com", phone: "(11) 90000-0002", birth_date: "1982-09-22", gender: "Masculino", blood_type: "A+", tags: ["Pós-operatório"], payment_preference: "Cartão de crédito", last_visit_at: isoAt(-8, 15), lifetime_value: 920 },
    { tenant_id: tenantId, full_name: "Juliana Ramos", cpf: "345.678.901-12", email: "juliana@example.com", phone: "(11) 90000-0003", birth_date: "1996-01-18", gender: "Feminino", blood_type: "B+", tags: ["Gestante"], payment_preference: "Convênio", last_visit_at: isoAt(-370, 11), lifetime_value: 410 },
    { tenant_id: tenantId, full_name: "Marcos Vinícius Prado", cpf: "456.789.012-13", email: "marcos@example.com", phone: "(11) 90000-0004", birth_date: "1975-11-03", gender: "Masculino", blood_type: "AB+", tags: ["Diabetes"], allergies_summary: "Sem alergias conhecidas", payment_preference: "Boleto", last_visit_at: isoAt(-45, 9), lifetime_value: 1860 },
    { tenant_id: tenantId, full_name: "Fernanda Rocha", cpf: "567.890.123-14", email: "fernanda@example.com", phone: "(11) 90000-0005", birth_date: "1988-06-29", gender: "Feminino", blood_type: "A-", tags: ["Primeira consulta"], payment_preference: "PIX", lifetime_value: 0 },
    { tenant_id: tenantId, full_name: "Roberto Martins", cpf: "678.901.234-15", email: "roberto@example.com", phone: "(11) 90000-0006", birth_date: "1969-02-14", gender: "Masculino", blood_type: "O-", tags: ["Cardio"], payment_preference: "Dinheiro", last_visit_at: isoAt(-2, 16), lifetime_value: 740 },
  ]).select("id, full_name, email, phone");

  const p = patients ?? [];
  const prof = professionals ?? [];
  const svc = services ?? [];
  if (!p.length || !prof.length || !svc.length) return;

  await context.supabase.from("appointments").insert([
    { tenant_id: tenantId, professional_id: prof[0].id, service_id: svc[0].id, patient_name: p[0].full_name, patient_email: p[0].email, patient_phone: p[0].phone, starts_at: isoAt(0, 9), ends_at: isoAt(0, 9, 50), status: "confirmed" },
    { tenant_id: tenantId, professional_id: prof[1].id, service_id: svc[1].id, patient_name: p[1].full_name, patient_email: p[1].email, patient_phone: p[1].phone, starts_at: isoAt(0, 10, 30), ends_at: isoAt(0, 11), status: "waiting_room" },
    { tenant_id: tenantId, professional_id: prof[2].id, service_id: svc[3].id, patient_name: p[2].full_name, patient_email: p[2].email, patient_phone: p[2].phone, starts_at: isoAt(1, 14), ends_at: isoAt(1, 15), status: "pending" },
    { tenant_id: tenantId, professional_id: prof[3].id, service_id: svc[0].id, patient_name: p[3].full_name, patient_email: p[3].email, patient_phone: p[3].phone, starts_at: isoAt(2, 8, 30), ends_at: isoAt(2, 9, 20), status: "confirmed" },
    { tenant_id: tenantId, professional_id: prof[0].id, service_id: svc[2].id, patient_name: p[4].full_name, patient_email: p[4].email, patient_phone: p[4].phone, starts_at: isoAt(3, 16), ends_at: isoAt(3, 16, 40), status: "confirmed" },
    { tenant_id: tenantId, professional_id: prof[1].id, service_id: svc[0].id, patient_name: p[5].full_name, patient_email: p[5].email, patient_phone: p[5].phone, starts_at: isoAt(-1, 11), ends_at: isoAt(-1, 11, 50), status: "completed" },
  ]);

  const { data: accounts } = await context.supabase.from("financial_accounts").insert([
    { tenant_id: tenantId, name: "Caixa da recepção", account_type: "cash", bank_name: "Interno", balance: 850 },
    { tenant_id: tenantId, name: "Conta PJ", account_type: "bank", bank_name: "Banco Clínica", balance: 12840 },
  ]).select("id");
  const acc = accounts?.[0]?.id ?? null;

  await context.supabase.from("financial_transactions").insert([
    { tenant_id: tenantId, account_id: acc, patient_id: p[0].id, professional_id: prof[0].id, direction: "in", category: "Consulta", description: "Consulta inicial — Ana Beatriz", amount: 280, due_date: dateAt(-2), paid_at: isoAt(-2, 12), status: "paid", payment_method: "pix" },
    { tenant_id: tenantId, account_id: acc, patient_id: p[1].id, professional_id: prof[1].id, direction: "in", category: "Retorno", description: "Retorno — Carlos Souza", amount: 160, due_date: dateAt(0), status: "pending", payment_method: "cartao" },
    { tenant_id: tenantId, account_id: acc, patient_id: p[2].id, professional_id: prof[2].id, direction: "in", category: "Procedimento", description: "Sinal procedimento — Juliana Ramos", amount: 150, due_date: dateAt(3), status: "pending", payment_method: "pix" },
    { tenant_id: tenantId, account_id: acc, direction: "out", category: "Insumos", description: "Compra de materiais descartáveis", amount: 420, due_date: dateAt(-1), paid_at: isoAt(-1, 17), status: "paid", payment_method: "transferencia" },
  ]);

  await context.supabase.from("patient_wallet_transactions").insert([
    { tenant_id: tenantId, patient_id: p[0].id, kind: "credit", amount: 320, description: "Crédito por procedimento remarcado", reference_type: "procedimento", created_by: context.userId },
    { tenant_id: tenantId, patient_id: p[1].id, kind: "debit", amount: 90, description: "Uso parcial de crédito em retorno", reference_type: "consulta", created_by: context.userId },
    { tenant_id: tenantId, patient_id: p[2].id, kind: "credit", amount: 150, description: "Sinal convertido em carteira", reference_type: "pagamento", created_by: context.userId },
  ]);

  await context.supabase.from("inventory_items").insert([
    { tenant_id: tenantId, location_id: locations?.[0]?.id ?? null, name: "Luvas nitrílicas P", sku: "LUV-P", category: "Descartáveis", unit: "caixa", quantity: 8, min_quantity: 10, unit_cost: 34.9, expires_at: dateAt(180) },
    { tenant_id: tenantId, location_id: locations?.[0]?.id ?? null, name: "Seringas 5ml", sku: "SER-5", category: "Insumos", unit: "un", quantity: 120, min_quantity: 50, unit_cost: 0.85, expires_at: dateAt(240) },
    { tenant_id: tenantId, location_id: locations?.[1]?.id ?? null, name: "Álcool 70%", sku: "ALC-70", category: "Higiene", unit: "frasco", quantity: 3, min_quantity: 6, unit_cost: 12.5, expires_at: dateAt(90) },
  ]);

  await context.supabase.from("waitlist").insert([
    { tenant_id: tenantId, patient_name: "Patrícia Gomes", patient_phone: "(11) 90000-0101", patient_email: "patricia@example.com", professional_id: prof[1].id, service_id: svc[0].id, priority: "high", preferred_from: isoAt(0, 8), preferred_to: isoAt(7, 18), notes: "Quer antecipar consulta se vagar horário", status: "waiting" },
    { tenant_id: tenantId, patient_name: "Eduardo Nunes", patient_phone: "(11) 90000-0102", professional_id: prof[2].id, service_id: svc[3].id, priority: "normal", preferred_from: isoAt(1, 8), preferred_to: isoAt(14, 18), notes: "Disponível à tarde", status: "waiting" },
  ]);

  await context.supabase.from("insurance_plans").insert([
    { tenant_id: tenantId, operator_name: "Unimed", ans_code: "000701", plan_name: "Unimed Nacional", contract_number: "UNI-2026-01", active: true },
    { tenant_id: tenantId, operator_name: "Bradesco Saúde", ans_code: "005711", plan_name: "Top Nacional", contract_number: "BRA-2026-01", active: true },
  ]);

  await context.supabase.from("anamnese_templates").insert({
    tenant_id: tenantId,
    name: "Anamnese clínica inicial",
    description: "Modelo para primeira consulta",
    questions: [
      { id: "q1", type: "text", label: "Queixa principal" },
      { id: "q2", type: "text", label: "Medicamentos em uso" },
      { id: "q3", type: "boolean", label: "Possui alergias?" },
    ],
  });

  await context.supabase.from("consultation_notes").insert({
    tenant_id: tenantId,
    professional_id: prof[0].id,
    patient_id: p[0].id,
    patient_name: p[0].full_name,
    patient_phone: p[0].phone,
    soap_subjective: "Paciente relata cefaleia ocasional e estresse no trabalho.",
    soap_objective: "PA 130/85, bom estado geral.",
    soap_assessment: "Cefaleia tensional provável.",
    soap_plan: "Hidratação, higiene do sono e retorno em 30 dias.",
    status: "signed",
  });

  await context.supabase.from("prescriptions").insert({
    tenant_id: tenantId,
    patient_id: p[0].id,
    professional_id: prof[0].id,
    doc_type: "receita",
    content: "Dipirona não indicada por alergia. Prescrito paracetamol 750mg se dor, conforme orientação médica.",
    signature_provider: "demo",
    qr_code: `https://saudeos.app/v/${crypto.randomUUID()}`,
    valid_until: dateAt(30),
    status: "signed",
  });

  const { data: plan } = await context.supabase.from("treatment_plans").insert({
    tenant_id: tenantId,
    patient_id: p[1].id,
    title: "Plano de acompanhamento cardiológico",
    description: "Retorno + exames de rotina",
    total_value: 760,
    status: "proposed",
  }).select("id").single();
  if (plan) {
    await context.supabase.from("treatment_plan_items").insert([
      { tenant_id: tenantId, plan_id: plan.id, sequence: 1, procedure_name: "Retorno cardiológico", unit_value: 160, quantity: 1 },
      { tenant_id: tenantId, plan_id: plan.id, sequence: 2, procedure_name: "Check-up laboratorial", unit_value: 600, quantity: 1 },
    ]);
  }
}

const CreateTenantSchema = z.object({
  type: z.enum(["medico", "dentista", "clinica", "outro"]),
  display_name: z.string().min(2).max(100),
  specialty: z.string().max(80).optional(),
  council_type: z.string().max(10).optional(),
  council_number: z.string().max(30).optional(),
  council_state: z.string().max(5).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(5).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
});

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateTenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const baseSlug = slugify(data.display_name) || "consultorio";
    // garante slug único
    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 6) {
      const { data: existing } = await context.supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .insert({
        ...data,
        owner_id: context.userId,
        slug,
        onboarding_status: "site_pending",
      })
      .select()
      .single();
    if (error) throw error;

    // role owner
    await context.supabase.from("user_roles").insert({
      user_id: context.userId,
      tenant_id: tenant.id,
      role: "owner",
    });

    // brand default
    await context.supabase.from("brands").insert({ tenant_id: tenant.id });

    // site default
    const seed = defaultSiteContent(tenant.display_name, tenant.specialty, tenant.city);
    await context.supabase.from("sites").insert({
      tenant_id: tenant.id,
      content: seed,
      seo_title: `${tenant.display_name} — ${tenant.specialty || (tenant.type === "dentista" ? "Odontologia" : "Saúde")}${tenant.city ? ` em ${tenant.city}` : ""}`,
      seo_description: seed.hero.subheadline,
    });

    return tenant;
  });

export const finishOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ onboarding_status: "completed" })
      .eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
