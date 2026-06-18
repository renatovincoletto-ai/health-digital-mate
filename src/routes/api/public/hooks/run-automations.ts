import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const GATEWAY_URL = "https://connector-gateway.lovable.dev";

async function sendEmail(opts: {
  to: string; subject: string; html: string; fromName?: string | null; fromAddress?: string | null;
}): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const LOVABLE_KEY = process.env.LOVABLE_API_KEY;
  if (!RESEND_KEY || !LOVABLE_KEY) return { ok: false, error: "Resend não configurado" };
  const from = opts.fromAddress
    ? (opts.fromName ? `${opts.fromName} <${opts.fromAddress}>` : opts.fromAddress)
    : "Lovable Health <onboarding@resend.dev>";
  try {
    const r = await fetch(`${GATEWAY_URL}/resend/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "X-Connection-Api-Key": RESEND_KEY,
      },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: `Resend ${r.status}: ${JSON.stringify(data).slice(0, 200)}` };
    return { ok: true, providerId: data.id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function sendTwilio(opts: { to: string; body: string; from?: string | null; whatsapp: boolean }):
  Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const TWILIO_KEY = process.env.TWILIO_API_KEY;
  const LOVABLE_KEY = process.env.LOVABLE_API_KEY;
  if (!TWILIO_KEY || !LOVABLE_KEY) return { ok: false, error: "Twilio não configurado" };
  if (!opts.from) return { ok: false, error: "Número 'from' não configurado em automações" };
  const to = opts.whatsapp ? `whatsapp:${opts.to}` : opts.to;
  const from = opts.whatsapp ? `whatsapp:${opts.from}` : opts.from;
  try {
    const r = await fetch(`${GATEWAY_URL}/twilio/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "X-Connection-Api-Key": TWILIO_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: opts.body }).toString(),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: `Twilio ${r.status}: ${data?.message ?? JSON.stringify(data).slice(0, 200)}` };
    return { ok: true, providerId: data.sid };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function processOne(admin: any, job: any) {
  // Load tenant settings
  const { data: s } = await admin.from("automation_settings").select("*").eq("tenant_id", job.tenant_id).maybeSingle();
  const settings = s ?? { email_enabled: true, whatsapp_enabled: false, sms_enabled: false, dry_run: true };

  const channelEnabled =
    (job.channel === "email" && settings.email_enabled) ||
    (job.channel === "whatsapp" && settings.whatsapp_enabled) ||
    (job.channel === "sms" && settings.sms_enabled);

  if (!channelEnabled) {
    return { status: "skipped", error: `Canal ${job.channel} desabilitado` };
  }

  if (settings.dry_run) {
    return { status: "sent", providerId: `dry-run-${Date.now()}`, error: null };
  }

  if (job.channel === "email") {
    const r = await sendEmail({
      to: job.recipient,
      subject: job.subject ?? "Notificação",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5">${job.body.replace(/\n/g, "<br/>")}</div>`,
      fromName: settings.email_from_name,
      fromAddress: settings.email_from_address,
    });
    return r.ok ? { status: "sent", providerId: r.providerId, error: null } : { status: "failed", error: r.error };
  }
  if (job.channel === "whatsapp" || job.channel === "sms") {
    const from = job.channel === "whatsapp" ? settings.twilio_whatsapp_from : settings.twilio_from_number;
    const r = await sendTwilio({ to: job.recipient, body: job.body, from, whatsapp: job.channel === "whatsapp" });
    return r.ok ? { status: "sent", providerId: r.providerId, error: null } : { status: "failed", error: r.error };
  }
  return { status: "failed", error: `Canal desconhecido: ${job.channel}` };
}

export const Route = createFileRoute("/api/public/hooks/run-automations")({
  server: {
    handlers: {
      POST: async () => {
        const admin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const nowIso = new Date().toISOString();
        const { data: jobs, error } = await admin
          .from("automation_jobs")
          .select("*")
          .eq("status", "pending")
          .lte("scheduled_for", nowIso)
          .order("scheduled_for", { ascending: true })
          .limit(50);

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const results: any[] = [];
        for (const job of jobs ?? []) {
          // mark processing
          await admin.from("automation_jobs").update({ status: "processing", attempts: (job.attempts ?? 0) + 1 }).eq("id", job.id);
          try {
            const r = await processOne(admin, job);
            await admin.from("automation_jobs").update({
              status: r.status,
              last_error: r.error ?? null,
              provider_id: (r as any).providerId ?? null,
              sent_at: r.status === "sent" ? new Date().toISOString() : null,
            }).eq("id", job.id);
            results.push({ id: job.id, status: r.status });
          } catch (e: any) {
            await admin.from("automation_jobs").update({
              status: job.attempts >= 4 ? "failed" : "pending",
              last_error: e.message,
            }).eq("id", job.id);
            results.push({ id: job.id, status: "error", error: e.message });
          }
        }

        return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => new Response(JSON.stringify({ ok: true, hint: "POST para processar" }), { headers: { "Content-Type": "application/json" } }),
    },
  },
});
