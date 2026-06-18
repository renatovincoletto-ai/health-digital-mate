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

export const listTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.enum(["aberto", "em_analise", "em_progresso", "resolvido", "fechado", "todos"]).default("todos"),
      kind: z.enum(["bug", "duvida", "melhoria", "outro", "todos"]).default("todos"),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    let q = context.supabase.from("support_tickets").select("*").eq("tenant_id", tid).order("created_at", { ascending: false }).limit(200);
    if (data.status !== "todos") q = q.eq("status", data.status);
    if (data.kind !== "todos") q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(["bug", "duvida", "melhoria", "outro"]),
      priority: z.enum(["baixa", "media", "alta", "critica"]).default("media"),
      title: z.string().trim().min(3).max(160),
      description: z.string().trim().min(5).max(8000),
      module: z.string().max(60).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const { data: row, error } = await context.supabase
      .from("support_tickets")
      .insert({ tenant_id: tid, created_by: context.userId, ...data })
      .select("id").single();
    if (error) throw error;
    return { id: row.id as string };
  });

export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["aberto", "em_analise", "em_progresso", "resolvido", "fechado"]).optional(),
      priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
      assigned_to: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: any = {};
    if (data.status) {
      patch.status = data.status;
      if (data.status === "resolvido" || data.status === "fechado") patch.resolved_at = new Date().toISOString();
    }
    if (data.priority) patch.priority = data.priority;
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to;
    const { error } = await context.supabase.from("support_tickets").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("support_tickets").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const voteTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), delta: z.number().int().min(-1).max(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cur } = await context.supabase.from("support_tickets").select("votes").eq("id", data.id).maybeSingle();
    const next = Math.max(0, (cur?.votes ?? 0) + data.delta);
    const { error } = await context.supabase.from("support_tickets").update({ votes: next }).eq("id", data.id);
    if (error) throw error;
    return { votes: next };
  });

export const listComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ticket_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("support_ticket_comments")
      .select("id, body, created_at, author_id")
      .eq("ticket_id", data.ticket_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ticket_id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tid = await tenantOf(context);
    const { error } = await context.supabase.from("support_ticket_comments").insert({
      ticket_id: data.ticket_id, tenant_id: tid, author_id: context.userId, body: data.body,
    });
    if (error) throw error;
    return { ok: true };
  });
