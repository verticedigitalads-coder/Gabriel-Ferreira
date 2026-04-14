# Estado Atual do Sistema — CRM

> Gerado em: [DATA]
> Atualizar sempre que houver mudança estrutural significativa.

---

[1. Mapa de Estrutura

src/
├── components/ui/ → Primitivos de UI reutilizáveis (Button, Card, Modal, Toast, Badge, Input)
├── modules/ → Domínios de negócio (um diretório por módulo)
│ ├── auth/ → Login via Supabase Auth
│ ├── dashboard/ → KPIs executivos + stats cards
│ ├── leads/ → Gestão completa de oportunidades (lista, form, detalhe, IA)
│ ├── kanban/ → Visualização por status com @dnd-kit
│ ├── orcamentos/ → CRUD de propostas + geração de PDF
│ ├── financeiro/ → Controle de receitas/despesas/comissões
│ ├── operacional/ → Agendamento de tarefas + calendário semanal/mensal
│ ├── suprimentos/ → Fornecedores, estoque, cotações
│ ├── notas/ → Notas fiscais
│ ├── ia/ → Análise estratégica de leads (local + OpenAI)
│ ├── central/ → "O que fazer agora" — modo execução
│ └── settings/ → Configurações
├── store/
│ ├── useStore.ts → Store raiz: monta slices + realtime + initialize()
│ ├── slices/ → 11 slices (um por domínio de dados)
│ └── selectors/ → Estado derivado memoizado (leads filtrados, dashboard stats)
├── services/ → Lógica pura de integração externa (Supabase, automação, IA)
├── domain/ → Regras de negócio puras sem efeitos colaterais
├── layout/ → MainLayout, Sidebar, HeaderGlobal
├── lib/ → Inicialização de Supabase, IndexedDB, priority helpers
├── hooks/ → useLeadActions, useDebounce
├── types/ → 25+ tipos TypeScript (377 linhas)
└── utils/ → cn (classNames), date helpers

backend/
└── server.js → Express: proxy OpenAI + geração PDF via Puppeteer 2. Fluxo de Dados
Padrão CRUD padrão

Componente React
→ useStore() action (ex: addLead)
→ service function (ex: createLead — supabase.from('leads').insert())
→ Supabase PostgreSQL
← Realtime subscription detecta INSERT/UPDATE/DELETE
→ set(state => ...) atualiza o slice
→ Componentes re-renderizam via useStore selector
Fluxo concreto: Lead → Orçamento → Fechamento

LeadForm → addLead()
→ createLead() via Supabase
→ [auto] cria OperacionalTask por temperatura do lead
↓
LeadDetail → "Marcar como Orçado"
→ updateLead({ status: 'orcado', valorOrcado })
→ criarOrcamentoFromLead() → addOrcamento() via Supabase
↓
Orcamentos.tsx → "Gerar PDF"
→ POST /api/gerar-orcamento (server.js)
→ Puppeteer renderiza HTML → retorna PDF binário
↓
LeadDetail → "Marcar como Fechado"
→ updateLead({ status: 'fechado' })
→ [auto] cria OperacionalTask tipo 'execucao'
Fluxo IA

IAAssistente → analyzeLeadWithIA() [iaService.ts]
→ Calcula risco/urgência/estratégia por regras locais (funciona offline)
→ Se online: POST /api/chat → OpenAI gpt-4o-mini → refinamento
→ Exibe análise + sugestão de mensagem WhatsApp 3. Módulos Ativos
Módulo Status O que faz
Leads Ativo CRUD completo, histórico, ações rápidas (WhatsApp), automação de tarefas
Kanban Ativo Visualização por status com drag-and-drop
Orçamentos Ativo Criação de propostas, cálculo de totais, geração de PDF
Financeiro Ativo Receitas/despesas/comissões por mês, realtime
Operacional Ativo Agendamento de tarefas, calendário semana/mês, prioridades
IA Assistente Ativo Análise estratégica, sugestão de abordagem, score de risco
Dashboard Ativo 18+ métricas calculadas, score comercial e operacional
Central Ativo Top 7 leads por urgência + receita travada + execution score
Suprimentos Ativo Fornecedores MVP (CNPJ auto-fill ReceitaWS, modal CRUD completo, WhatsApp direto, badges categoria/status), Estoque MVP completo (cadastro, movimentações entrada/saída, alertas estoque baixo/crítico, dark theme), Comparador de Preços completo (Fase 7: tabela de cotações, modal nova cotação, LineChart por fornecedor, tabela resumo Menor/Maior preço, delete, recharts), Vínculo Orçamento→Estoque via BaixaEstoqueModal ao aprovar (Fase 5.2)

## Fase 5.3 — Melhorias Operacionais (08/04/2026)

| Item | Arquivo | O que foi feito |
|---|---|---|
| WhatsApp no Kanban | Kanban.tsx | Botão WhatsApp verde no rodapé do SortableLeadCard, visível só se lead.telefone existir, e.stopPropagation() |
| Observação rápida no Kanban | Kanban.tsx | Ícone StickyNote no rodapé do card com popover inline (textarea + botão Salvar), ponto indicador se observação existir, fecha ao clicar fora |
| Registrar Contato real | LeadDetail.tsx | Modal com textarea "O que foi tratado?" + input "Próximo contato", chama updateLead com ultimoContato, proximoContato e nova entrada HISTORICO_TIPO.CONTATO no histórico, toast de sucesso |
| Status de produção | Operacional.tsx | Pills pendente/em_produção/pronto/instalado nas tarefas pendentes de "Hoje", badge de status na lista "Próximos Dias", cores cinza/azul/verde/roxo |
Notas Ativo CRUD básico de notas fiscais
Settings Ativo Configurações gerais 4. Padrões Identificados

## Fase 5.4 — Responsividade Mobile (08/04/2026)

| Arquivo | O que foi corrigido |
|---|---|
| `Button.tsx` | `min-h-[44px]` nos sizes `sm` e `md` — touch target mínimo global |
| `Modal.tsx` | Header `px-4 py-3 md:px-6 md:py-4`, botão fechar `p-2 min-w/h-[44px]` |
| `MainLayout.tsx` | Header `px-3 md:px-6`, hamburguer `p-2 min-w/h-[44px]`, info do usuário `hidden md:block`, main `p-4 md:p-6` |
| `Sidebar.tsx` | Botão fechar `p-2 min-w/h-[44px]`, itens do menu `min-h-[44px] md:min-h-0` |
| `Kanban.tsx` | Header `p-4 md:p-6`, scroll area `p-2 md:p-6`, popover `right-0 max-w-[calc(100vw-2rem)]`, botões de ação `min-h-[44px] px-2 py-2` |
| `Operacional.tsx` | Container `p-4 md:p-6`, inputs/select `min-h-[44px]`, toggle `py-2.5 min-h-[44px]`, pills `py-1.5`, ícone buttons `p-2 min-h/w-[44px]`, modal buttons `py-2` |
| `LeadDetail.tsx` | Header/content `p-4 md:p-6`, grid ações `grid-cols-1 sm:grid-cols-2`, truncate em telefone e email, modal bodies `p-4 md:p-6` |
| `LeadsList.tsx` | Header `p-4 md:p-6 flex-wrap`, h1 `text-xl md:text-2xl`, search `min-w-0 w-full`, lista `p-4 md:p-6`, telefone `truncate`, coluna direita `shrink-0 max-w-[110px]` |
| `Dashboard.tsx` | Container `p-4 md:p-8`, cards `p-4 md:p-6`, gaps `gap-3 md:gap-6` |

**Regra aplicada:** mobile-first — valores menores sem prefixo, maiores com `md:`. Desktop inalterado.

## Auditoria de Automações — 08/04/2026

| Automação | Status |
|---|---|
| Kanban drag & drop | ✅ OK |
| Operacional — conclusão de tarefas | ✅ OK |
| Fechar Negócio | ✅ Corrigido (estava chamando console.log) |
| Contas a Receber — marcarComoRecebido | ✅ OK |
| Alertas topbar (atrasadas/hoje) | ✅ OK |
| Realtime — leads, orcamentos, operacional, transactions, contas_receber | ✅ OK |
| Realtime — fornecedores | ✅ Adicionado (faltava após Fase 4) |
| IA Assistente | ✅ OK |
Estado (Zustand)
Store raiz em useStore.ts compõe 11 slices via create()((...a) => ({ ...slice1(...a), ...slice2(...a) }))
Cada slice segue o padrão: estado[] + addX / updateX / deleteX assíncronos
Middleware persist salva no localStorage apenas: activeModule, filters, selectedLeadId
Realtime iniciado em startRealtime(): 4 canais ativos (leads, orcamentos, operacional, transactions)
Seletores memoizados em selectors/ para derivações pesadas
Serviços
Funções puras sem React, sem estado
Chamam supabase.from(tabela).insert/update/delete().select().single()
Retornam o dado inserido/atualizado diretamente
Componentes
Consomem dados via useStore(state => state.X) ou seletores
Chamam actions diretamente: const { addLead } = useStore()
Sem lógica de negócio pesada (delegam ao store)
Lazy-loaded por módulo em App.tsx
Domínio
Cálculos puros sem efeitos colaterais em src/domain/
calcularOrcamento({ itens, multiplicador, desconto }) → retorna { subtotal, total }
calculateOperationalUrgency() → score de urgência de tarefas
Nomenclatura
Supabase usa snake_case (workspace_id, lead_id, created_at)
TypeScript usa camelCase (workspaceId, leadId, createdAt)
Conversão feita manualmente dentro de cada slice ao receber dados do Supabase 5. Inconsistências Encontradas

# Localização Inconsistência

1 orcamentoSlice.ts vs leadSlice.ts Orcamentos tem função format() que converte snake→camel. Leads não tem — pode retornar snake_case do realtime
2 calcularOrcamento.ts + orcamentoSlice.ts + Orcamentos.tsx Lógica de cálculo de totais em 3 locais diferentes
3 updateLead() vs handleMarkAsOrcado() updateLead checa undefined antes de incluir campo no payload; handleMarkAsOrcado não
4 multiplicador ?? 1 vs `multiplicador
5 Histórico com strings hardcoded h.tipo === 'ia_analysis' — não usa enum, sujeito a typo
6 syncService.ts + db.ts (IndexedDB) Schema offline definido mas sincronização não implementada — dados offline podem se perder
7 Erros de console inconsistentes Alguns console.error('msg:', error), outros console.error(error) 6. Áreas Críticas
🔴 Máximo cuidado
useStore.ts — Store raiz (467 linhas)
Qualquer mudança aqui afeta 100% dos componentes. Realtime subscriptions aqui; sem unsubscribe em cleanup — chamar startRealtime() duas vezes causaria listeners duplicados (protegido por flag interna, mas frágil).

server.js — Geração de PDF (290 linhas)
Abre instância do Puppeteer a cada request sem pool. Template HTML com imagens base64 hardcodadas. Caminhos de arquivo relativos ao processo Node. Falha silenciosa se Puppeteer não encontrar Chromium.

leadSlice.ts — Automação integrada
addLead() chama get().addOperacionalTask() internamente. Modificar a assinatura de addOperacionalTask quebra a automação de leads sem aviso de TypeScript.

🟠 Cuidado elevado
dashboardSelectors.ts — 18+ métricas calculadas
Se a estrutura de Lead, Orcamento ou Transaction mudar, múltiplos cálculos quebram silenciosamente (valores viram NaN ou 0).

iaService.ts — 450+ linhas de lógica
Usa datas para calcular risco/urgência. Se o formato de historico[] ou createdAt mudar, as análises ficam incorretas sem erro explícito.

LeadDetail.tsx — 444 linhas
Componente monolítico. Orquestra: histórico, ações rápidas, análise IA, mark-as-orcado, mark-as-fechado. Uma mudança em qualquer ação pode afetar todas as outras silenciosamente.

Realtime subscriptions (4 canais)
Sem unsubscribe garantido em cleanup. Em ambientes com hot-reload intenso ou re-montagem de componente, pode acumular listeners.

Conversão snake_case → camelCase
Feita manualmente e de forma inconsistente entre slices. Adicionar novo campo no Supabase requer atualizar a conversão em cada slice relevante — fácil de esquecer.]

## Fase 7 — Comparador de Preços (08/04/2026)

| Arquivo | O que foi feito |
|---|---|
| `supabase/migrations/20260408200000_alter_cotacoes_materiais.sql` | NOVO — adiciona `material_id UUID REFERENCES materiais(id)` e `data DATE DEFAULT CURRENT_DATE` — ✅ executada no Supabase Dashboard (08/04/2026) |
| `src/types/index.ts` | Interface `CotacaoMaterial` atualizada: `materialId`, `materialNome`, `fornecedorNome`, `data` |
| `src/store/formatters.ts` | `formatCotacaoMaterial` mapeia novos campos com fallback para campo legado `material` |
| `src/store/slices/cotacaoMaterialSlice.ts` | Reescrito: `fetchCotacoesMateriais()` (SELECT com joins), `addCotacaoMaterial()` com `material_id`+`data`, `deleteCotacaoMaterial()` |
| `src/store/useStore.ts` | StoreState: adicionados `fetchCotacoesMateriais`, `deleteCotacaoMaterial`, `loadFornecedores` |
| `src/store/slices/fornecedorSlice.ts` | Adicionado `loadFornecedores()` (fetch por workspace) |
| `src/modules/suprimentos/ComparadorPrecos.tsx` | Reescrito completo: abas Lista/Histórico, modal Nova Cotação, LineChart recharts (uma linha por fornecedor), tabela resumo Menor/Maior preço, delete, CSS vars, mobile-first |
| `package.json` | `recharts` instalado |

## 11 Fixes UX/UI (09/04/2026)

| Fix | Arquivo(s) | O que foi feito |
|---|---|---|
| 1 — Moeda | `src/utils/formatters.ts` (NOVO) + 8 módulos | Criado `formatCurrency` central com `minimumFractionDigits: 2`. Removidas 8 definições locais (3 estavam com `minimumFractionDigits: 0`). Todos os módulos importam de `@/utils/formatters`. |
| 2 — Telefone | `LeadDetail.tsx`, `LeadsList.tsx` | Criado `formatPhone` em `formatters.ts`. Exibição aplica máscara `(XX) XXXXX-XXXX` / `(XX) XXXX-XXXX`. Dado salvo não é alterado. |
| 3 — WeekView tarefa | `OperacionalCalendar.tsx` | Título da tarefa com `line-clamp-2 break-words` + `title` tooltip. |
| 4 — WeekView cabeçalho | `OperacionalCalendar.tsx` | Abreviações "Seg/Ter/Qua..." em mobile (`lg:hidden`), nome completo em desktop (`hidden lg:block`). Mapa `DAY_ABBREV` para pt-BR. |
| 5 — WeekView overflow | `OperacionalCalendar.tsx` | `overflow-hidden` no container da coluna; `w-full max-w-full` no card da tarefa. |
| 6 — MonthView tooltip | `OperacionalMonthCalendar.tsx` | `title={task.titulo}` no container da pill. |
| 7 — Header truncate | `HeaderGlobal.tsx` | Removido `truncate` do `<h1>`. Adicionado `text-sm` para mobile. |
| 8 — Email vazio | `LeadDetail.tsx` | Email vazio exibe "Não informado" em itálico com `text-[var(--text-tertiary)]`. |
| 9 — Plural itens | `Orcamentos.tsx` | `1 item` / `N itens` com ternário. |
| 10 — Fornecedores empty | `Fornecedores.tsx` | Ícone `Truck` (lucide-react) acima do texto do empty state. |
| 11 — Sem valor | `LeadsList.tsx`, `Kanban.tsx`, `Dashboard.tsx` | `valorOrcado` falsy exibe "Sem valor" em `text-[var(--text-tertiary)]`. |

**Novo arquivo:** `src/utils/formatters.ts` — utilitários `formatCurrency` e `formatPhone` centralizados.

### Fase 10 — PWA Finalizado (08/04/2026)
- purpose "any maskable" no ícone 512x512 (vite.config.ts)
- workbox config: precache de assets + runtime caching (Google Fonts + Supabase API)
- meta tags Apple Mobile Web App adicionadas no index.html
- site.webmanifest estático removido (conflito com vite-plugin-pwa)

## Fase 11 — Etapa 1: Auditoria RLS e Preparação Multi-empresa (13/04/2026)

**Status:** Migration gerada — aguardando execução no Supabase Dashboard

**Auditoria (via scan do codebase):**

| Tabela | workspace_id | RLS confirmado | Situação |
|---|---|---|---|
| `contas_receber` | ✅ | ✅ | OK — migration anterior |
| `leads` | ✅ | ❓ | Pendente execução |
| `orcamentos` | ✅ | ❓ | Pendente execução |
| `transactions` | ✅ | ❓ | Pendente execução |
| `notas` | ✅ | ❓ | Pendente execução |
| `operacional_tasks` | ✅ | ❓ | Pendente execução |
| `fornecedores` | ✅ | ❓ | Pendente execução |
| `materiais` | ✅ | ❓ | Pendente execução |
| `cotacoes_materiais` | ✅ | ❓ | Pendente execução |
| `consumo_materiais` | ✅ | ❓ | Pendente execução |
| `workspaces` | — (raiz) | ❓ | Pendente execução |
| `workspace_members` | — (sistema) | ❓ | Pendente execução |

**Resumo:** 1 tabela OK, 11 pendentes de RLS/policy

**Migration gerada:** `supabase/migrations/20260413000000_fase11_rls_multiempresa.sql`

## INFRA — CORS Render Cold Start Fix (13/04/2026)

**Problema:** Render free tier dorme entre pings. No cold start, preflight OPTIONS retorna 404 sem headers CORS antes do Node.js acordar. PDF e CNPJ falhavam em produção.

**Solução implementada (2 frentes):**

| Arquivo | O que faz |
|---|---|
| `src/lib/backendWarmup.ts` | NOVO — `ensureBackendWarm()` faz GET `/` no backend com timeout 60s. Flag `isWarm` evita chamadas redundantes. Reset automático ao retornar à aba (`visibilitychange`). |
| `src/App.tsx` | Import + `useEffect(() => { ensureBackendWarm(); }, [])` adicionado ANTES do useEffect de init do store. |
| `.github/workflows/keep-alive.yml` | NOVO — GitHub Actions cron `*/5 * * * *` faz `curl` no Render a cada 5 min para evitar o sleep. |

**Status:** Aguardando push para ativar o GitHub Actions + teste de geração de PDF em produção.

## Fase 11.2 — Orçamentos adaptáveis por segmento (13/04/2026)

**Status:** Implementado — aguardando teste com workspace `segment='marcenaria'`

| Arquivo | O que foi feito |
|---|---|
| `src/types/index.ts` | `UnidadeOrcamento` type novo; `OrcamentoItem` com `unitType?`, `ambiente?`, `largura?`, `altura?`; `Orcamento` com `ambiente?`; `Workspace` com `segment?` |
| `src/domain/orcamento/calcularOrcamento.ts` | Exporta `calcularItemTotal()` separado; suporte a m² (largura × altura × qtd × valorUnit); backward-compatible sem unitType |
| `src/hooks/useWorkspaceSegment.ts` | NOVO — hook que busca `segment` do workspace no Supabase; default `'metalurgica'` |
| `src/modules/orcamentos/Orcamentos.tsx` | `unitOptionsBySegment` por segmento; select de unidade por item; campos largura/altura condicionais (m²); campo ambiente (marcenaria); `updateItem` usa `calcularItemTotal` |

**Pendências:**
- Adaptar geração de PDF para agrupar itens por `ambiente` (marcenaria)
- Testar com workspace `segment='marcenaria'` no Supabase Dashboard

---

## Infra — Migrations realinhadas via baseline completa (2026-04-14)

- **Baseline gerada:** `20260414010709_baseline_full_schema.sql` (878 linhas, dump completo do remoto)
- **Migrations antigas movidas para:** `supabase/migrations_backup/` (5 arquivos, não deletar)
- **Migration de diff do db pull:** `20260414010802_remote_schema.sql` — apenas `drop extension if exists "pg_net"` (artefato do shadow database do CLI, inofensivo)
- **Status:** schema local sincronizado com remoto — `supabase migration list` mostra ambas com local = remoto
- **Fonte da baseline:** `supabase/schema_full.sql` (sem edições — sem CREATE EXTENSION, sem roles internas)
- Idempotente (usa `DO $$ IF NOT EXISTS` para cada policy)
- Adiciona `workspaces.segment TEXT DEFAULT 'metalurgica'`
- Policy padrão `workspace_isolation` para 9 tabelas de negócio
- Policy `workspace_owner_access` para `workspaces`
- Policy `self_access` para `workspace_members`
- `contas_receber` mantém policy original (não recria)

---

## Fase 12 — Módulo Recibos: Base Implementada (13/04/2026)

**Status:** Implementado — aguardando execução da migration no Supabase Dashboard

| Arquivo | O que foi feito |
|---|---|
| `supabase/migrations/20260413010000_create_recibos.sql` | NOVO — tabela `recibos` com RLS `workspace_isolation`, índices em workspace/orcamento/status |
| `src/types/index.ts` | Adicionados `ReciboStatus` e interface `Recibo` com mapeamento camelCase completo |
| `src/store/slices/reciboSlice.ts` | NOVO — `fetchRecibos`, `addRecibo`, `updateRecibo`, `deleteRecibo`, `emitirRecibo` (gera REC-{ANO}-{SEQ}) |
| `src/store/useStore.ts` | Import + StoreState + spread de `createReciboSlice` + `fetchRecibos` no `initialize()` |
| `src/modules/recibos/Recibos.tsx` | NOVO — lista com badges de status, botões Emitir/PDF/Editar/Cancelar, modal criar/editar |
| `src/layout/Sidebar.tsx` | Item `{ id: 'recibos', label: 'Recibos', icon: Receipt }` adicionado após 'orcamentos' |
| `src/App.tsx` | Lazy import de `Recibos` + condicional `activeModule === 'recibos'` no `ModuleRouter` |
| `src/modules/orcamentos/Orcamentos.tsx` | `saveOrcamento` captura ID do orçamento inserido; cria pré-recibo automaticamente ao aprovar |

**Automação:** Ao aprovar um orçamento (novo ou editado), `saveOrcamento` verifica se já existe recibo vinculado (`orcamentoId`) e, se não, cria pré-recibo com status `pendente`.

**Número sequencial:** formato `REC-{ANO}-{SEQ_3_DIGITOS}` (ex: `REC-2026-001`), gerado pela função `emitirRecibo`.

**Fase 12 completa — todos os arquivos implementados.**

---

## Fase 12.2 — Recibos: Rota Backend PDF + Template HTML (13/04/2026)

| Arquivo | O que foi feito |
|---|---|
| `templates/recibo.html` | NOVO — template A4 com mesma estrutura do `orcamento.html`: logo, barra laranja, dados do cliente, declaração de recebimento, tabela de itens, total, observações, linha de assinatura, rodapé com data por extenso e logo watermark |
| `server.js` | NOVO — função `valorPorExtenso(valor)` (pt-BR, até 999.999,99); função `dataExtenso(dataStr)` (ex: "Uberaba, 13 de abril de 2026"); rota `POST /api/gerar-recibo` com Puppeteer idêntico à rota de orçamento |
| `src/modules/recibos/Recibos.tsx` | `generateReciboPDF(recibo)` adicionada; botão PDF (status === 'emitido') chama a função real em vez do stub |

**Pendências:**
- Executar migration `20260413010000_create_recibos.sql` no Supabase Dashboard
- Deploy backend no Render com nova rota `/api/gerar-recibo`

---

## Fase 13 — Reestruturação do Módulo Configurações (14/04/2026)

| Arquivo | O que foi feito |
|---|---|
| `supabase/migrations/20260414020000_create_workspace_settings.sql` | NOVO — tabela `workspace_settings` (key/value por workspace) com RLS `workspace_isolation` — aguardando execução |
| `src/store/slices/settingsSlice.ts` | NOVO — `WorkspaceSettings` interface; `fetchSettings`, `updateSetting`, `updateSettings`; mapeamento camelCase↔snake_case |
| `src/store/useStore.ts` | Import + spread de `createSettingsSlice`; StoreState atualizado; `fetchSettings` chamado no `initialize()` |
| `src/modules/settings/Settings.tsx` | REESCRITO — 4 tabs: Empresa, Documentos, Backup e Dados, Ambiente Demo; CSS vars; mobile-first; operações de limpeza via Supabase |
| `src/layout/Sidebar.tsx` | Seção "Dados" removida; `handleExport`, `handleImport`, `exportData`, `importData` removidos |
| `src/hooks/useDefaultSettings.ts` | NOVO — hook que expõe valores de `settings` do store com fallbacks; pronto para integração futura nos formulários |

**Mudanças funcionais:**
- Export/Import movidos da Sidebar para tab "Backup e Dados" em Configurações
- Export agora usa Supabase diretamente (7 tabelas: leads, orcamentos, transactions, notas, recibos, operacional_tasks, fornecedores)
- Operações de limpeza migradas de IndexedDB → Supabase com ordem correta de FKs
- Reset completo requer digitação de "CONFIRMAR" (campo de texto, não apenas `window.confirm`)

**Pendências:**
- Executar migration `20260414020000_create_workspace_settings.sql` no Supabase Dashboard
- Integrar `useDefaultSettings` nos formulários de orçamento e recibo
- Usar dados da empresa (`empresaNome`, `empresaLogoUrl` etc.) nos templates PDF

---

## Validação Geral — 14/04/2026

**Build:** ✅ Limpo — 0 erros TypeScript, 0 erros de build. 6.03s. Avisos não-críticos: bundle 884KB (pré-existente), `@import` CSS ordering (pré-existente).

**Resultado:** APTO PARA COMMIT

| Etapa | Status | Observação |
|---|---|---|
| Build | ✅ | Limpo, sem erros |
| Imports | ✅ | Todos os arquivos novos/alterados com imports corretos |
| Store | ✅ | Todos os slices registrados; fetchSettings no initialize() |
| CSS vars | ⚠️ | Settings.tsx novo usa só CSS vars; ~10 arquivos pré-existentes com cores hardcoded |
| Rotas App | ✅ | 15/15 módulos cobertos |
| Sidebar | ✅ | Seção Dados removida; imports e funções de export/import removidos |
| Arquivos novos | ✅ | 8/8 presentes |
| server.js | ✅ | GET /, POST /api/gerar-orcamento, POST /api/gerar-recibo, CORS ngrok header |

**Problemas não-críticos (fix futuro):**
- `setActiveModule` não tipado no StoreState (usa cast `any`) — pré-existente
- notas, fornecedores, materiais, cotacoes não carregados no `initialize()` — design pré-existente (lazy via módulo)
- Cores Tailwind hardcoded em: App.tsx, AuthPage, IAAssistente, Financeiro, Notas, LeadsList, LeadForm, Kanban, OperacionalCalendar, ContasReceber — pré-existentes, nenhuma introduzida na Fase 13

---

## Fase 14 — Onboarding de Nova Empresa via Tela Admin (14/04/2026)

| Arquivo | O que foi feito |
|---|---|
| `src/hooks/useIsAdmin.ts` | NOVO — verifica `role='owner'` em `workspace_members` para o usuário logado; retorna `boolean` |
| `src/modules/admin/AdminEmpresas.tsx` | NOVO — tela admin: lista todos os workspaces (via backend), formulário para criar nova empresa (nome, segmento, email, senha temporária), toast de sucesso com credenciais |
| `server.js` | `GET /api/admin/workspaces` (lista workspaces via service_role, bypass RLS); `POST /api/admin/criar-empresa` (cria workspace + usuário auth + vínculo workspace_member como owner, tudo com service_role key) |
| `src/layout/Sidebar.tsx` | Seção "Admin" condicional — só aparece se `useIsAdmin()` retornar `true` (role='owner') |
| `src/App.tsx` | Lazy import de `AdminEmpresas` + rota `activeModule === 'admin'` no ModuleRouter |

**Fluxo de criação de empresa:**
1. Admin preenche formulário (nome, segmento, email, senha)
2. Frontend `POST /api/admin/criar-empresa` → backend com `SUPABASE_SERVICE_ROLE_KEY`
3. Backend cria workspace → cria usuário auth → vincula como owner
4. Retorna `{ workspace_id, user_id, email }` → toast com dados de acesso
5. Lista de workspaces recarrega automaticamente

**Isolamento garantido:** RLS pré-existente isola dados por `workspace_id` — nenhuma policy foi alterada.

**Build:** ✅ Limpo — 0 erros TypeScript, 0 erros de build. 5.35s. Chunk `AdminEmpresas` gerado com code-splitting.

**Pendências:**
- Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env` local e no Render (Settings → Environment)
- Buscar a key em: Supabase Dashboard → Settings → API → `service_role` (NÃO colocar no frontend)
