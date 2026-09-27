# Changelog v1.0.0

## ✨ Novas funcionalidades

- Central de Ajuda com IA: 16 docs + `/api/help-chat` + HelpPanel lateral (`f8f24c4`)
- WorkspaceSwitcher vira bottom sheet com gatilho compacto no mobile (`04b280a`)
- Seletor de workspace no header para usuários multi-membership (`73e3751`)
- PDF v3: orçamento + recibo com cards numerados e `cor_destaque` por workspace (`a13fc24`)
- PDF v3.1: densidade compacta, logo maior e QR PIX opcional no recibo (`b7fab4d`)
- LGPD: páginas públicas `/privacidade` e `/termos` + aceite versionado obrigatório v2026-07-15 (`7c10482`)
- FieldHint em todos os campos das Configurações para redução de suporte (`32e0aa8`)
- Subtítulos explicativos em todos os módulos via HeaderGlobal (`438fb5f`)
- CTA WhatsApp na landing + aviso para conta sem workspace (`479e497`)

## 🐛 Correções

- Filtro de mês do Financeiro puxava dia 1 para o mês anterior (bug de timezone timestamptz) (`49dec92`)
- Financeiro não rolava no mobile (lista flex colapsada em 0px) + touch targets 44px (`bacab22`)
- Contas a Receber mobile: stats, dropdown, lista e overflow horizontal (`d720695`)
- Tabela de Estoque vira cards no mobile (`d0b4376`)
- Backdrop na Sidebar bloqueia bottom nav e scroll de fundo no mobile (`195fcb9`)
- Header mobile em 2 linhas + corrige `h1` fora de `@layer` (`d391d31`)
- Padding-bottom no main para conteúdo não ficar sob o bottom nav (`417bbf0`)
- Cards da lista de Orçamentos estouravam na horizontal no mobile (`282042d`)
- Scroller único no main em 6 telas (padrão `h-full` latente) (`17f4b8e`)
- `valorPorExtenso()` usava "cem" em vez de "cento" na faixa 101–199 (`07826a8`)
- Numeração duplicada nas condições de contrato do PDF removida (`17151a8`)
- IA real no Analisar Lead e Criar Lead com IA + banner de fallback (`ebeef97`)
- `help-chat` informa a tela ativa no system prompt (`00b7c51`)
- `createLead` sem descartar campos + remove colunas inexistentes `visita_orcamento_*` (`48b4dce`)
- Deps de `session.user.id` nos efeitos de termos e bootstrap (app desmontava ao refocar aba) (`c5f6f76`)
- Múltiplas memberships no boot causavam erro 406 + remove fallback FL nas rotas de PDF (`e45c1e3`)
- Filtro explícito de `workspace_id` em 29 updates/deletes em 10 slices (`2e95400`)
- Envia `empresa_logo_bg_url` no POST de orçamentos + `trust proxy` para Nginx (`2a2334e`)
- Fornecedores incluídos no bootstrap global do useStore (`e4f7636`)
- 6 correções pontuais: estoque, WhatsApp DDI, IA, dashboard, ajuda, visita (`79f21da`)
- Landing: remove depoimentos fictícios, stats não comprovados e promessa de self-service (`d752307`)

## 🔧 Melhorias

- AuthPage extraída em componentes + `landingContent` desacoplado (`34a6060`)
- WhatsApp comercial desacoplado do número de suporte na landing (`db8ff4b`)

## ⚠️ Breaking changes

- Escrita de `authenticated`/`anon` em `workspaces` e `workspace_members` revogada — apenas `service_role` via backend (`95fce92`)
- Policies RLS migradas de `= (SELECT … LIMIT 1)` para `IN (SELECT …)` — queries sem `.eq('workspace_id', ...)` explícito passam a retornar vazio (`2e95400`)
- `requireAuth` adicionado nas rotas de PDF e `/api/chat` — chamadas sem token resultam em 401 (`b337107`, `f640ef0`)
- CORS restrito por ambiente + webhook Evolution exige secret na URL (`46e3c1e`)
- Service Worker usa `NetworkOnly` para `*.supabase.co` — dados multi-tenant nunca em Cache Storage (`13e3857`)
