# Changelog v2.39.2

## ✨ Novas funcionalidades
- Busca por nome, telefone e endereço em orçamentos e recibos (9d8cdaa)
- WorkspaceSwitcher vira bottom sheet compacto no mobile (04b280a)
- Ocultar módulos Notas e WhatsApp via feature-flags.json (0cdc910)
- Landing: CTA WhatsApp + aviso para conta sem workspace (479e497)
- Landing: hero, prova social e rodapé reescritos (b44d130)
- IA real ativada em Analisar Lead e Criar Lead com IA + banner de fallback (ebeef97)

## 🐛 Correções
- Leads: criar tarefa de execução nas três portas sem duplicar (bd744fd)
- Leads: gravar status e temperatura pelo formulário, bloquear nas telas de IA (522b903)
- Leads: gravar histórico no updateLead e travar botão durante salvamento (3741ffc)
- Leads: derivar prioridade na leitura e zerar leads encerrados (fadba73)
- Orçamentos: travar seleção do PDF agrupado em um cliente (ef6d89e)
- Financeiro: filtro de mês corrigido (timezone timestamptz puxava dia 1 pro mês anterior) (49dec92)
- Financeiro: lista não rolava (flex colapsada em 0px) + touch targets 44px (bacab22)
- Financeiro/Recibos: gravar e ler datas no dia local (2c750fd)
- Operacional: corrigir fuso horário nas datas de tarefas (e9001ce)
- Contas a Receber mobile: stats em 2 colunas, dropdown, lista e largura corrigidos (d720695)
- Mobile: scroller único no main em 6 telas (padrão h-full latente) (17f4b8e)
- Mobile: tabela de Estoque vira cards no mobile (d0b4376)
- Mobile: backdrop na Sidebar + bloqueia bottom nav e scroll de fundo (195fcb9)
- Mobile: header em 2 linhas + corrige h1 fora de @layer (d391d31)
- Mobile: padding-bottom no main para conteúdo não ficar sob o bottom nav (417bbf0)
- Mobile: títulos e stats quebrando na vertical (4ff577f)
- Fornecedores: incluir no bootstrap global do useStore (e4f7636)
- Landing: remover depoimentos fictícios, stats não comprovados e promessa de self-service (d752307)
- Landing: remover promessa de IA e de WhatsApp inexistentes (fda3316)
- Criar lead: remove colunas inexistentes visita_orcamento_* que causavam 400 (48b4dce)
- Help-chat informa a tela ativa no system prompt (00b7c51)
- Deps de session.user.id nos efeitos de termos e bootstrap (c5f6f76)
- 6 correções pontuais: estoque, WhatsApp DDI, IA, dashboard, ajuda, visita (79f21da)

## 🔧 Melhorias
- Landing: desacoplar WhatsApp comercial do número de suporte (db8ff4b)
- Landing: extrair AuthPage em componentes + landingContent (34a6060)
- Mobile: expor WorkspaceSwitcher no mobile via CSS (14c9cdd)

## ⚠️ Breaking changes
- Escrita em `workspaces` e `workspace_members` revogada para `authenticated`/`anon` — apenas backend via `service_role` (95fce92)
- IDOR WhatsApp corrigido, auth obrigatória em rotas abertas, CORS restrito por ambiente (46e3c1e)
