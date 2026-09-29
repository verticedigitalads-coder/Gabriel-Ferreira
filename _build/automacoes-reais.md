# Automações reais do CRM: auditoria só de leitura (29/09/2026)

## Contexto

A landing prometia "priorização automática por IA", mas ela estava quebrada desde c09f09ea (mar/2026). O objetivo aqui é ter a lista real do que o sistema faz sozinho, para escrever a copy sem prometer o que não existe. **Nenhum arquivo do projeto foi alterado.**

**Como foi verificado**
- **Código:** li a main no commit b44d130c, que está sincronizada com origin/main. Para cada item, rastreei quem chama o código e se o resultado é usado ou descartado.
- **Banco (MCP Supabase):** só SELECT agregado, somando os 6 workspaces, incluindo os de teste.
  - Não há nenhum trigger, nenhuma função em `public` e nem pg_cron/pg_net.
  - Os campos de data das tarefas (`operacional_tasks.data`) são `timestamptz`. As 90 tarefas estão gravadas à meia-noite UTC, e o banco roda em UTC.
- **Não verifiquei:**
  - se a Vercel e a VPS estão no commit b44d130c;
  - o comportamento em tempo de execução (não abri o app);
  - a geração real de PDF em produção.
- **Legenda:**
  - Prova: **BANCO** = já existe linha real gerada pela automação; **CÓDIGO** = só lido no código.
  - **SEMI** = um clique do usuário e o sistema faz o resto.
  - **Fuso** = o navegador em UTC-3 lê a data das tarefas como o dia anterior às 21h.

---

## 1. FUNCIONA (pode ir para a landing)

| # | Automação | Disparo → consequência | Onde | Prova | Visível? | Ressalva para a copy |
|---|---|---|---|---|---|---|
| F1 | Tarefa automática ao criar lead | Criar lead (form, IA ou CSV) → tarefa com data de hoje, conforme a temperatura: quente = "Criar orçamento" (alta), morno = "Entrar em contato" (média), frio = "Reativar lead" (baixa) | leadSlice.ts:44-75 | **BANCO**: 65 tarefas em 3 workspaces, última em 27/09 | Sim, aparece no Operacional; o toast não menciona a tarefa | Na importação de CSV sai 1 tarefa por lead, inclusive para lead já fechado (Settings.tsx:217) |
| F2 | Fechar negócio → tarefa de execução | Botão "Fechar Negócio" → status fechado + tarefa "Executar serviço" (SEMI) | leadSlice.ts:206-233, LeadDetail.tsx:78-84 | **BANCO**: 5 tarefas, todas em 27/09 (cara de teste) | Sim (toast) | Só pelo botão. Arrastar no Kanban não cria a tarefa (N5) |
| F3 | Marcar visita → tarefa na agenda | Botão "Marcar Visita" + data → tarefa do tipo visita (SEMI) | LeadDetail.tsx:96-108 | **BANCO**: 1 | Sim | — |
| F4 | Lead a partir de conversa colada (IA) | Colar conversa → IA (gpt-4o-mini via /api/chat) extrai os dados, cria o lead + tarefa da F1 + tarefa de visita se detectar visita, e avisa se o lead é duplicado (SEMI) | AILeadModal.tsx:86-144, ai.service.ts:618-671, :820 | **BANCO**: 3 leads "criado automaticamente via IA" | Sim | Se a IA falha, cai para uma heurística local sem avisar. A entrada "criado via IA" no histórico é descartada (Q1) |
| F5 | Prioridade do lead (crítico/alto/médio/baixo) | Toda carga ou atualização em tempo real do lead → pontuação por temperatura, dias sem contato, orçamento enviado, valor > 5k/10k e próximo contato vencido | formatters.ts:46-48, priority.ts:20-98 | **CÓDIGO**. prioridade_* está NULL em 74/74, o que é esperado: o valor é calculado na tela, não gravado | Sim: badge, ordem do Kanban, filtro, sino, Sidebar, Atenção Imediata | **É regra fixa, não IA.** Só vale desde fadba736 (27/09). A temperatura não pode ser alterada depois de criada (Q4), então o score fica preso à temperatura inicial |
| F6 | Kanban | Arrastar card → muda o status do lead (e só isso) | Kanban.tsx:80-95 → leadSlice.ts:122-138 | **CÓDIGO**. `leads` está na publicação realtime | Sim | Não cria tarefa, orçamento nem nada (N5) |
| F7 | Orçamento aprovado → pré-recibo | Salvar orçamento como "aprovado" → recibo "pendente" com itens e valor | Orcamentos.tsx:880-899 | **BANCO**: os 8 recibos existentes nasceram assim | Silencioso; o recibo aparece em Recibos | — |
| F8 | Orçamento → valor no lead | Salvar orçamento com lead → atualiza o valor orçado e a flag "orçamento enviado" do lead | Orcamentos.tsx:870-878 | **CÓDIGO** | Silencioso | Não muda o status do lead (N4) |
| F9 | Numeração de recibo | Botão "Emitir" → número sequencial REC-AAAA-NNN por workspace + data de emissão (SEMI) | reciboSlice.ts:164-216 | **BANCO**: 4 | Sim | — |
| F10 | Conta recebida → receita no Financeiro | Botão "Recebido" em Contas a Receber → lança transação de receita (SEMI) | contasReceberSlice.ts:137-175 | **BANCO**: 1 de 1 conta recebida tem a receita correspondente | Silencioso | — |
| F11 | PDF com a marca do cliente | Gerar PDF (orçamento, proposta agrupada ou recibo) → aplica logo, marca d'água, cor, dados da empresa e QR Code PIX com valor + copia e cola (SEMI) | Orcamentos.tsx:121-163, 207-250; Recibos.tsx:80-112; server.js:311, 767-916, 1210-1376, 1630-1787 | **CÓDIGO** + configuração: 3 de 6 workspaces têm nome, cor e PIX; 2 têm logo | Sim | Sem nome configurado, o PDF sai como **"Vértice Digital"** (useDefaultSettings.ts:12). Sem cidade do PIX, usa **"UBERABA"** (server.js:872). No recibo v2, o PIX é opcional |
| F12 | Consulta de CNPJ | Digitar 14 dígitos em Fornecedores → espera 0,8 s, consulta a ReceitaWS e preenche razão social, fantasia, telefone, e-mail, endereço, cidade e UF | Fornecedores.tsx:143-171, server.js:568-598 | **CÓDIGO** (4 de 4 fornecedores têm CNPJ, mas isso não prova que veio da consulta) | Sim | Depende da ReceitaWS pública (limite de consultas e timeout de 5 s). Se falhar: "preencha manualmente" |
| F13 | Atenção Imediata (Dashboard) | Abrir o Dashboard → lista leads críticos ativos há 5 dias ou mais sem contato | Dashboard.tsx:114-123, 260-319 | **CÓDIGO** | Sim | Herda a F5 |
| F14 | Previsão de receita | Abrir o Dashboard → potencial, provável (peso 70/40/15% por temperatura), conservadora (30%) e prevista por contas do mês | dashboardSelectors.ts:20-38, Dashboard.tsx:48-58 | **CÓDIGO** | Sim | "Provável" depende da temperatura, que não é editável (Q4) |
| F15 | Foco hoje | Abrir o Dashboard → top 5 leads por pontuação de ação | Dashboard.tsx:187-225, 582-601 | **CÓDIGO** | Sim | É uma terceira regra de pontuação, diferente da F5 |
| F16 | Comissão padrão | Novo orçamento → aplica o % de comissão configurado | Orcamentos.tsx:793, 804-806 | **CÓDIGO** | Sim | Validade e multiplicador padrão não são aplicados (Q9) |
| F17 | Marcar Orçado → orçamento em rascunho | Botão "Marcar Orçado" + valor → lead vira orçado + orçamento em rascunho com 1 item (SEMI) | leadSlice.ts:156-202, orcamentoAutomation.ts | ⚠ **Nunca rodou em produção**: 0 orçamentos "Gerado automaticamente" e data_orcamento NULL em 74/74 | Silencioso | O código parece correto, mas nunca foi exercitado. **Testar antes de prometer** |

---

## 2. EXISTE MAS ESTÁ QUEBRADA (consertar antes de prometer)

| # | Automação | O que promete | O que acontece de fato | Onde | Prova | Visível? |
|---|---|---|---|---|---|---|
| Q1 | **Histórico do lead** | "Registrar Contato" grava o texto no histórico; a IA registra análise e criação | `updateLead` só grava uma lista fixa de campos, e **`historico` não está nela**. `createLead` também não grava. Tudo é descartado desde 46b9af84 (09/03). Efeitos: a seção Histórico fica sempre vazia, o filtro "analisado/não analisado" da IA não funciona, o banner de onboarding da IA aparece sempre e o prompt da IA sempre recebe "Sem histórico" | leadSlice.ts:89-104, LeadDetail.tsx:110-131, lead.service.ts:8-30 | **BANCO: 0 de 74 leads com histórico** | O usuário vê "Contato registrado!", mas o texto some |
| Q2 | IA Assistente: "Executar Plano Estratégico" | "Atualizará status, temperatura e poderá criar ação operacional" | Salva só resumo, próximo contato e observações. **Status, temperatura e histórico são descartados** (mesma lista fixa da Q1). A tarefa de follow-up só é criada se houver mais de 3 dias desde o último contato; lead **nunca contatado não gera tarefa** | IAAssistente.tsx:127-186, 688-706; strategicDiagnosisService.ts:40-59 | **BANCO**: 1 plano aplicado, **0 tarefas "Follow-up"** | Toast "Estratégia aplicada com sucesso!" |
| Q3 | IA: atualizar lead duplicado | Atualiza o lead existente com os dados da nova conversa | Status, temperatura e histórico descartados | AILeadModal.tsx:146-178 | CÓDIGO | Toast de sucesso |
| Q4 | Editar lead (efeito colateral) | Mudar status ou temperatura no formulário | Não salva: mesma lista fixa. **A temperatura fica travada desde a criação**, o que afeta a F1, F5 e F14. O status só muda pelo Kanban ou pelos botões | LeadForm.tsx:58-59, 118, 124 | CÓDIGO | Toast "Lead atualizado com sucesso!" |
| Q5 | Contadores de tarefas "hoje/atrasadas" (sino, Saúde do CRM, cards do Dashboard) | Tarefas de hoje e atrasadas | Fuso: tarefa de hoje conta como **atrasada** e a de amanhã como **hoje** | dashboardSelectors.ts:40-60, NotificationsDropdown.tsx:39 | **BANCO**: 90 de 90 tarefas gravadas à meia-noite UTC | Sim, números errados |
| Q6 | Operacional: urgência e selo "CRÍTICA" | Ordena por urgência e destaca tarefas críticas | Fuso: tarefa de hoje ganha +50 (atrasada) em vez de +30, e **toda tarefa média de hoje vira CRÍTICA** | calculateOperationalUrgency.ts:19-34, OperacionalCalendar.tsx:46-51 | CÓDIGO + BANCO | Sim |
| Q7 | Operacional: seção "Hoje" | Lista as tarefas do dia | `t.data === 'AAAA-MM-DD'` nunca bate com timestamptz → **sempre mostra "Nenhuma tarefa para hoje"** | Operacional.tsx:49-51, 240-246 | CÓDIGO + BANCO | Sim |
| Q8 | Notificação do navegador + contador no título da aba | Ao abrir o app e a cada 30 min: "X para hoje \| Y atrasadas" | Pelo mesmo motivo da Q7, "para hoje" é sempre 0: só avisa atrasadas de dias anteriores. A contagem congela no momento em que o app abriu e o aviso de 30 min repete os mesmos números | useNotifications.ts:11-17, 45-95; MainLayout.tsx:25-27 | CÓDIGO + BANCO | Sim, se a permissão foi dada |
| Q9 | Validade e multiplicador padrão (Configurações) | Novo orçamento usa o padrão configurado | O formulário fixa **15 dias** e **×1** no código | Orcamentos.tsx:801-810 | **BANCO: nos workspaces com padrão de 5 dias, 95 de 101 orçamentos saíram com 15** | Silencioso |
| Q10 | Dashboard: card "Estoque Crítico" | Lista materiais abaixo do mínimo | Lê `m.estoque_minimo`, mas o formatter entrega `estoqueMinimo` → **sempre vazio**. E os materiais nem carregam na abertura do app | Dashboard.tsx:60-62 | **BANCO: 1 material abaixo do mínimo hoje, e o card mostra 0** | Sim |
| Q11 | Sino: "Estoque baixo" | Conta materiais abaixo do mínimo | O campo está certo, mas os materiais só carregam quando o usuário abre Estoque ou o Comparador → 0 até lá | NotificationsDropdown.tsx:40; Estoque.tsx:405 | CÓDIGO | Sim |
| Q12 | Sino e Saúde: "Contas atrasadas" | Conta contas vencidas | Conta só as marcadas **à mão** como "atrasado" (ver N1) | NotificationsDropdown.tsx:38, Dashboard.tsx:142 | **BANCO: 7 pendentes vencidas não contadas, 2 contadas** | Sim, subconta |
| Q13 | Saúde do CRM (visão geral) | SAUDÁVEL / ATENÇÃO / CRÍTICO | Herda Q5 e Q12. A meta mensal é **fixa em R$ 100.000 para todos** e não é configurável | Dashboard.tsx:91-181; useStore.ts:150 | CÓDIGO | Sim |
| Q14 | Baixa de estoque ao aprovar orçamento | O modal abre sozinho ao aprovar e o usuário vincula os itens (SEMI) | Lista de materiais vazia se o Estoque não foi aberto na sessão. Estoque insuficiente falha em silêncio, mas o toast diz "baixado". O motivo da baixa é descartado (sem histórico de movimentação) | Orcamentos.tsx:930-938, 1239-1258; materialSlice.ts:105-140 | CÓDIGO | Sim, com toast enganoso |
| Q15 | Dashboard: "Visitas hoje" | Visitas do dia | Fuso: a visita de hoje não aparece hoje | Dashboard.tsx:68-72 | CÓDIGO + BANCO | Sim |
| Q16 | Sincronização em tempo real entre dispositivos e usuários | Tudo sincroniza sozinho | `contas_receber` e `fornecedores` têm canal no app, mas **não estão na publicação realtime** do banco → não sincronizam. Leads, orçamentos, tarefas, transações e materiais sincronizam | useStore.ts:473-546 | **BANCO** (pg_publication_tables) | Silencioso |

---

## 3. NÃO EXISTE (você achava que tinha)

| # | Automação esperada | Realidade |
|---|---|---|
| N1 | Conta vencida vira "atrasado" sozinha | Não existe no front, em trigger nem em cron. Só manual. **BANCO**: 7 contas pendentes vencidas |
| N2 | Orçamento aprovado → conta a receber | Não existe. `addContaReceber` só é chamado pelo formulário manual (ContasReceber.tsx:441) |
| N3 | Orçamento aprovado → receita no Financeiro | Não existe. A receita só nasce ao marcar uma conta como recebida (F10) |
| N4 | Orçamento enviado ou aprovado → muda o status do lead (orçado/fechado) | Não existe. Só atualiza valor e flag (F8) |
| N5 | Kanban → Fechado cria tarefa de execução; Kanban → Orçado cria orçamento | Não existe. Só pelos botões do LeadDetail (F2, F17) |
| N6 | **Priorização por IA** | Não existe. É regra fixa (F5). A página de IA ainda usa uma segunda heurística local (`analyzeLeadWithIA`, iaService.ts:37, sem chamada de API) e o Dashboard usa uma terceira (F15) |
| N7 | Qualquer coisa com o app fechado | Não existe: 0 triggers, 0 funções, sem cron no banco nem no backend. Tudo roda no navegador enquanto o usuário usa o app. Sem e-mail, sem push do servidor, sem WhatsApp automático |
| N8 | Lembrete ou tarefa automática pela data de "próximo contato" | Não existe. A data só pesa no score e no Foco hoje |
| N9 | Histórico de movimentação de estoque | Não existe. O motivo é descartado (materialSlice.ts:105) |
| N10 | Meta mensal configurável | Não existe. Fixa em R$ 100.000 (useStore.ts:150) |
| N11 | Resposta ou envio automático no WhatsApp; lead criado a partir do WhatsApp | Não existe (ver Ocultos) |

---

## Módulos ocultos por flag (não prometer)

- **WhatsApp** (`MODULO_WHATSAPP_VISIVEL=false`):
  - O webhook da Evolution **continua ativo** e grava em silêncio as mensagens recebidas (server.js:2051-2142). O banco tem 3 mensagens e 1 instância.
  - O envio está bloqueado pelo flag no backend (server.js:2149-2153).
  - Não cria lead nem tarefa.
- **Notas** (`MODULO_NOTAS_VISIVEL=false`): 0 notas no banco e nenhuma automação encontrada no `notaSlice`.

## A landing de hoje contra a realidade (`landingContent.ts`)

| Linha | Texto atual | Status |
|---|---|---|
| 159 | "lead priorizado, nada perdido no WhatsApp" | Priorizado: OK (regra). "Nada perdido no WhatsApp": o módulo está **oculto** |
| 216-218 | "Gestão de Leads **com IA** — A IA analisa cada lead e atribui prioridade automática com base em valor, urgência e **histórico de contato**" | **FALSO** em dois pontos: não é IA (N6) e o histórico nunca é salvo (Q1). O que é verdade: prioridade automática por temperatura, valor, orçamento enviado e dias sem contato |
| 226 | "PDF com sua identidade visual, QR Code PIX integrado e assinatura digital" | OK (F11), depende de configuração |
| 234 | "Receita prevista, foco do dia, saúde do CRM e conversão por etapa" | Receita e foco: OK. Saúde: parcial (Q13). "Por etapa": não verificado |
| 242 | "tarefas por prioridade, alertas de atraso" | **Quebrado** (Q5–Q8): a tarefa de hoje aparece como atrasada |
| 278 | "**A IA** já começa a priorizar por valor, urgência e histórico de contato" | **FALSO** (N6, Q1) |
| mockup 182 | "Tarefas hoje 12" | Ilustrativo, mas a seção real "Hoje" está sempre vazia (Q7) |

## Achados fora do escopo (reportados, não corrigidos)

- IA Assistente, botão "Gerar Relatório": grava o estado mas nunca renderiza; o clique não faz nada visível (IAAssistente.tsx:36-37, 188-192).
- Novo orçamento, botão "Salvar Rascunho": fecha sem salvar (Orcamentos.tsx:1215-1227).
- `receitaMes` soma todas as receitas sem filtrar o mês (dashboardSelectors.ts:14-16). Hoje não é exibido.
- Causas comuns (para quando for consertar):
  - **Lista fixa de campos do `updateLead`** (leadSlice.ts:89-104): causa Q1–Q4.
  - **`new Date('AAAA-MM-DD…')` e comparação de string com `timestamptz`**: causa Q5–Q8 e Q15.

