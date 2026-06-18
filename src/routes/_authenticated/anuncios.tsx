import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/anuncios")({
  component: () => (
    <AppShell>
      <ComingSoon
        icon={Megaphone}
        title="Google Ads & Meta Ads"
        description="Criação e otimização automática de campanhas Search, Performance Max e Instagram/Facebook, com dashboard único de ROI por canal."
        bullets={[
          "Templates de campanha por especialidade",
          "Lances e públicos otimizados pela IA",
          "Atribuição de lead até consulta realizada",
          "Compliance de anúncio médico/odontológico",
          "Pause/play automático por performance",
        ]}
        secondaryIcon={BarChart3}
        wave="Onda 4"
      />
    </AppShell>
  ),
});
