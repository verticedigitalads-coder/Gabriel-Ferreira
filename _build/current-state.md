# CRM Vértice Digital — Estado Atual
Última atualização: 16/04/2026

## Status de Infraestrutura

### Frontend
- Vercel: vertice-digital-crm.vercel.app ✅ online
- VITE_API_URL na Vercel: https://unrequited-mel-uneuphemistically.ngrok-free.dev

### Backend
- Render: crm-backend-82u0.onrender.com (free tier — dorme após 15 min)
- ⚠️ CORS bloqueado em produção quando Render dorme (preflight OPTIONS sem headers)
- Workaround ativo: ngrok local com domínio fixo + script .bat de auto-start no Windows
- UptimeRobot configurado (5 min interval) para manter Render acordado como backup
- GitHub Actions keep-alive rodando (mas intervalo muito grande pro free tier)

### Banco
- Supabase: crm-inteligente-v1 ✅ online
- Todas as migrations aplicadas

### Backend local (produção real atual)
- node server.js rodando no PC do Gabriel
- ngrok com domínio fixo: unrequited-mel-uneuphemistically.ngrok-free.dev
- Script .bat na pasta Inicializar do Windows (auto-start com o PC)
- PC configurado para não suspender (tela desliga em 5 min, PC fica ligado)

## Clientes Ativos

### FL Art Metal (metalúrgica)
- workspace_id: 72b024c0-42e4-4113-8bb0-81ba6eb720bd
- Segment: metalurgica
- Status: ativo, usando o CRM
- Usuário principal: verticedigital.ads@gmail.com (role: owner)

### GPP Móveis Planejados (marcenaria) — NOVO
- workspace criado mas usuário ainda não vinculado (pendência)
- Segment: marcenaria
- CNPJ: 36.956.622/0001-35
- Endereço: Rua Praia do Forte, 1071
- Telefone: (34) 99119-7181
- Contato principal: Gabriel (filho/executor) + mãe (administrativo)
- Status do contrato:
  - Gestão de tráfego: R$300/mês (pago à vista)
  - CRM implantação: R$750 (parcelado 2-3x)
  - CRM mensalidade: R$50/mês (a partir do mês seguinte)
  - Investimento anúncios: R$30/dia (10 dias teste)
- Nichos definidos: cozinha planejada, guarda-roupa, montagem de móveis
- Pendências de onboarding:
  - Acesso ao Facebook Ads
  - Chip exclusivo ou eSIM para WhatsApp Business
  - Fotos de trabalhos finalizados
  - Configurar workspace + usuário no CRM

## Fases Concluídas

### Infraestrutura
- ✅ Fase 1 — Correções técnicas
- ✅ Fase 2 — Dark theme + UX (Linear design system)
- ✅ Fase 10 — PWA instalável
- ✅ Infra — Backend no Render (parcial — CORS pendente no cold start)
- ✅ Infra — Warmup frontend (backendWarmup.ts + apiFetch com retry)
- ✅ Infra — GitHub Actions keep-alive
- ✅ Infra — Baseline migrations Supabase (schema completo sincronizado)

### Módulos
- ✅ Fase 3 — Contas a Receber
- ✅ Fase 4 — Fornecedores MVP
- ✅ Fase 5 — Estoque MVP + mobile
- ✅ Fase 7 — Comparador de Preços (histórico cotações)
- ✅ Fase 9 — Auditoria automações
- ✅ Fase 12 — Módulo Recibos (completo: store, tela, automação, PDF backend)
- ✅ Fase 13 — Configurações reestruturadas (4 tabs: Empresa, Documentos, Backup, Demo)
- ✅ Fase 14 — Onboarding de empresas (tela admin, rota backend, hook useIsAdmin)
- ✅ Fase 15 — Financeiro com status de pagamento (a_vencer/vencido/pago, marcarComoPago, exportar CSV, bug fix categoria/leadId/observacoes)
- ✅ Fase 16 — Comissão da planejadora (percentualComissao em settings, salvo por orçamento, visível internamente, embutida no total do PDF)
- ✅ Fase 17 — PDF agrupado (seleção múltipla, agrupamento por cliente, rota /api/gerar-orcamento-agrupado, formatOrcamento corrigido)
- ✅ Fase 18 — Template PDF profissional v2 (orcamento-v2.html, campos textoApresentacao/condicoesContrato/metodosPagamento em settings, backward compat v1)
- ✅ Fase 19 — Cores personalizáveis por empresa (corPrimaria em settings, color picker + presets + preview, aplicada em ambas rotas PDF v2)
- ✅ Fix Operacional — Navegação semanal (← →) + modal edição completa (título, data, prioridade, status, descrição) + touch targets 44px
- ✅ Fase 20 — Recibo PDF v2 (template dinâmico: cor, logo, dados empresa) + card Endereço no LeadDetail
- ✅ Fase 21 — Notificações locais (Browser Notification API): badge título aba, resumo ao abrir, intervalo 30min, banner dashboard, bell badge numérico
- ✅ Feature 7 — QR Code PIX nos PDFs (EMV/BR Code) + PIX Copia e Cola + botão "PIX WhatsApp" em Orçamentos e Recibos
- ✅ Feature 8 — Assinatura Digital nos PDFs (empresa: canvas persistido em settings; cliente: canvas salvo em orcamentos; ambas injetadas nos 4 templates)
- ✅ Fix PDF — Placeholders visíveis: safety net regex após todos os replaces nas 3 rotas PDF
- ✅ Fix PDF — Espaçamentos: orcamento-v2.html e recibo-v2.html compactados (objetivo: orçamento ≤2 páginas, recibo 1 página)
- ✅ Fix PDF — Itens zerados: filtro aplicado nas 4 iterações de itens (gerar-orcamento v1/v2, agrupado v1/v2)
- ✅ Auditoria: 6 bugs corrigidos (fetch sem .json no sequencial, injeção HTML nos PDFs, parâmetro valor ignorado em useLeadActions, NaN por valorOrcado/valor null em 5 arquivos, realtime sem cleanup no logout, logs com PII de clientes)

### Auditoria
- ✅ Fase 11 etapa 1 — Auditoria RLS (migration gerada, não executada integralmente)
- ✅ Validação geral — Build limpo, 0 erros críticos

## Releases
- v2.12.0 — Recibos + Configurações + warmup backend
- v2.14.0 — Onboarding multi-empresa + painel admin
- v2.15.0 — Financeiro com status de pagamento (Fase 15)
- v2.16.0 — Comissão da planejadora nos orçamentos (Fase 16)
- v2.17.0 — PDF agrupado por cliente + formatOrcamento (Fase 17)
- v2.18.0 — Template PDF profissional v2 (marcenaria + genérico, dados da empresa, apresentação, condições, métodos pagamento)
- v2.19.0 — Cores personalizáveis por empresa (Fase 19)
- v2.20.0 — Recibo PDF v2 (template dinâmico multi-empresa) + Endereço no LeadDetail
- v2.21.0 — Notificações locais (Browser Notification API) + badge título aba + bell badge numérico
- v2.22.0 — QR Code PIX nos PDFs (EMV/BR Code) + PIX Copia e Cola + botão PIX WhatsApp em Orçamentos e Recibos
- v2.23.0 — Assinatura digital nos PDFs (canvas empresa em Settings + canvas cliente em Orçamentos + injeção nos 4 templates)

## Implementações Prioritárias (definidas com cliente GPP)

### Ordem de execução

| # | Feature | Prioridade | Status |
|---|---------|-----------|--------|
| 1 | Financeiro com status (contas a pagar: vencido/a vencer/pago) | ALTA | ✅ Concluído (Fase 15) |
| 2 | Comissão da planejadora (multiplicador + % sobre subtotal) | ALTA | ✅ Concluído (Fase 16) |
| 3 | Múltiplos orçamentos agrupados por cliente | ALTA | ✅ Concluído (Fase 17) |
| 4 | Template PDF profissional (texto intro + condições + cores) | ALTA | ✅ Concluído (Fase 18) |
| 5 | Cores personalizáveis por empresa (configurações) | MÉDIA | ✅ Concluído (Fase 19) |
| 6 | Notificações push (PWA) | MÉDIA | ✅ Concluído (Fase 21) |
| 7 | QR Code PIX nos PDFs + PIX WhatsApp | BAIXA | ✅ Concluído (Feature 7) |
| 8 | Assinatura digital | MÉDIA | ✅ Concluído (Feature 8) |
| 9 | Pré-visualização AR de cômodo | INVIÁVEL | Descartado |

### Detalhes técnicos das features prioritárias

#### Feature 1 — Financeiro com status
Inspirado no faturegestao.com.br que a cliente GPP usa:
- Despesas com status: a_vencer (amarelo), vencido (vermelho), pago (verde)
- Botão "marcar como pago" com data de pagamento e forma
- Filtros por: status, período, categoria
- Categorias: gasto pessoal, material, funcionário, despesa fixa, variável
- Exportar Excel
- Substituir/evoluir o módulo Financeiro atual

#### Feature 2 — Comissão da planejadora
Lógica específica marcenaria:
- Peças: R$1.000
- Multiplicador 2x: mão de obra R$1.000 (subtotal R$2.000)
- Comissão planejadora: 5% sobre subtotal = R$100
- Total cliente vê: R$2.100 (mão de obra aparece R$1.100)
- Internamente: comissão = R$100 (visível só pro admin)
- Campo: percentualComissao em workspace_settings
- Não aparece no PDF do cliente — só no painel interno

#### Feature 3 — Múltiplos orçamentos agrupados
Dois cenários:
- Cenário A: 1 cliente → N orçamentos separados → enviar juntos em 1 PDF
- Cenário B: 1 orçamento com variações (ex: guarda-roupa branco vs colorido)
- Poder enviar PDF único com todos os orçamentos de um cliente
- Somatória opcional (mostrar total geral ou separado)

#### Feature 4 — Template PDF profissional
Baseado no modelo que GPP já usa:
- Texto de apresentação configurável ("Relatório inicial")
- Descrição por ambiente/item (Móvel A, B, C)
- Condições de contrato no rodapé (configurável via settings)
- Métodos de pagamento listados
- Logo + dados da empresa no topo
- Cores personalizáveis (Feature 5)

## Arquitetura Atual do Projeto

### Stack
- Frontend: React + TypeScript + Zustand + Vite
- Backend: Node.js + Express + Puppeteer (PDF)
- Banco: Supabase (PostgreSQL + Auth + RLS)
- Deploy: Vercel (frontend) + ngrok local (backend real)

### Estrutura de arquivos chave
- src/store/useStore.ts — store central com 14 slices
- src/store/slices/ — todos os slices Zustand
- src/types/index.ts — tipos centrais
- src/modules/ — módulos do CRM (cada um com sua pasta)
- src/lib/apiFetch.ts — wrapper fetch com retry para CORS
- src/lib/backendWarmup.ts — warmup do backend
- src/hooks/useIsAdmin.ts — controle de acesso admin
- src/hooks/useDefaultSettings.ts — defaults configuráveis
- server.js — backend (rotas: orçamento PDF, recibo PDF, CNPJ, OpenAI, admin)
- templates/ — orcamento.html, recibo.html (templates PDF)

### Padrões obrigatórios
- CSS: apenas CSS vars (nunca cores hardcoded Tailwind)
- Mobile-first: touch targets mínimo 44px
- Zustand slices: createXSlice(set, get) pattern
- snake_case (Supabase) ↔ camelCase (frontend) mapeamento obrigatório
- Commits semânticos + tags de release
- _build/ memory system (decisions.md, patterns.md, current-state.md)

## Pendências Técnicas (não-bloqueantes)
- setActiveModule não tipado no StoreState (usa any)
- notas/fornecedores/materiais/cotacoes não no initialize() (lazy load por módulo)
- ~10 arquivos com cores Tailwind hardcoded (pré-existentes)
- Bundle principal 884KB (considerar code-splitting futuro)
- Render como backup: adicionar SUPABASE_SERVICE_ROLE_KEY quando migrar
