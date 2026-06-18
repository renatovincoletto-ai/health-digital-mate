import { createFileRoute } from "@tanstack/react-router";
import { Star, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/reputacao")({
  component: () => (
    <AppShell>
      <ComingSoon
        icon={Star}
        title="Reputação no Google"
        description="Pedido automático de avaliação após cada consulta, respostas com IA e monitoramento contínuo do score do consultório."
        bullets={[
          "Envio automático pós-consulta por WhatsApp",
          "Detecção de reviews negativos com alerta",
          "Sugestão de resposta gerada por IA",
          "Histórico e evolução do score",
          "Integração com Google Business Profile",
        ]}
        secondaryIcon={MessageSquare}
        wave="Onda 4"
      />
    </AppShell>
  ),
});
