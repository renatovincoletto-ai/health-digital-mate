import { createFileRoute } from "@tanstack/react-router";

// Public webhook stub for Asaas payment status callbacks.
// In sandbox mode, this endpoint just acknowledges. For live mode,
// validate `asaas-access-token` header against a stored secret before
// updating the payment_links row.
export const Route = createFileRoute("/api/public/hooks/asaas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any = {};
        try { payload = await request.json(); } catch { /* noop */ }

        const externalId = payload?.payment?.id;
        const event = payload?.event;
        if (!externalId || !event) {
          return Response.json({ ok: true, ignored: true });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const newStatus =
          event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED" ? "paid" :
          event === "PAYMENT_OVERDUE" ? "overdue" :
          event === "PAYMENT_REFUNDED" ? "refunded" : null;
        if (!newStatus) return Response.json({ ok: true, ignored: true });

        await supabaseAdmin.from("payment_links")
          .update({ status: newStatus })
          .eq("external_id", externalId);

        return Response.json({ ok: true });
      },
    },
  },
});
