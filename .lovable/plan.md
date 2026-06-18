# Roadmap de Evolução — SaúdeOS

Vamos executar em 5 ondas. Cada onda é uma entrega completa e independente — você aprova uma, eu construo, e seguimos para a próxima.

---

## 🌊 Onda 1 — Fechar as 7 telas em "SimplePage"

**Objetivo:** Eliminar o visual de "em construção". Todas já persistem dados; só falta UI completa.

| Tela | O que ganhar |
|---|---|
| `/repasses` | Tabela rica com filtros por profissional/período, cálculo de comissão por % configurável, botão "Liquidar via Pix" (mock), relatório exportável |
| `/maquininhas` | Cadastro de terminais com bandeira, histórico de transações TEF com filtros, totalizadores por adquirente |
| `/convenios` | Tabela de procedimentos por convênio, prazo de repasse, regras de faturamento, status ativo/inativo |
| `/tiss` | Editor de guia TISS (consulta/SADT/honorários), envio simulado, painel de glosas com motivo |
| `/jornadas` | Construtor visual de etapas (timeline), templates prontos (boas-vindas, aniversário, recall, pós-consulta), métricas por jornada |
| `/fiscal` | Listagem com filtros, status visual (pendente/emitida/cancelada), preview de NFSe, cálculo de ISS por município |
| `/tributos` | Calendário fiscal, separação por regime (Simples/Lucro Presumido), alertas de vencimento, upload de comprovante |

---

## 🌊 Onda 2 — Dashboard + Recepção + Agendamento avançado

**Objetivo:** Transformar o `/dashboard` em centro de operação real e cobrir lacunas críticas da agenda.

- **`/dashboard` com KPIs reais**: agendamentos do dia, receita do mês, NPS, taxa de no-show, ticket médio, próximos pacientes
- **Nova rota `/recepcao`** — painel do dia para a secretária: sala de espera, em atendimento, faltou, chegou
- **Lista de espera** (`appointment_waitlist`) + botão "Encaixar" quando surge horário vago
- **Agendamento recorrente** (semanal, quinzenal, mensal) usando RRULE
- **Status visual na agenda**: badges coloridos por status (agendado / confirmado / aguardando / em atendimento / realizado / faltou / cancelado)
- **Alertas de alergia** (`patient_allergies`) com checagem automática em `/prescricoes`

---

## 🌊 Onda 3 — Engine de automação real

**Objetivo:** Fazer lembretes, jornadas e mensagens efetivamente saírem do sistema.

- **Job scheduler** (pg_cron + server route `/api/public/hooks/run-automations`) rodando a cada 5 min
- **Engine de jornadas** que executa etapas: lê `journey_steps`, dispara mensagem no canal certo, marca enrollment
- **Engine de lembretes** que olha `appointments` (24h antes, 1h antes) e dispara
- **Conector Twilio WhatsApp + SMS** (precisa de credenciais Twilio)
- **Conector de e-mail Resend** (precisa de API key)
- **Confirmação de presença** via link na mensagem (paciente clica → atualiza `appointments.status`)
- **Reengajamento automático** de inativos (90 dias sem consulta)

---

## 🌊 Onda 4 — Conectores fiscais e de pagamento ✅

**Entregue:** Camada de conectores com modo sandbox por padrão e modo live quando há credenciais.

- **`/integracoes`** — hub central com 4 conectores (Asaas, Focus NFe, Memed, Pluggy), configuração de modo (sandbox/ativo/inativo), API key e e-mail por conector, e botão "Testar conexão"
- **Asaas** — geração de link de cobrança (Pix/boleto/cartão), listagem com status e botão "Simular pago"; webhook em `/api/public/hooks/asaas` para atualizar status em produção
- **Focus NFe** — emissão de NFS-e com cálculo automático de ISS e armazenamento em `nfse_invoices`
- **Memed** — prescrições assinadas com PDF e QR Code (sandbox simula localmente, produção usa Memed real)
- **Pluggy (Open Finance)** — sincronização do extrato com inserção em `financial_transactions`, com toggle de sincronização automática diária

Cada conector roda 100% em sandbox sem chamadas externas. Para ativar modo real basta trocar o status e informar a API key — peço os secrets via formulário seguro quando você confirmar.



---

## 🌊 Onda 5 — Portal do paciente + RBAC + DRE + Folha ✅

**Entregue:**

- **`/portal/acesso`** — área pública com login por CPF + data de nascimento; exibe próximas consultas, receitas (com PDF) e notas fiscais (com PDF)
- **`/equipe`** — matriz RBAC granular (perfil × módulo × ver/criar/editar/excluir + desconto máximo) + listagem do time
- **`/dre`** — Demonstrativo de Resultados mensal com receitas, despesas, resultado líquido e breakdown por categoria; filtros de 3/6/12 meses
- **`/folha`** — folha de pagamento com salário, pró-labore, bônus, INSS, FGTS, IRRF e cálculo automático do líquido
- **Renegociação de dívidas** — server fn `createDebtNegotiation` com cálculo de juros, multa, desconto e parcelas (UI pode ser integrada em `/financeiro` quando você quiser)

Novas tabelas: `payroll_entries`, `role_permissions`, `debt_negotiations` — todas com RLS por tenant.



---

## Detalhes técnicos

- Cada onda gera 1 migration consolidada (novas tabelas, colunas, índices) + as telas correspondentes
- Onda 3 e 4 dependem de secrets externos — vou pedir cada um no momento certo
- Mantemos o padrão atual: TanStack Start + server functions + Supabase com RLS por tenant
- Telas novas seguem o `app-shell` existente e o design system atual (sem gradientes genéricos, ícones lucide, componentes shadcn)

---

## Como prosseguir

Confirme com **"vai onda 1"** (ou outra) e eu começo imediatamente. Se quiser ajustar escopo de alguma onda antes de começar, me diga o quê.