
# SaúdeOS — Plataforma all-in-one para médicos e dentistas

Agência digital autônoma vertical: o profissional se cadastra, paga, e a IA cuida de site, agenda, conteúdo, anúncios e reputação. Você não opera nada manualmente.

## Como vou construir (ondas iterativas)

Vou entregar em 5 ondas. Cada onda gera um app funcional e testável — você valida e passamos para a próxima. **Esta primeira rodada entrega a Onda 0 + Onda 1 completas.**

---

### 🌊 ONDA 0 — Fundação (esta rodada)
- **Lovable Cloud** ativado (Postgres, Auth, Storage, Edge Functions)
- **Design system** premium em PT-BR, voltado para o setor de saúde (sóbrio, confiável, moderno — sem cara de hospital genérico)
- **Auth completo**: cadastro/login email+senha + Google
- **Onboarding self-service**: especialidade (médico/dentista/clínica), CRM/CRO, nome, foto, cidade, nicho
- **Modelo de dados multi-tenant**: `tenants`, `profiles`, `user_roles` (owner/staff), `subscriptions`
- **Dashboard central** com cards de cada módulo (Site, Agenda, Conteúdo, Ads, Reputação)
- **Compliance LGPD/CFM/CFO embutido**: consentimento, guardrails da IA bloqueando "antes/depois", promessa de resultado, sensacionalismo
- **Página de pricing** e billing stub (Stripe entra em onda futura)
- **Landing page comercial** da plataforma (captação de profissionais)

### 🌊 ONDA 1 — Site Builder + Assistente IA (esta rodada)
- Cada tenant ganha um **subdomínio** (`drsilva.suaplataforma.com.br`) ou rota pública
- **Assistente IA conversacional** estilo Lovable usando Lovable AI (Gemini 3 Flash) que:
  - faz perguntas sobre a clínica e gera o site inicial
  - edita seções por conversa ("deixa o hero mais quente", "adiciona depoimentos")
  - respeita guardrails do CFM/CFO
- Site público gerado com: hero, sobre, especialidades, equipe, depoimentos, FAQ, localização, CTA agenda, WhatsApp flutuante
- **SEO local automático**: schema.org `MedicalBusiness`/`Dentist`, meta tags, sitemap
- Upload de logo, fotos, paleta da marca

### 🌊 ONDA 2 — Agenda + Integrações (próxima rodada)
- Calendário próprio + sync bidirecional Google Calendar e Outlook (OAuth por profissional)
- Agenda pública embutida no site (paciente escolhe horário sem login)
- **WhatsApp Business** (via API): confirmação, lembrete 24h e 2h antes, reagendamento
- Email transacional (Resend) para o que WhatsApp não cobrir
- Bloqueio de horários, duração por tipo de consulta, múltiplos profissionais, sala/unidade

### 🌊 ONDA 3 — Marca → Peças → Redes Sociais
- Brand kit: logo, cores, fontes, tom de voz
- **Gerador de peças** (Lovable AI image gen): posts feed, stories, carrosséis
- Agente de conteúdo IA: gera calendário editorial mensal com base no nicho
- **Publicação programada**: Instagram, Facebook (Meta API), LinkedIn
- Fila de aprovação antes de publicar (opcional auto-publish)

### 🌊 ONDA 4 — Ads + Reputação + Pagamentos
- **Google Ads**: criação de campanhas Search/Performance Max via API com templates por especialidade
- **Meta Ads**: campanhas Instagram/Facebook integradas
- Dashboard único de ROI (lead → consulta → faturamento por canal)
- **Gestão de reputação**: pedido automático de review no Google pós-consulta, respostas com IA
- **Pix + cartão** para sinal de consulta (Stripe ou Asaas)
- **Email marketing** de reengajamento (paciente sumido)

### 🌊 ONDA 5 (sugestões extras que recomendo)
- Anamnese digital pré-consulta (formulários LGPD-compliant)
- Transcrição de consulta com IA + resumo (com consentimento)
- Multi-unidade / multi-profissional com permissões granulares
- Programa de indicação (paciente indica paciente)
- App PWA para o profissional gerenciar do celular
- White-label para revenda regional

---

## Stack técnico

- **TanStack Start** (já configurado) + Lovable Cloud (Supabase gerenciado)
- **IA**: Lovable AI Gateway (Gemini 3 Flash para chat, Gemini 3 Pro Image para peças)
- **Multi-tenancy** via RLS no Postgres com `tenant_id` em todas as tabelas
- **Roles** em tabela separada com `has_role()` (nunca no profile — evita escalation)
- **Edge functions** para webhooks (Google Calendar, WhatsApp, Meta, Stripe)
- Integrações por OAuth por tenant (cada médico conecta a própria conta Google/Meta)

## Sobre custos que você precisa saber

A maioria das integrações precisa de **contas e chaves do próprio profissional** (não suas):
- Google Calendar / Outlook → OAuth do usuário
- Meta Ads / Google Ads → conta de anúncios do próprio médico
- WhatsApp Business API → exige aprovação da Meta + número dedicado
- Stripe/Asaas → conta do profissional para receber

Algumas precisam de **chaves suas como plataforma** (vou pedir quando chegarmos lá):
- Resend (email) — já vem no Lovable Cloud
- Lovable AI — já configurado (créditos do seu workspace)
- Google Cloud project (para OAuth Calendar/Ads)
- Meta App (para Ads/Instagram)
- WhatsApp Cloud API

## O que entrego AGORA (Ondas 0 + 1)

1. Lovable Cloud + esquema multi-tenant + auth + roles
2. Landing comercial da plataforma
3. Onboarding self-service do profissional
4. Dashboard central com todos os módulos visíveis (os não-prontos ficam "em breve")
5. Site builder com assistente IA conversacional funcionando de verdade
6. Site público de cada profissional renderizado em rota dinâmica
7. SEO local + compliance guardrails

Depois você me diz "vamos para a Onda 2" e atacamos agenda + integrações.

**Confirma esse plano que eu começo a construir?** Se quiser ajustar prioridades (ex.: trocar ordem das ondas, cortar landing comercial agora, começar pela agenda em vez do site), me diz antes que eu sigo.
