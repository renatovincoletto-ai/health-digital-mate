import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/conteudo")({
  component: () => (
    <AppShell>
      <ComingSoon
        icon={Sparkles}
        title="Conteúdo & redes sociais"
        description="Brand kit completo, gerador de peças com IA respeitando seu visual, e agendador automático para Instagram, Facebook e LinkedIn."
        bullets={[
          "Upload de logo, cores, fontes e tom de voz",
          "Geração de posts, stories e carrosséis",
          "Calendário editorial mensal automático",
          "Publicação programada nas redes",
          "Aprovação opcional antes de publicar",
        ]}
        secondaryIcon={ImageIcon}
        wave="Onda 3"
      />
    </AppShell>
  ),
});
