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
Suprimentos Ativo Fornecedores MVP (CNPJ auto-fill ReceitaWS, modal CRUD completo, WhatsApp direto, badges categoria/status), estoque, comparador de cotações
Notas Ativo CRUD básico de notas fiscais
Settings Ativo Configurações gerais 4. Padrões Identificados

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
