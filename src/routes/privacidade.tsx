import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e Segurança · Minha Clínica" },
      {
        name: "description",
        content:
          "Como o Minha Clínica protege dados de profissionais de saúde e pacientes: autenticação, criptografia, LGPD e responsabilidades compartilhadas.",
      },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-2">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Trust Center</p>
        <h1 className="text-3xl font-bold tracking-tight">Privacidade e Segurança</h1>
        <p className="text-sm text-muted-foreground">
          Esta página é mantida pela equipe do Minha Clínica para responder dúvidas comuns sobre como
          protegemos dados de profissionais de saúde, equipes e pacientes. Ela descreve controles
          atualmente habilitados e práticas atuais — não é uma certificação independente.
        </p>
      </header>

      <Section title="Autenticação e acesso">
        <p>
          Contas usam e-mail/senha e Google. Sessões são gerenciadas via tokens JWT e cada
          requisição autenticada é revalidada no servidor. Operações administrativas exigem
          verificação de papel (role) no servidor — nunca confiamos apenas no cliente.
        </p>
      </Section>

      <Section title="Isolamento entre clínicas (multi-tenant)">
        <p>
          Cada clínica é um tenant. Todas as tabelas com dados de cliente têm Row-Level Security
          ativo e políticas escopadas por <code>tenant_id</code>. Membros de uma clínica não
          conseguem ler dados de outra. Credenciais de integrações (ex.: contas conectadas) são
          restritas ao proprietário da clínica.
        </p>
      </Section>

      <Section title="Dados sensíveis de profissionais e pacientes">
        <p>
          E-mail e telefone de profissionais não são expostos no site público — apenas nome,
          especialidade, foto e biografia. Anamneses e prontuários ficam acessíveis somente à
          equipe autorizada da clínica. Pacientes consentem expressamente (LGPD) antes de enviar
          dados pelo portal público.
        </p>
      </Section>

      <Section title="Criptografia">
        <p>
          Todo o tráfego é servido por HTTPS/TLS. Senhas são armazenadas com hash pelo provedor de
          autenticação. Backups e dados em repouso são criptografados pela infraestrutura de banco
          gerenciada.
        </p>
      </Section>

      <Section title="Sub-processadores e infraestrutura">
        <p>
          O Minha Clínica roda sobre Lovable Cloud (banco gerenciado, autenticação, storage e funções
          serverless). Modelos de IA são consumidos via Lovable AI Gateway. Não compartilhamos
          dados de pacientes com terceiros fora dos sub-processadores estritamente necessários
          para operar o serviço.
        </p>
      </Section>

      <Section title="Retenção e exclusão">
        <p>
          Profissionais podem excluir pacientes, anamneses, prontuários e contas a qualquer momento
          a partir do painel. Solicitações de exclusão definitiva da conta podem ser feitas pelo
          contato abaixo e são processadas em até 30 dias.
        </p>
      </Section>

      <Section title="Direitos do titular (LGPD)">
        <p>
          Em conformidade com a LGPD, titulares de dados podem solicitar acesso, correção,
          portabilidade ou exclusão de seus dados. Profissionais de saúde atuam como controladores
          dos dados dos próprios pacientes; o Minha Clínica atua como operador.
        </p>
      </Section>

      <Section title="Resposta a incidentes">
        <p>
          Em caso de incidente de segurança que afete dados pessoais, notificamos os clientes
          afetados e a ANPD nos prazos previstos pela LGPD, descrevendo natureza, impacto e
          medidas tomadas.
        </p>
      </Section>

      <Section title="Relate uma vulnerabilidade">
        <p>
          Se você acredita ter encontrado uma vulnerabilidade, escreva para a equipe responsável
          pela clínica que utiliza o Minha Clínica ou para o canal de suporte do produto. Pedimos que
          não explore a falha além do necessário para demonstrá-la.
        </p>
      </Section>

      <footer className="pt-6 text-xs text-muted-foreground border-t">
        <Link to="/" className="underline">← Voltar para a home</Link>
      </footer>
    </div>
  );
}
