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
Suprimentos Ativo Fornecedores MVP (CNPJ auto-fill ReceitaWS, modal CRUD completo, WhatsApp direto, badges categoria/status), Estoque MVP completo (cadastro, movimentações entrada/saída, alertas estoque baixo/crítico, dark theme), comparador de cotações (fix ts(2339) resolvido), Vínculo Orçamento→Estoque via BaixaEstoqueModal ao aprovar (Fase 5.2)

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

### Fase 10 — PWA Finalizado (08/04/2026)
- purpose "any maskable" no ícone 512x512 (vite.config.ts)
- workbox config: precache de assets + runtime caching (Google Fonts + Supabase API)
- meta tags Apple Mobile Web App adicionadas no index.html
- site.webmanifest estático removido (conflito com vite-plugin-pwa)
