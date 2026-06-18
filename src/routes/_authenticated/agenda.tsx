import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Plug } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: () => (
    <AppShell>
      <ComingSoon
        icon={Calendar}
        title="Agenda automatizada"
        description="Sincronização bidirecional com Google Calendar e Outlook, agendamento público no site, confirmação por WhatsApp e lembretes automáticos."
        bullets={[
          "OAuth com Google e Microsoft por profissional",
          "Página pública de agendamento",
          "Bloqueio inteligente de horários",
          "Confirmação 24h e 2h antes via WhatsApp",
          "Multi-profissional e multi-unidade",
        ]}
        secondaryIcon={Plug}
        wave="Onda 2"
      />
    </AppShell>
  ),
});
