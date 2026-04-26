# Decisions Log — CRM System

> Registro de decisões arquiteturais relevantes.
> Consulte ANTES de implementar algo novo.
> Adicione APENAS decisões que impactam o futuro do sistema.

---

## FORMATO DE ENTRADA

### [2026-04-06] — Stack principal do sistema

**Contexto:** Início do CRM proprietário
**Decisão:** React + Zustand + Node.js + Supabase + Puppeteer
**Motivo:** Familiaridade, custo zero de infra inicial, Supabase cobre realtime + auth + storage em um só serviço
**Alternativas descartadas:** Firebase (vendor lock-in), Redux (verboso para o tamanho atual), Prisma (complexidade desnecessária)
**Impacto:** Toda feature nova segue esse stack — sem introduzir novas libs sem registro aqui

---

### [2026-04-06] — Zustand com slices modulares em store raiz única

**Contexto:** Necessidade de estado global compartilhado entre módulos
**Decisão:** useStore.ts compõe 11 slices via create()((...a) => ({ ...slice1(...a), ...slice2(...a) }))
**Motivo:** Acesso simples via useStore() em qualquer componente, sem prop drilling, sem Context API
**Alternativas descartadas:** Store por módulo (dificulta ações cross-domain como leadSlice chamando operacionalSlice)
**Impacto:** Qualquer novo domínio de dados = novo slice seguindo o padrão existente

---

### [2026-04-06] — Backend mínimo (server.js único)

**Contexto:** Necessidade de PDF e proxy OpenAI sem expor keys no frontend
**Decisão:** Express em server.js único — apenas para Puppeteer e proxy de IA
**Motivo:** Toda lógica de negócio fica no frontend via Supabase direto — backend só para o que não pode rodar no browser
**Alternativas descartadas:** Backend completo com ORM (over-engineering para o estágio atual)
**Impacto:** Novas rotas backend só se justificam se não puderem usar Supabase diretamente

---

### [2026-04-06] — IA híbrida (local + OpenAI)

**Contexto:** Necessidade de análise de leads sem depender de conexão
**Decisão:** iaService.ts calcula risco/urgência por regras locais primeiro. OpenAI só refina se online.
**Motivo:** Sistema funciona offline. Custo de API reduzido. Resposta mais rápida no caso comum.
**Alternativas descartadas:** Só OpenAI (dependência de internet + custo por análise)
**Impacto:** Qualquer mudança na estrutura de Lead ou historico[] afeta os dois caminhos de análise

---

### [2026-04-06] — Conversão snake_case → camelCase manual por slice

**Contexto:** Supabase retorna snake_case, TypeScript usa camelCase
**Decisão:** Cada slice tem função format() local que faz a conversão
**Motivo:** Sem camada ORM, conversão precisa ser explícita e controlada por domínio
**Alternativas descartadas:** Biblioteca de conversão automática (esconde erros, dificulta debug)
**Impacto:** Todo campo novo no Supabase precisa ser adicionado ao format() do slice relevante — fácil de esquecer
**Revisão em:** Quando migrar para ORM ou camada de adapter centralizada

### [2026-04-07] — Design system baseado no Linear

**Decisão:** Dark sidebar (#0a0a0b) + conteúdo levemente cinza (#111113)
**Tokens:** src/styles/tokens.css
**Referência:** .claude/linear-design-reference.md
**Tipografia:** Inter Variable (pesos 400/510/590)
**Cor primária:** #5e6ad2 (azul dessaturado — estilo Linear)
**Revisão em:** Quando tiver 3+ clientes — avaliar tema claro opcional

---

### [2026-04-18] — RLS multi-tenant com 1 policy por tabela

**Contexto:** Auditoria identificou 5 tabelas com policies USING(true) que bypassavam isolamento
**Decisão:** Remover TODAS as policies permissivas. Cada tabela tem exatamente 1 policy filtrando por workspace_id via workspace_members
**Motivo:** Segurança multi-tenant é não-negociável
**Impacto:** Toda nova tabela DEVE ter RLS ativado + policy workspace_isolation antes do primeiro uso

---

### [2026-04-20] — QR Code PIX via payload EMV/BR Code

**Contexto:** Clientes precisam pagar via PIX ao receber orçamento
**Decisão:** Gerar payload PIX no padrão EMV com CRC16 no backend (utils/pixPayload.js), converter em QR Code base64 via lib 'qrcode', injetar no template HTML
**Motivo:** Sem dependência de gateway de pagamento, funciona offline no PDF
**Impacto:** Configuração de chavePix nos workspace_settings é pré-requisito

---

### [2026-04-22] — Sanitização obrigatória de dados do usuário nos PDFs

**Contexto:** Auditoria identificou injeção de HTML nos templates via dados não sanitizados
**Decisão:** Função escapeHtml() obrigatória em TODA interpolação de dados do usuário no server.js
**Motivo:** Prevenir quebra de layout e injeção de conteúdo em documentos
**Impacto:** Todo novo campo de usuário interpolado em template DEVE passar por escapeHtml()

---

### [2026-04-23] — Idempotência por chave parcial em orçamentos e recibos

**Contexto:** Risco de duplicidade acidental em operações automáticas
**Decisão:** Coluna idempotency_key + índice único parcial (workspace_id, idempotency_key) WHERE NOT NULL
**Motivo:** Previne duplicidade sem bloquear múltiplos orçamentos legítimos
**Impacto:** Criação automática (agent) gera chave; criação manual (human) não gera

---

### [2026-04-25] — Evolution API como solução WhatsApp (futuro)

**Contexto:** Necessidade de conectar múltiplos WhatsApps (1 por cliente) no CRM
**Decisão:** Evolution API (open-source, brasileira, multi-instância) em VPS próprio
**Alternativas descartadas:** WAHA Core (1 sessão por instância), Cloud API Meta (custo por conversa), Z-API (pago)
**Motivo:** Multi-instância gratuita, self-hosted, comunidade BR ativa
**Impacto:** Pré-requisito: migrar backend para VPS 24h
