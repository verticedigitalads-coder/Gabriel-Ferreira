# Plano — Redesign da interface do app (VRTX CRM)

Data: 10/11/2026
Referência (só visual e estrutura de tela, NUNCA copiar dados, textos de ajuda ou lógica):
- `_build/design-ref/app/` → protótipo "vrtxcrm-dashboard-visual-redesign" (React + Tailwind, dados fictícios em `src/data.ts`)

`_build/design-ref/` já está no `.gitignore`.

---

## Por que dá para fazer

- O protótipo é **só pele**: 5 mil linhas de tela com dados de mentira. O app real já tem os dados, as automações e os fixes de outubro.
- A linguagem visual é a mesma da landing nova (serif itálica, mono, laranja, cantos retos). As fontes e boa parte dos tokens já existem no projeto (`.lp-v2`).
- O trabalho é **trazer o visual para dentro de cada módulo real**, tela por tela, como foi feito na landing.

## O que NÃO pode quebrar (regras de todas as rodadas)

1. **Lógica intocada.** Nenhuma rodada mexe em slice, automação, formatter, RLS ou rota de backend, salvo indicação explícita. Só JSX e CSS dos módulos.
   - Continuam valendo: `updateLead` com retorno boolean + toast, guarda do N5 (fechar negócio sem duplicar tarefa), Atrasadas + "Mover para hoje", datas com `parseISO`/`format`, toasts de erro do Operacional.
2. **Celular primeiro.** O app é usado no celular (Mariana, obra). O protótipo troca o `BottomNav` por uma barra de chips: **NÃO adotar**. O `BottomNav`, o header mobile em 2 linhas e o padrão anti-colapso (`md:h-full`, `md:flex-1 md:overflow-y-auto`) ficam.
3. **Toque ≥ 44px**, CSS vars de `tokens.css`, `prefers-reduced-motion` desliga animações (contagem de números, barras, fade).
4. **Só o que existe.** Nada de número, coluna, campo ou função que o app não tenha. Exemplos do protótipo que NÃO entram:
   - Kanban com só 3 colunas (o real tem Novo · Em Atendimento · Orçado · Fechado · Perdido)
   - "Avançar etapa" no Operacional (o real usa as pills Pendente/Em produção/Pronto/Instalado)
   - Fornecedores com "materiais vinculados" e "último pedido" (não existem)
   - "WhatsApp comercial" na aba Pagamentos (não existe)
   - Textos de ajuda do `src/data/help.ts` do protótipo: vários estão errados. As respostas saem de `docs/help/*.md`, que são a fonte verdadeira.
5. **Nome**: "VRTX CRM" (nunca "VRTXCRM"). Sem "Gestão Comercial Inteligente" no topo do menu → usar "CRM para quem vende por orçamento" ou só "VRTX CRM".
6. **IA**: só a tela IA Assistente usa o roxo. O resto do app não vende IA.
7. Cada rodada = 1 commit, tsc + build, screenshots 1440/390 antes/depois, aceite do Gabriel no celular antes do push.

---

## O que entra, tela por tela

| Tela | O que o Gabriel quer | Observação técnica |
|---|---|---|
| **Base (shell)** | Fontes, títulos com destaque em itálico laranja, letra-fantasma ao fundo ("CE", "OR", "R$"), número grande à direita do título, menu numerado por seção | Componentes reutilizáveis: `PageMasthead`, `SectionHeading`, `Colophon` ("voltar ao painel"), `EmptyState`, `GhostLetters` |
| **Dashboard** | Previsão de receita com número que sobe, barra com meta e %, "R$" cortado ao fundo, Atenção imediata, faixas coloridas no Foco hoje (vermelho crítico, amarelo alto, azul médio) | Dados já existem (`dashboardSelectors`). Animação de contagem desligada em reduced-motion |
| **Operacional** | Replicar inteiro: Serviços em acompanhamento, Agenda da semana, Linha de produção (contagem por etapa), Fila de prioridade | Manter Atrasadas, Hoje, "Mover para hoje", pills e o calendário Semana/Mês reais. A Linha de produção é contagem por status, dado que já existe |
| **Kanban** | Ícones fogo/sol/gelo por temperatura, faixa colorida por prioridade, "voltar ao painel" em laranja | Manter as 5 colunas reais, o drag do `@dnd-kit` e o `markAsFechado` |
| **Central** | "Sala de comando", feed de ocorrências com severidade, número grande + "CE" cortado | Feed monta só com alertas que já existem (Saúde do CRM, críticos, contas atrasadas) |
| **Leads** | Lista mais informativa (status, temperatura, faixa de prioridade) | Manter busca, filtros, "Registrar contato" e o painel de detalhe |
| **Orçamentos** | **Prévia do orçamento ao lado da lista, com os itens inclusos**, sem abrir o editar | Itens já estão no orçamento (`itens`). Prévia é HTML, não o PDF real |
| **Recibos** | Tutorial 01 aprovar → 02 emitir → 03 marcar recebido; card "Orçamentos do ciclo" | Só UI. O tutorial some quando já houver recibos (ou vira faixa compacta) |
| **Financeiro** | Projeção da receita provável com número subindo e % da meta | Mantém filtro de mês, status, CSV, "Resultado do mês" |
| **Contas a Receber** | Visual explicativo, "CR" ao fundo, diagnóstico de atraso | Mantém o fluxo recebido → lança no Financeiro |
| **IA Assistente** | Roxo, sessão, sugestões embaixo, **e o "Analisar lead" que já existe** | Não remover nada da IA atual; o banner "Análise simplificada — IA indisponível" continua |
| **Fornecedores** | Novo visual (escolher entre as 3 propostas) | **Proposta 1** (diretório A–Z com CNPJ, contato, categoria, cidade) é a que bate com os dados reais. Mantém a busca por CNPJ |
| **Estoque** | Os 2 prints: cards "abaixo do mínimo", contadores, barra nível × mínimo, últimas movimentações | Dados existem (materiais + movimentações, Fase 5.1). Conferir o nome real das colunas via MCP |
| **Configurações** | **Prévia do orçamento ao vivo** mudando cor, logo e dados | Prévia em HTML que imita o PDF v3.1 (não chama o Puppeteer). Aviso "prévia aproximada" |
| **Central de Ajuda** | Perguntas já respondidas por módulo + painel do "?" com "Me explique esta tela", histórico e suporte | Respostas a partir de `docs/help/*.md`. Pergunta já feita → resposta do histórico, sem chamar a IA (0 token). Pergunta nova → `/api/help-chat` como hoje |
| **Cards de cadastro** | Modais novos (Novo lead, Novo orçamento, Nova tarefa, etc.) | **Só a pele** dos formulários atuais. Campos, validações e gravação continuam os de hoje |

---

## Rodadas (1 commit cada)

| # | Rodada | Risco |
|---|---|---|
| D0 | Base: fontes no app, tokens, componentes editoriais, Sidebar e Header novos (sem quebrar BottomNav/header mobile) | Médio: mexe no layout de todas as telas |
| D1 | Dashboard | Baixo |
| D2 | Operacional | **Alto**: tela mais usada, lógica recente (Atrasadas, toasts) |
| D3 | Kanban + Leads | Médio (drag, fechar negócio) |
| D4 | Central | Baixo |
| D5 | Orçamentos (com prévia) + Recibos (tutorial) | Médio (PDF agrupado, busca, PIX) |
| D6 | Financeiro + Contas a Receber | Médio (filtro de mês e fuso) |
| D7 | IA Assistente | Baixo |
| D8 | Fornecedores + Estoque | Baixo |
| D9 | Configurações (prévia ao vivo) | Médio (salvar settings) |
| D10 | Central de Ajuda + painel "?" com histórico | Médio (toca HelpPanel e `/api/help-chat`) |
| D11 | Cards de cadastro (modais) | Médio (formulários de 8 entidades) |
| D12 | Faxina: CSS morto, varredura de nomes/textos falsos, Lighthouse | Baixo |
| D13 | Refazer os prints da landing (`public/landing/desk-*.webp` e `mobile-*.webp`) com o app novo | Baixo (só imagens; conferir peso e `alt`) |

**Títulos do header (decisão de 10/11/2026):** a D0 manteve os nomes atuais de `HeaderGlobal.tsx` ("Dashboard *Executivo*", "Painel *Operacional*", "Modo *Execução*"…), com a última palavra em serif itálico laranja; nome de uma palavra só fica todo em sans. Os nomes do protótipo ("Sala de *comando*", "Funil *kanban*", "Agenda *operacional*" etc.) entram **na rodada de cada módulo**, não antes; trocar o nome é uma linha em `moduleNames`.

## Convivência com a cobrança

- Cobrança R1 (banco) e R2 (backend) não tocam telas → podem rodar antes ou entre rodadas D.
- **A D0 vem antes da cobrança R3**, para as telas novas de assinatura (checkout, bloqueio, Configurações > Assinatura) já nascerem no visual novo.
- Uma sessão do Claude Code por vez no repositório. Commit de cada rodada antes de começar a próxima.
