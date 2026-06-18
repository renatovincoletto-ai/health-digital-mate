import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AuditEntry = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  severity: string;
  metadata: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_id: string | null;
};

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; action?: string; severity?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("audit_log")
      .select("id,action,resource_type,resource_id,severity,metadata,ip_address,user_agent,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.action) q = q.eq("action", data.action);
    if (data.severity) q = q.eq("severity", data.severity);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AuditEntry[];
  });

export const recordAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
    severity?: "info" | "warn" | "critical";
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("log_audit", {
      _action: data.action,
      _resource_type: data.resource_type,
      _resource_id: data.resource_id ?? "",
      _metadata: (data.metadata ?? {}) as never,
      _severity: data.severity ?? "info",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const auditStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("audit_log")
      .select("severity,action,created_at")
      .gte("created_at", since);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const bySeverity: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    for (const r of rows) {
      bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
      byAction[r.action] = (byAction[r.action] ?? 0) + 1;
    }
    const topActions = Object.entries(byAction)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([action, count]) => ({ action, count }));
    return { total: rows.length, bySeverity, topActions };
  });
